import { describe, it, after, before } from 'node:test'
import assert from 'node:assert'
import { getTestDatabaseUrl, cleanupTestDatabase } from './utils/db.js'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'

import request from 'supertest'

import { makeApp } from '@evanp/activitypub-bot'

const BROWSER_TYPES = 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8'

const baseDir = dirname(fileURLToPath(import.meta.url))

describe('Homepage', async () => {
  const host = 'activitypubbot.test'
  const origin = `https://${host}`
  const databaseUrl = getTestDatabaseUrl()
  const tag = 'linux'
  const indexFileName = resolve(baseDir, '..', 'web', 'index.html')
  const logLevel = 'silent'

  let app = null

  const testData = {
    localDomain: host,
    usernames: ['linux'],
    remoteDomains: []
  }

  before(async () => {
    await cleanupTestDatabase(testData)
    const bots = (await import('../lib/bots.js')).default
    app = await makeApp({ databaseUrl, origin, bots, logLevel, indexFileName })
  })

  after(async () => {
    try {
      if (app) await app.cleanup()
    } finally {
      await cleanupTestDatabase(testData)
    }
  })

  describe('GET /', async () => {
    let response = null
    it('should work without an error', async () => {
      response = await request(app).get('/').set('Accept', BROWSER_TYPES)
    })
    it('should return 200 OK', async () => {
      assert.strictEqual(response.status, 200)
    })
    it('should return HTML', async () => {
      assert.strictEqual(response.type, 'text/html')
    })
    it('should include the application title', async () => {
      assert.ok(response.text.match(/<title>tags.pub<\/title>/))
    })
  })
})

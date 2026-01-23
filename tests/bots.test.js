import { describe, it } from 'node:test'
import assert from 'node:assert'
import request from 'supertest'

import { makeApp } from '@evanp/activitypub-bot'

describe('routes.inbox', async () => {
  const host = 'activitypubbot.test'
  const origin = `https://${host}`
  const databaseUrl = 'sqlite::memory:'
  const tag = 'linux'

  let bots = null
  let app = null

  it('can load the bots', async () => {
    bots = (await import('../lib/bots.js')).default
    assert.ok(bots)
    assert.strictEqual(typeof bots, 'object')
    console.dir(bots)
    assert.strictEqual(Object.keys(bots).length, 1)
    assert.ok(bots['*'])
    assert.strictEqual(typeof bots['*'], 'object')
  })

  it('can initialize the app', async () => {
    app = await makeApp(databaseUrl, origin, bots, 'silent')
    assert.ok(app)
    assert.strictEqual(typeof app, 'function')
  })

  describe('GET /user/{tag}', async () => {
    let response = null
    it('should work without an error', async () => {
      response = await request(app).get(`/user/${tag}`)
    })
    it('should return 200 OK', async () => {
      assert.strictEqual(response.status, 200)
    })
    it('should return AS2', async () => {
      assert.strictEqual(response.type, 'application/activity+json')
    })
    it('should return an object', async () => {
      assert.strictEqual(typeof response.body, 'object')
    })
    it('should return an object with an id', async () => {
      assert.strictEqual(typeof response.body.id, 'string')
    })
    it('should return an object with an id matching the request', async () => {
      assert.strictEqual(response.body.id, origin + `/user/${tag}`)
    })
    it('should return an object with a type', async () => {
      assert.strictEqual(typeof response.body.type, 'string')
    })
    it('should return an object with a type matching the request', async () => {
      assert.strictEqual(response.body.type, 'Service')
    })
    it('should return an object with a preferredUsername', async () => {
      assert.strictEqual(typeof response.body.preferredUsername, 'string')
    })
    it('should return an object with a preferredUsername matching the request', async () => {
      assert.strictEqual(response.body.preferredUsername, tag)
    })
    it('should return an object with a summary', async () => {
      assert.strictEqual(typeof response.body.summary, 'string')
    })
    it('should return an object with a name', async () => {
      assert.strictEqual(typeof response.body.name, 'string')
    })
    it('should return an object with a name matching the request', async () => {
      assert.strictEqual(response.body.name, `${tag} hashtag`)
    })
  })
})

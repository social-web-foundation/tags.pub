import { describe, it, before } from 'node:test'
import assert from 'node:assert'
import request from 'supertest'
import as2 from './utils/activitystreams.js'
import { makeApp } from '@evanp/activitypub-bot'
import { nockSetup, nockFormat, nockSignature } from '@evanp/activitypub-nock'
import { makeDigest } from './utils/digest.js'

describe('routes.inbox', async () => {
  const host = 'activitypubbot.test'
  const remote = 'social.example'
  const origin = `https://${host}`
  const databaseUrl = 'sqlite::memory:'

  let app = null

  before(async () => {
    const bots = (await import('../lib/bots.js')).default
    app = await makeApp(databaseUrl, origin, bots, 'silent')
    nockSetup(remote)
  })

  describe('Create activity to public inbox', async () => {
    let response = null
    let create = null
    let body
    let digest
    let signature
    const path = '/shared/inbox'
    const url = `${origin}${path}`
    const username = 'test1'
    const date = new Date().toUTCString()
    before(async () => {
      create = await as2.import({
        '@context': [
          'https://www.w3.org/ns/activitystreams',
          'https://purl.archive.org/miscellany'
        ],
        type: 'Create',
        actor: nockFormat({ username }),
        to: 'as:Public',
        id: nockFormat({ username, type: 'Create', num: 1 }),
        object: {
          type: 'Note',
          id: nockFormat({ username, type: 'Note', num: 2 }),
          attributedTo: nockFormat({ username }),
          to: 'as:Public',
          content: `
            <p>
              Hello, world!
              <a href='https://${remote}/tag/greeting'>#greeting</a>
            </p>
          `,
          tag: {
            type: 'Hashtag',
            href: `https://${remote}/tag/greeting`,
            name: '#greeting'
          }
        }
      })
      body = await create.write()
      digest = makeDigest(body)
      signature = await nockSignature({
        method: 'POST',
        username,
        url,
        digest,
        date
      })
    })

    it('should work without an error', async () => {
      response = await request(app)
        .post(path)
        .send(body)
        .set('Signature', signature)
        .set('Date', date)
        .set('Host', host)
        .set('Digest', digest)
        .set('Content-Type', 'application/activity+json')
      assert.ok(response)
      await app.onIdle()
    })
    it('should return 202 OK', async () => {
      assert.strictEqual(response.status, 202)
    })
    it('should have a share in the tag bot outbox', async () => {
      response = await request(app).get('/user/greeting/outbox/1')
      assert.strictEqual(response.status, 200)
      assert.strictEqual(typeof response.body, 'object')
      let found
      for (const item of response.body.items) {
        const ir = await request(app).get((new URL(item)).pathname)
        assert.strictEqual(ir.status, 200)
        assert.strictEqual(typeof ir.body, 'object')
        const activity = ir.body
        if (activity.type === 'Announce' &&
          activity.object.id === create.object.id) {
          found = activity
          break
        }
      }
      assert.ok(found)
    })
  })
})

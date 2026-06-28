import { describe, it, after, before } from 'node:test'
import assert from 'node:assert'
import request from 'supertest'
import {
  nockSetup,
  postInbox,
  nockFormat
} from '@evanp/activitypub-nock'

import { makeApp } from '@evanp/activitypub-bot'

describe('bots', async () => {
  const remoteHost = 'remote.bots.test'
  const thirdHost = 'third.bots.test'
  const relayUser = 'relay'
  const thirdUser = 'third'
  const host = 'bots.test'
  const origin = `https://${host}`
  const databaseUrl = 'sqlite::memory:'
  const tag = 'linux'
  const forceUnsubHost1 = 'forceunsubone.bots.test'
  const forceUnsubHost2 = 'forceunsubtwo.bots.test'
  const forceUnsubUser1 = 'forceunsubone'
  const forceUnsubUser2 = 'forceunsubtwo'

  let bots = null
  let app = null
  let relay1 = null
  let relay2 = null
  let forceUnsub1 = null
  let forceUnsub2 = null

  before(async () => {
    nockSetup(remoteHost)
    nockSetup(thirdHost)
    nockSetup(forceUnsubHost1)
    nockSetup(forceUnsubHost2)
    relay1 = nockFormat({ username: relayUser, domain: remoteHost })
    relay2 = nockFormat({ username: thirdUser, domain: thirdHost })
    forceUnsub1 = nockFormat({ username: forceUnsubUser1, domain: forceUnsubHost1 })
    forceUnsub2 = nockFormat({ username: forceUnsubUser2, domain: forceUnsubHost2 })
    process.env.FORCE_UNSUBSCRIBE = [forceUnsub1, forceUnsub2].join(',')
  })

  after(async () => {
    if (app) {
      await app.cleanup()
    }
  })

  it('can load the bots', async () => {
    process.env.RELAYS = [relay1,relay2].join(',')
    bots = (await import('../lib/bots.js')).default
    assert.ok(bots)
    assert.strictEqual(typeof bots, 'object')
    assert.strictEqual(Object.keys(bots).length, 4)
    assert.ok(bots['*'])
    assert.strictEqual(typeof bots['*'], 'object')
  })

  it('can initialize the app', async () => {
    app = await makeApp({ databaseUrl, origin, bots, logLevel: 'silent' })
    assert.ok(app)
    assert.strictEqual(typeof app, 'function')
  })

  describe('GET /user/_____relay_____', async () => {
    let response = null
    it('should work without an error', async () => {
      response = await request(app).get(`/user/_____relay_____`)
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
      assert.strictEqual(response.body.id, origin + `/user/_____relay_____`)
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
    it('should return an object with a summary', async () => {
      assert.strictEqual(typeof response.body.summary, 'string')
    })
    it('should return an object with a name', async () => {
      assert.strictEqual(typeof response.body.name, 'string')
    })
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
      assert.strictEqual(response.body.name, `#${tag}`)
    })
    it('should return an object with an icon', async () => {
      assert.ok(response.body.icon)
    })
  })

  it('subscribes to a remote relay on initialize', async () => {
    await app.onIdle()
    assert.equal(postInbox[relayUser], 1)
    assert.equal(postInbox[thirdUser], 1)
  })

  describe('GET /user/_followback', async () => {
    let response = null
    it('should work without an error', async () => {
      response = await request(app).get(`/user/_followback`)
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
  })

  describe('GET /user/_relayclient', async () => {
    let response = null
    it('should work without an error', async () => {
      response = await request(app).get(`/user/_relayclient`)
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
    it('should return an object with an id matching the request', async () => {
      assert.strictEqual(response.body.id, origin + `/user/_relayclient`)
    })
    it('should return an object with type Application', async () => {
      assert.strictEqual(response.body.type, 'Application')
    })
  })

  it('sends an unsubscribe to each FORCE_UNSUBSCRIBE actor on initialize', async () => {
    await app.onIdle()
    assert.equal(postInbox[forceUnsubUser1], 1)
    assert.equal(postInbox[forceUnsubUser2], 1)
  })
})

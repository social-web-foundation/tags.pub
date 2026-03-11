import { describe, it, before, after } from 'node:test'
import assert from 'node:assert'
import request from 'supertest'
import as2 from './utils/activitystreams.js'
import { makeApp } from '@evanp/activitypub-bot'
import { nockSetup, nockFormat, nockSignature } from '@evanp/activitypub-nock'
import { makeDigest } from './utils/digest.js'

const nextNum = (() => {
  let num = 0
  return () => ++num
})()

async function shareInOutbox (app, username, objectId) {
  const response = await request(app).get(`/user/${username}/outbox/1`)
  assert.strictEqual(response.status, 200)
  assert.strictEqual(typeof response.body, 'object')
  let found
  for (const item of response.body.items) {
    const ir = await request(app).get((new URL(item)).pathname)
    assert.strictEqual(ir.status, 200)
    assert.strictEqual(typeof ir.body, 'object')
    const activity = ir.body
    if (activity &&
      activity.type === 'Announce' &&
      activity.object === objectId) {
      found = activity
      break
    }
  }
  return !!found
}

async function unshareInOutbox (app, username, objectId) {
  const r1 = await request(app).get(`/user/${username}/outbox`)
  assert.strictEqual(r1.status, 200)
  assert.strictEqual(typeof r1.body, 'object')
  const response = await request(app).get(`/user/${username}/outbox/1`)
  assert.strictEqual(response.status, 200)
  assert.strictEqual(typeof response.body, 'object')
  assert.strictEqual(response.body.items.length, r1.body.totalItems)
  let found
  for (const item of response.body.items) {
    const ir = await request(app).get((new URL(item)).pathname)
    assert.strictEqual(ir.status, 200)
    assert.strictEqual(typeof ir.body, 'object')
    const activity = ir.body
    if (activity &&
        activity.type === 'Undo' &&
        activity.object &&
        activity.object.type === 'Announce' &&
        activity.object.object &&
        activity.object.object.id === objectId) {
      found = activity
      break
    }
  }
  return !!found
}

describe('Tags in shared inbox', async () => {
  const host = 'activitypubbot.test'
  const remote = 'social.example'
  const origin = `https://${host}`
  const databaseUrl = 'sqlite::memory:'
  const noteId = nockFormat({ username: 'test1', type: 'Note', num: nextNum() })

  let app = null

  before(async () => {
    const bots = (await import('../lib/bots.js')).default
    app = await makeApp({ databaseUrl, origin, bots, logLevel: 'silent' })
    nockSetup(remote)
  })

  after(async () => {
    await app.cleanup()
  })

  describe('Create activity to public inbox with one tag', async () => {
    let response = null
    let create = null
    let body
    let digest
    let signature
    const path = '/shared/inbox'
    const url = `${origin}${path}`
    const username = 'test1'
    const date = new Date().toUTCString()
    const objectId = nockFormat({ username, type: 'Note', num: nextNum() })
    before(async () => {
      create = await as2.import({
        '@context': [
          'https://www.w3.org/ns/activitystreams',
          'https://purl.archive.org/miscellany'
        ],
        type: 'Create',
        actor: nockFormat({ username }),
        to: 'as:Public',
        id: nockFormat({ username, type: 'Create', num: nextNum() }),
        object: {
          type: 'Note',
          id: objectId,
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
      assert.ok(await shareInOutbox(app, 'greeting', objectId))
    })
  })

  describe('Create activity to public inbox with multiple tags', async () => {
    let response = null
    let create = null
    let objectId
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
        id: nockFormat({ username, type: 'Create', num: nextNum() }),
        object: {
          type: 'Note',
          id: noteId,
          attributedTo: nockFormat({ username }),
          to: 'as:Public',
          content: `
            <p>
              Hello, world!
              <a href='https://${remote}/tag/greeting'>#greeting</a>
              <a href='https://${remote}/tag/intro'>#intro</a>
              <a href='https://${remote}/tag/friendly'>#friendly</a>
            </p>
          `,
          tag: [{
            type: 'Hashtag',
            href: `https://${remote}/tag/greeting`,
            name: '#greeting'
          },
          {
            type: 'Hashtag',
            href: `https://${remote}/tag/intro`,
            name: '#intro'
          }, {
            type: 'Hashtag',
            href: `https://${remote}/tag/friendly`,
            name: '#friendly'
          }]
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
    it('should have a share in each tag bot outbox', async () => {
      assert.ok(await shareInOutbox(app, 'greeting', noteId))
      assert.ok(await shareInOutbox(app, 'intro', noteId))
      assert.ok(await shareInOutbox(app, 'friendly', noteId))
    })
  })

  describe('Update activity to public inbox with multiple tags', async () => {
    let response = null
    let update = null
    let body
    let digest
    let signature
    const path = '/shared/inbox'
    const url = `${origin}${path}`
    const username = 'test1'
    const date = new Date().toUTCString()
    before(async () => {
      update = await as2.import({
        '@context': [
          'https://www.w3.org/ns/activitystreams',
          'https://purl.archive.org/miscellany'
        ],
        type: 'Update',
        actor: nockFormat({ username }),
        to: 'as:Public',
        id: nockFormat({ username, type: 'Update', num: nextNum() }),
        object: {
          type: 'Note',
          id: noteId,
          attributedTo: nockFormat({ username }),
          to: 'as:Public',
          content: `
            <p>
              Hello, world!
              <a href='https://${remote}/tag/greeting'>#greeting</a>
              <a href='https://${remote}/tag/introduction'>#introduction</a>
            </p>
          `,
          tag: [{
            type: 'Hashtag',
            href: `https://${remote}/tag/greeting`,
            name: '#greeting'
          },
          {
            type: 'Hashtag',
            href: `https://${remote}/tag/introduction`,
            name: '#introduction'
          }]
        }
      })
      body = await update.write()
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
    it('should have a share for new tags', async () => {
      assert.ok(await shareInOutbox(app, 'introduction', noteId))
    })
    it('should have an undo share for removed shares', async () => {
      assert.ok(await unshareInOutbox(app, 'intro', noteId))
      assert.ok(await unshareInOutbox(app, 'friendly', noteId))
    })
  })

  describe('Delete activity to public inbox with multiple tags', async () => {
    let response = null
    let delact = null
    let body
    let digest
    let signature
    const path = '/shared/inbox'
    const url = `${origin}${path}`
    const username = 'test1'
    const date = new Date().toUTCString()
    before(async () => {
      delact = await as2.import({
        '@context': [
          'https://www.w3.org/ns/activitystreams',
          'https://purl.archive.org/miscellany'
        ],
        type: 'Delete',
        actor: nockFormat({ username }),
        to: 'as:Public',
        id: nockFormat({ username, type: 'Delete', num: nextNum() }),
        object: {
          type: 'Tombstone',
          id: noteId,
          formerType: 'Note'
        }
      })
      body = await delact.write()
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
    it('should have an undo share for removed shares', async () => {
      assert.ok(await unshareInOutbox(app, 'greeting', noteId))
      assert.ok(await unshareInOutbox(app, 'introduction', noteId))
    })
  })
})

import { describe, it, before, after } from 'node:test'
import assert from 'node:assert'
import request from 'supertest'
import nock from 'nock'
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

const AS = 'https://www.w3.org/ns/activitystreams#'
const FOLLOW_TYPE = `${AS}Follow`

async function findFollowId (app, username) {
  const { actorStorage, objectStorage } = app.locals
  for await (const item of actorStorage.items(username, 'outbox')) {
    const activity = await objectStorage.read(item.id)
    if (activity.type === FOLLOW_TYPE) {
      return activity.id
    }
  }
  return null
}

describe('Announce from a relay server via relay client', async () => {
  const host = 'activitypubbot.test'
  const relayHost = 'relay.relayclient.test'
  const authorHost = 'author.relayclient.test'
  const origin = `https://${host}`
  const databaseUrl = 'sqlite::memory:'
  const relayUsername = 'relay'
  const relayActor = nockFormat({ username: relayUsername, domain: relayHost })
  const botId = `${origin}/user/_relayclient`

  let app = null

  before(async () => {
    nockSetup(relayHost)
    nockSetup(authorHost)
    process.env.RELAYS = relayActor
    const bots = (await import('../lib/bots.js')).default
    app = await makeApp({ databaseUrl, origin, bots, logLevel: 'silent' })
    await app.onIdle()

    // Simulate the relay's Accept so _relayclient adds it to following.
    const followId = await findFollowId(app, '_relayclient')
    assert.ok(followId, 'expected a Follow in the _relayclient outbox')
    const acceptDate = new Date().toUTCString()
    const acceptPath = '/shared/inbox'
    const acceptUrl = `${origin}${acceptPath}`
    const accept = await as2.import({
      '@context': 'https://www.w3.org/ns/activitystreams',
      type: 'Accept',
      actor: relayActor,
      id: nockFormat({
        username: relayUsername,
        type: 'Accept',
        num: nextNum(),
        domain: relayHost
      }),
      object: {
        id: followId,
        type: 'Follow',
        actor: botId,
        object: 'as:Public'
      },
      to: botId
    })
    const acceptBody = await accept.write()
    const acceptDigest = makeDigest(acceptBody)
    const acceptSignature = await nockSignature({
      method: 'POST',
      username: relayUsername,
      url: acceptUrl,
      digest: acceptDigest,
      date: acceptDate,
      domain: relayHost
    })
    const acceptResponse = await request(app)
      .post(acceptPath)
      .send(acceptBody)
      .set('Signature', acceptSignature)
      .set('Date', acceptDate)
      .set('Host', host)
      .set('Digest', acceptDigest)
      .set('Content-Type', 'application/activity+json')
    assert.strictEqual(acceptResponse.status, 202)
    await app.onIdle()
  })

  after(async () => {
    await app.cleanup()
  })

  describe('Announce of a tagged Note by URL reference', async () => {
    let response = null
    let announce = null
    let body
    let digest
    let signature
    const path = '/shared/inbox'
    const url = `${origin}${path}`
    const date = new Date().toUTCString()
    const authorUsername = 'alice'
    const authorId = nockFormat({ username: authorUsername, domain: authorHost })
    const notePath = `/objects/note/${nextNum()}`
    const objectId = `https://${authorHost}${notePath}`

    before(async () => {
      const taggedNote = {
        '@context': [
          'https://www.w3.org/ns/activitystreams',
          'https://purl.archive.org/miscellany'
        ],
        type: 'Note',
        id: objectId,
        attributedTo: authorId,
        to: 'as:Public',
        content: `
          <p>
            Relayed hello!
            <a href='https://${authorHost}/tag/greeting'>#greeting</a>
          </p>
        `,
        tag: {
          type: 'Hashtag',
          href: `https://${authorHost}/tag/greeting`,
          name: '#greeting'
        }
      }

      nock(`https://${authorHost}`)
        .persist()
        .get(notePath)
        .reply(200, JSON.stringify(taggedNote), {
          'Content-Type': 'application/activity+json'
        })

      announce = await as2.import({
        '@context': [
          'https://www.w3.org/ns/activitystreams',
          'https://purl.archive.org/miscellany'
        ],
        type: 'Announce',
        actor: relayActor,
        to: `https://${relayHost}/user/${relayUsername}/followers`,
        id: nockFormat({
          username: relayUsername,
          type: 'Announce',
          num: nextNum(),
          domain: relayHost
        }),
        object: objectId
      })
      body = await announce.write()
      digest = makeDigest(body)
      signature = await nockSignature({
        method: 'POST',
        username: relayUsername,
        url,
        digest,
        date,
        domain: relayHost
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

  describe('Announce of a non-public Update', async () => {
    let response = null
    let announce = null
    let body
    let digest
    let signature
    const path = '/shared/inbox'
    const url = `${origin}${path}`
    const date = new Date().toUTCString()
    const authorUsername = 'bob'
    const authorId = nockFormat({ username: authorUsername, domain: authorHost })
    const updatePath = `/objects/update/${nextNum()}`
    const updateId = `https://${authorHost}${updatePath}`
    const noteId = `https://${authorHost}/objects/note/${nextNum()}`

    before(async () => {
      const privateUpdate = {
        '@context': [
          'https://www.w3.org/ns/activitystreams',
          'https://purl.archive.org/miscellany'
        ],
        type: 'Update',
        id: updateId,
        actor: authorId,
        to: `${authorId}/followers`,
        object: {
          type: 'Note',
          id: noteId,
          attributedTo: authorId,
          to: `${authorId}/followers`,
          content: `
            <p>
              Followers-only update!
              <a href='https://${authorHost}/tag/privategreeting'>#privategreeting</a>
            </p>
          `,
          tag: {
            type: 'Hashtag',
            href: `https://${authorHost}/tag/privategreeting`,
            name: '#privategreeting'
          }
        }
      }

      nock(`https://${authorHost}`)
        .persist()
        .get(updatePath)
        .reply(200, JSON.stringify(privateUpdate), {
          'Content-Type': 'application/activity+json'
        })

      announce = await as2.import({
        '@context': [
          'https://www.w3.org/ns/activitystreams',
          'https://purl.archive.org/miscellany'
        ],
        type: 'Announce',
        actor: relayActor,
        to: `https://${relayHost}/user/${relayUsername}/followers`,
        id: nockFormat({
          username: relayUsername,
          type: 'Announce',
          num: nextNum(),
          domain: relayHost
        }),
        object: updateId
      })
      body = await announce.write()
      digest = makeDigest(body)
      signature = await nockSignature({
        method: 'POST',
        username: relayUsername,
        url,
        digest,
        date,
        domain: relayHost
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

    it('should not share the content', async () => {
      assert.ok(!(await shareInOutbox(app, 'privategreeting', noteId)))
    })
  })

  describe('Announce from an actor not in the announceAllowList', async () => {
    let response = null
    let announce = null
    let body
    let digest
    let signature
    const path = '/shared/inbox'
    const url = `${origin}${path}`
    const date = new Date().toUTCString()
    const attackerUsername = 'eve'
    const attackerActor = nockFormat({ username: attackerUsername, domain: authorHost })
    const notePath = `/objects/note/${nextNum()}`
    const objectId = `https://${authorHost}${notePath}`

    before(async () => {
      const taggedNote = {
        '@context': [
          'https://www.w3.org/ns/activitystreams',
          'https://purl.archive.org/miscellany'
        ],
        type: 'Note',
        id: objectId,
        attributedTo: attackerActor,
        to: 'as:Public',
        content: `
          <p>
            Untrusted hello!
            <a href='https://${authorHost}/tag/untrusted'>#untrusted</a>
          </p>
        `,
        tag: {
          type: 'Hashtag',
          href: `https://${authorHost}/tag/untrusted`,
          name: '#untrusted'
        }
      }

      nock(`https://${authorHost}`)
        .persist()
        .get(notePath)
        .reply(200, JSON.stringify(taggedNote), {
          'Content-Type': 'application/activity+json'
        })

      announce = await as2.import({
        '@context': [
          'https://www.w3.org/ns/activitystreams',
          'https://purl.archive.org/miscellany'
        ],
        type: 'Announce',
        actor: attackerActor,
        to: 'as:Public',
        id: nockFormat({
          username: attackerUsername,
          type: 'Announce',
          num: nextNum(),
          domain: authorHost
        }),
        object: objectId
      })
      body = await announce.write()
      digest = makeDigest(body)
      signature = await nockSignature({
        method: 'POST',
        username: attackerUsername,
        url,
        digest,
        date,
        domain: authorHost
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

    it('should not share the content', async () => {
      assert.ok(!(await shareInOutbox(app, 'untrusted', objectId)))
    })
  })

  describe('Announce of a quiet-public Note (Public in cc)', async () => {
    let response = null
    let announce = null
    let body
    let digest
    let signature
    const path = '/shared/inbox'
    const url = `${origin}${path}`
    const date = new Date().toUTCString()
    const authorUsername = 'carol'
    const authorId = nockFormat({ username: authorUsername, domain: authorHost })
    const authorFollowers = nockFormat({
      username: authorUsername,
      collection: 'followers',
      domain: authorHost
    })
    const notePath = `/objects/note/${nextNum()}`
    const objectId = `https://${authorHost}${notePath}`

    before(async () => {
      const quietNote = {
        '@context': [
          'https://www.w3.org/ns/activitystreams',
          'https://purl.archive.org/miscellany'
        ],
        type: 'Note',
        id: objectId,
        attributedTo: authorId,
        to: authorFollowers,
        cc: 'as:Public',
        content: `
          <p>
            Quiet relayed hello!
            <a href='https://${authorHost}/tag/quietannounce'>#quietannounce</a>
          </p>
        `,
        tag: {
          type: 'Hashtag',
          href: `https://${authorHost}/tag/quietannounce`,
          name: '#quietannounce'
        }
      }

      nock(`https://${authorHost}`)
        .persist()
        .get(notePath)
        .reply(200, JSON.stringify(quietNote), {
          'Content-Type': 'application/activity+json'
        })

      announce = await as2.import({
        '@context': [
          'https://www.w3.org/ns/activitystreams',
          'https://purl.archive.org/miscellany'
        ],
        type: 'Announce',
        actor: relayActor,
        to: `https://${relayHost}/user/${relayUsername}/followers`,
        cc: 'as:Public',
        id: nockFormat({
          username: relayUsername,
          type: 'Announce',
          num: nextNum(),
          domain: relayHost
        }),
        object: objectId
      })
      body = await announce.write()
      digest = makeDigest(body)
      signature = await nockSignature({
        method: 'POST',
        username: relayUsername,
        url,
        digest,
        date,
        domain: relayHost
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

    it('should not share the quiet-public content', async () => {
      assert.ok(!(await shareInOutbox(app, 'quietannounce', objectId)))
    })
  })
})

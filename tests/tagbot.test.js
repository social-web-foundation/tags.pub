import { describe, it } from 'node:test'
import assert from 'node:assert'

describe('TagBot', async () => {
  it('can import TagBot', async () => {
    const { TagBot } = await import('../lib/tagbot.js')
    assert.ok(TagBot)
    assert.strictEqual(typeof TagBot, 'function')
  })
})

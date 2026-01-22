import { describe, it } from 'node:test'
import assert from 'node:assert'

describe('TagBotFactory', async () => {
  it('can import TagBotFactory', async () => {
    const { TagBotFactory } = await import('../lib/tagbotfactory.js')
    assert.ok(TagBotFactory)
    assert.strictEqual(typeof TagBotFactory, 'function')
  })
})

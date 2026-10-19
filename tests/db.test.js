import { it } from 'node:test'
import assert from 'node:assert/strict'
import { Sequelize } from 'sequelize'
import { runMigrations } from '@evanp/activitypub-bot/lib/migrations/index.js'
import { cleanupTestData } from './utils/db.js'

it('cleans fixture data without removing unrelated users, objects, or jobs', async (t) => {
  const connection = new Sequelize({ dialect: 'sqlite', storage: ':memory:', logging: false })
  t.after(() => connection.close())
  await runMigrations(connection)

  for (const [username, domain] of [
    ['fixture', 'fixture.cleanup.test'],
    ['unrelated', 'unrelated.cleanup.test']
  ]) {
    await connection.query(
      'INSERT INTO new_keys (username, public_key, private_key) VALUES (?, ?, ?)',
      { replacements: [username, 'public-key', 'private-key'] }
    )
    await connection.query(
      'INSERT INTO objects (id, data) VALUES (?, ?)',
      { replacements: [`https://${domain}/object/1`, '{}'] }
    )
    await connection.query(
      'INSERT INTO job (job_id, queue_id, payload, priority) VALUES (?, ?, ?, ?)',
      { replacements: [username, 'delivery', JSON.stringify({ id: `https://${domain}/activity/1` }), 1] }
    )
    await connection.query(
      'INSERT INTO failed_job (job_id, queue_id, payload, priority) VALUES (?, ?, ?, ?)',
      { replacements: [username, 'delivery', JSON.stringify({ id: `https://${domain}/activity/1` }), 1] }
    )
  }

  const scope = {
    usernames: ['fixture'],
    localDomain: 'fixture.cleanup.test',
    queues: ['delivery']
  }
  await cleanupTestData(connection, scope)
  await cleanupTestData(connection, scope)

  const [keys] = await connection.query('SELECT username FROM new_keys')
  assert.deepEqual(keys, [{ username: 'unrelated' }])
  const [objects] = await connection.query('SELECT id FROM objects')
  assert.deepEqual(objects, [{ id: 'https://unrelated.cleanup.test/object/1' }])
  for (const table of ['job', 'failed_job']) {
    const [jobs] = await connection.query(`SELECT job_id FROM ${table}`)
    assert.deepEqual(jobs, [{ job_id: 'unrelated' }])
  }
  const [migrations] = await connection.query('SELECT COUNT(*) AS count FROM migrations')
  assert.ok(migrations[0].count > 0)
})

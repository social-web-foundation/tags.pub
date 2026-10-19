import { Sequelize } from 'sequelize'
import { runMigrations } from '@evanp/activitypub-bot/lib/migrations/index.js'

const SQLITE_MEMORY_URL = 'sqlite::memory:'
const SQLITE_MEMORY_ALIASES = new Set([
  'sqlite::memory',
  SQLITE_MEMORY_URL,
  ':sqlite::memory:',
  ':sqllite::memory:'
])

export function getTestDatabaseUrl () {
  const databaseUrl = process.env.TEST_DATABASE_URL || SQLITE_MEMORY_URL
  return SQLITE_MEMORY_ALIASES.has(databaseUrl) ? SQLITE_MEMORY_URL : databaseUrl
}

function toUrlPattern (domainOrOrigin) {
  if (!domainOrOrigin) {
    return null
  }
  const trimmed = String(domainOrOrigin).trim()
  if (!trimmed) {
    return null
  }
  const origin = trimmed.includes('://')
    ? trimmed.replace(/\/+$/, '')
    : `https://${trimmed}`
  return `${origin}/%`
}

function addLikeClauses (clauses, replacements, column, patterns, keyPrefix) {
  patterns.forEach((pattern, index) => {
    const key = `${keyPrefix}${index}`
    clauses.push(`${column} LIKE :${key}`)
    replacements[key] = pattern
  })
}

async function deleteWhere (connection, table, clauses, replacements = {}) {
  if (clauses.length === 0) {
    return
  }
  await connection.query(
    `DELETE FROM ${table} WHERE ${clauses.join(' OR ')}`,
    { replacements }
  )
}

export async function cleanupTestData (connection, {
  usernames = [],
  localDomain = null,
  remoteDomains = [],
  queues = []
} = {}) {
  const localPattern = toUrlPattern(localDomain)
  const normalizedRemotePatterns = remoteDomains.map(toUrlPattern).filter(Boolean)
  const allPatterns = localPattern
    ? [localPattern, ...normalizedRemotePatterns]
    : normalizedRemotePatterns

  // The system/instance actor stores its keypair and records under
  // username = localDomain, so include it whenever a local domain is given.
  const effectiveUsernames = localDomain && !usernames.includes(localDomain)
    ? [...usernames, localDomain]
    : usernames

  const actorCollectionPageClauses = []
  const actorCollectionPageReplacements = {}
  if (effectiveUsernames.length > 0) {
    actorCollectionPageClauses.push('username IN (:usernames)')
    actorCollectionPageReplacements.usernames = effectiveUsernames
  }
  addLikeClauses(
    actorCollectionPageClauses,
    actorCollectionPageReplacements,
    'item',
    allPatterns,
    'itemPattern'
  )
  await deleteWhere(connection, 'actorcollectionpage', actorCollectionPageClauses, actorCollectionPageReplacements)

  if (effectiveUsernames.length > 0) {
    const usernameOnlyReplacements = { usernames: effectiveUsernames }
    await deleteWhere(connection, 'actorcollection', ['username IN (:usernames)'], usernameOnlyReplacements)
    await deleteWhere(connection, 'lastactivity', ['username IN (:usernames)'], usernameOnlyReplacements)
    await deleteWhere(connection, 'botdata', ['username IN (:usernames)'], usernameOnlyReplacements)
    await deleteWhere(connection, 'new_keys', ['username IN (:usernames)'], usernameOnlyReplacements)
  }

  const remoteKeyClauses = []
  const remoteKeyReplacements = {}
  addLikeClauses(remoteKeyClauses, remoteKeyReplacements, 'id', normalizedRemotePatterns, 'remoteIdPattern')
  addLikeClauses(remoteKeyClauses, remoteKeyReplacements, 'owner', normalizedRemotePatterns, 'remoteOwnerPattern')
  await deleteWhere(connection, 'new_remotekeys', remoteKeyClauses, remoteKeyReplacements)

  const pageClauses = []
  const pageReplacements = {}
  addLikeClauses(pageClauses, pageReplacements, 'id', allPatterns, 'pageIdPattern')
  addLikeClauses(pageClauses, pageReplacements, 'item', allPatterns, 'pageItemPattern')
  await deleteWhere(connection, 'pages', pageClauses, pageReplacements)

  const collectionClauses = []
  const collectionReplacements = {}
  addLikeClauses(collectionClauses, collectionReplacements, 'id', allPatterns, 'collectionIdPattern')
  await deleteWhere(connection, 'collections', collectionClauses, collectionReplacements)

  const objectClauses = []
  const objectReplacements = {}
  addLikeClauses(objectClauses, objectReplacements, 'id', allPatterns, 'objectIdPattern')
  await deleteWhere(connection, 'objects', objectClauses, objectReplacements)

  const endpointCacheClauses = []
  const endpointCacheReplacements = {}
  addLikeClauses(endpointCacheClauses, endpointCacheReplacements, 'actor_id', allPatterns, 'endpointActorPattern')
  await deleteWhere(connection, 'endpoint_cache', endpointCacheClauses, endpointCacheReplacements)

  if (localDomain) {
    const domain = new URL(localDomain.includes('://') ? localDomain : `https://${localDomain}`).hostname
    await deleteWhere(connection, 'server_stats', ['domain = :domain'], { domain })
  }

  const rateLimitClauses = []
  const rateLimitReplacements = {}
  if (remoteDomains.length > 0) {
    rateLimitClauses.push('host IN (:rateLimitHosts)')
    rateLimitReplacements.rateLimitHosts = remoteDomains
  }
  await deleteWhere(connection, 'rate_limit', rateLimitClauses, rateLimitReplacements)

  const remoteCacheClauses = []
  const remoteCacheReplacements = {}
  if (effectiveUsernames.length > 0) {
    remoteCacheClauses.push('username IN (:usernames)')
    remoteCacheReplacements.usernames = effectiveUsernames
  }
  addLikeClauses(remoteCacheClauses, remoteCacheReplacements, 'id', allPatterns, 'remoteCacheIdPattern')
  await deleteWhere(connection, 'remote_object_cache', remoteCacheClauses, remoteCacheReplacements)

  const signaturePolicyClauses = []
  const signaturePolicyReplacements = {}
  if (remoteDomains.length > 0) {
    signaturePolicyClauses.push('origin IN (:signaturePolicyDomains)')
    signaturePolicyReplacements.signaturePolicyDomains = remoteDomains.map(
      d => d.includes('://') ? d.replace(/\/+$/, '') : `https://${d}`
    )
  }
  await deleteWhere(connection, 'signature_policy', signaturePolicyClauses, signaturePolicyReplacements)

  if (queues.length > 0 && allPatterns.length > 0) {
    const clauses = []
    const replacements = { queues }
    addLikeClauses(clauses, replacements, 'payload', allPatterns.map(pattern => `%${pattern}`), 'payloadPattern')
    const where = [`queue_id IN (:queues) AND (${clauses.join(' OR ')})`]
    await deleteWhere(connection, 'job', where, replacements)
    await deleteWhere(connection, 'failed_job', where, replacements)
  }
}

export async function cleanupTestDatabase (scope) {
  const databaseUrl = getTestDatabaseUrl()
  if (databaseUrl === SQLITE_MEMORY_URL) return
  const connection = new Sequelize(databaseUrl, { logging: false })
  try {
    await connection.authenticate()
    await runMigrations(connection)
    await cleanupTestData(connection, {
      ...scope,
      usernames: ['*', '_____relay_____', '_relayclient', '_followback', ...(scope.usernames || [])],
      queues: ['intake', 'delivery', 'fanout', 'distribution']
    })
  } finally {
    await connection.close()
  }
}

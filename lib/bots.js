import { RelayServerBot, RelayClientBot, FollowBackBot } from '@evanp/activitypub-bot'
import { TagBotFactory } from './tagbotfactory.js'

const RELAY_BOT = '_____relay_____'
const FOLLOWBACK_BOT = '_followback'
const FOLLOWBACK_BOT_DESCRIPTION = `
Follow me and I will follow you back. Your public posts will
then be boosted through tags.pub. Unfollow me,
and the boosts will stop.
`

const relays = (process.env.RELAYS)
  ? process.env.RELAYS.split(',')
  : []

function botName(relay) {
  return '_' + relay.slice(8).replace(/[^a-zA-Z0-9]/g, '_')
}

const clientBots = Object.fromEntries(relays.map(relay => {
  const bn = botName(relay)
  return [bn, new RelayClientBot(bn, { relay })]
}))

const unsubs = (process.env.UNSUBSCRIBE)
  ? process.env.UNSUBSCRIBE.split(',')
  : []

const unsubBots = Object.fromEntries(unsubs.map(relay => {
  const bn = botName(relay)
  const unsubscribe = true
  return [bn, new RelayClientBot(bn, { relay, unsubscribe })]
}))

const bots = {
  ...clientBots,
  ...unsubBots,
  [RELAY_BOT]: new RelayServerBot(RELAY_BOT),
  [FOLLOWBACK_BOT]: new FollowBackBot(FOLLOWBACK_BOT, {
    description: FOLLOWBACK_BOT_DESCRIPTION
  }),
  '*': new TagBotFactory()
}

export default bots

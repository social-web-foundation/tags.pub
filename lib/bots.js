import { RelayServerBot, RelayClientBot } from '@evanp/activitypub-bot'
import { TagBotFactory } from './tagbotfactory.js'

const RELAY_BOT = '_____relay_____'

const relays = (process.env.RELAYS)
  ? process.env.RELAYS.split(',')
  : []

function botName(relay) {
  return '_' + relay.slice(8).replace(/[^a-zA-Z0-9]/g, '_')
}

const clientBots = Object.fromEntries(relays.map(relay => {
  const bn = botName(relay)
  return [bn, new RelayClientBot(bn, relay)]
}))

const unsubs = (process.env.UNSUBSCRIBE)
  ? process.env.UNSUBSCRIBE.split(',')
  : []

const unsubBots = Object.fromEntries(unsubs.map(relay => {
  const bn = botName(relay)
  return [bn, new RelayClientBot(bn, relay, true)]
}))

const bots = {
  ...clientBots,
  ...unsubBots,
  [RELAY_BOT]: new RelayServerBot(RELAY_BOT),
  '*': new TagBotFactory()
}

export default bots

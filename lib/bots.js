import { RelayServerBot } from '@evanp/activitypub-bot'
import { TagBotFactory } from './tagbotfactory.js'

const RELAY_BOT = '_____relay_____'

const bots = {
  [RELAY_BOT]: new RelayServerBot(RELAY_BOT),
  '*': new TagBotFactory()
}

export default bots

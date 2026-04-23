import { RelayServerBot, RelayClientBot, FollowBackBot } from '@evanp/activitypub-bot'
import { TagBotFactory } from './tagbotfactory.js'

const RELAY_BOT = '_____relay_____'
const RELAY_CLIENT_BOT = '_relayclient'
const FOLLOWBACK_BOT = '_followback'
const FOLLOWBACK_BOT_DESCRIPTION = `
Follow me and I will follow you back. Your public posts will
then be boosted through tags.pub. Unfollow me,
and the boosts will stop.
`

const relays = (process.env.RELAYS)
  ? process.env.RELAYS.split(',')
  : []

const bots = {
  [RELAY_CLIENT_BOT]: new RelayClientBot(RELAY_CLIENT_BOT, { relay: relays }),
  [RELAY_BOT]: new RelayServerBot(RELAY_BOT),
  [FOLLOWBACK_BOT]: new FollowBackBot(FOLLOWBACK_BOT, {
    description: FOLLOWBACK_BOT_DESCRIPTION
  }),
  '*': new TagBotFactory()
}

export default bots

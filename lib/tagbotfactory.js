import { BotFactory } from '@evanp/activitypub-bot'
import { TagBot } from './tagbot.js'

export class TagBotFactory extends BotFactory {
  async canCreate (username) {
    return true
  }

  async create (username) {
    const bot = new TagBot(username)
    await bot.initialize(await this._context.duplicate(username))
    return bot
  }
}

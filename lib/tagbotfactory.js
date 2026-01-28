import { BotFactory } from '@evanp/activitypub-bot'
import { TagBot } from './tagbot.js'

const AS2 = 'https://www.w3.org/ns/activitystreams#'

export class TagBotFactory extends BotFactory {
  async canCreate (username) {
    return true
  }

  async create (username) {
    const bot = new TagBot(username)
    await bot.initialize(await this._context.duplicate(username))
    return bot
  }

  async onPublic (activity) {
    this._context.logger.debug(
      { activity: activity.id },
      'Checking public activity in TagBotFactory'
    )
    const types = (Array.isArray(activity.type))
      ? activity.type
      : [activity.type]

    for (const type of types) {
      switch (type) {
        case AS2 + 'Create':
          await this.#handleCreate(activity)
          break
        default:
          this._context.logger.warn(
            { activity: activity.id, type },
            'Skipping activity'
          )
      }
    }
  }

  async #handleCreate (activity) {
    this._context.logger.debug(
      { activity: activity.id },
      'Handling public create activity in TagBotFactory'
    )
    for (const object of activity.object) {
      this._context.logger.debug(
        { object: object.id, type: object.type, tag: object.tag },
        'Handling object of public Create activity in TagBotFactory'
      )
      const tagNames = new Set()
      for (const hashtag of object.tag) {
        this._context.logger.debug(
          { object: object.id, tag: hashtag.name.get() },
          'tag'
        )
        const types = (Array.isArray(hashtag.type))
          ? hashtag.type
          : [hashtag.type]
        this._context.logger.debug(
          { object: object.id, types },
          'tag object has these types'
        )
        if (types.some(type => type === `${AS2}Hashtag`)) {
          this._context.logger.debug(
            { object: object.id, tag: hashtag.name.get() },
            'It is a hashtag'
          )
          const tagName = this.#scrubName(hashtag.name.get())
          if (tagName && tagName.length > 0) {
            tagNames.add(tagName)
          } else {
            this._context.logger.debug(
              { object: object.id, tag: hashtag.name.get() },
              'Skipping unusual hashtag'
            )
          }
        }
      }
      for (const tagName of tagNames) {
        this._context.logger.debug(
          { object: object.id, tagName },
          'Telling bot to share object in TagBotFactory'
        )
        const bot = await this.create(tagName)
        await bot.shareObject(object)
        this._context.logger.debug(
          { object: object.id, tagName },
          'Finished telling bot to share object in TagBotFactory'
        )
      }
    }
  }

  #scrubName (name) {
    let result = name
    if (result.length > 0 && result[0] === '#') {
      result = name.slice(1)
    }
    result = result.toLowerCase().replace(/[^a-z0-9]/g, '')
    return result
  }
}

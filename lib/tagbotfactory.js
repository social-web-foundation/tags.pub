import assert from 'node:assert'

import { BotFactory } from '@evanp/activitypub-bot'
import anyAscii from 'any-ascii'

import { TagBot } from './tagbot.js'

const AS2 = 'https://www.w3.org/ns/activitystreams#'
const CREATE = `${AS2}Create`
const UPDATE = `${AS2}Update`
const DELETE = `${AS2}Delete`
const ANNOUNCE = `${AS2}Announce`
const PUBLIC = [
  `${AS2}Public`,
  'as:Public',
  'Public'
]

export class TagBotFactory extends BotFactory {
  #announceAllowList

  constructor(options = {}) {
    super()
    this.#announceAllowList = ('announceAllowList' in options)
      ? options.announceAllowList
      : []
  }

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
        case CREATE:
          await this.#handleCreate(activity)
          break
        case UPDATE:
          await this.#handleUpdate(activity)
          break
        case DELETE:
          await this.#handleDelete(activity)
          break
        case ANNOUNCE:
          await this.#handleAnnounce(activity)
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
    if (this.#isQuietPublic(activity)) {
        this._context.logger.debug(
          { activity: activity.id },
          'Skipping quiet public activity'
        )
        return
    }
    const actors = Array.from(activity.actor)
    for (const actor of actors) {
      if (await this.#noContactActor(actor)) {
        this._context.logger.debug(
          { activity: activity.id, actor: actor.id },
          'Skipping content by actor'
        )
        return
      }
    }
    for (const object of activity.object) {
      const tagNames = this.#extractTagNames(object)
      for (const tagName of tagNames) {
        this._context.logger.debug(
          { object: object.id, tagName },
          'Telling bot to share object in TagBotFactory'
        )
        const bot = await this.create(tagName)
        await bot.shareObject(object, actors)
        this._context.logger.debug(
          { object: object.id, tagName },
          'Finished telling bot to share object in TagBotFactory'
        )
      }
      await this.#saveTagNames(object, tagNames)
    }
  }

  async #handleUpdate (activity) {
    this._context.logger.debug(
      { activity: activity.id },
      'Handling public update activity in TagBotFactory'
    )
    if (this.#isQuietPublic(activity)) {
        this._context.logger.debug(
          { activity: activity.id },
          'Skipping quiet public activity'
        )
        return
    }
    const actors = Array.from(activity.actor)
    for (const actor of actors) {
      if (await this.#noContactActor(actor)) {
        this._context.logger.debug(
          { activity: activity.id, actor: actor.id },
          'Skipping content by actor'
        )
        return
      }
    }
    for (const object of activity.object) {
      const tagNames = this.#extractTagNames(object)
      const saved = (await this.#haveTagNames(object))
        ? await this.#getTagNames(object)
        : []
      this._context.logger.debug(
        { tagNames, saved },
        'Extracted and saved'
      )
      const toAdd = this.#diff(tagNames, saved)
      this._context.logger.debug(
        { toAdd },
        'Tags to add'
      )
      for (const tagName of toAdd) {
        this._context.logger.debug(
          { object: object.id, tagName },
          'Telling bot to share object in TagBotFactory'
        )
        const bot = await this.create(tagName)
        await bot.shareObject(object, actors)
        this._context.logger.debug(
          { object: object.id, tagName },
          'Finished telling bot to share object in TagBotFactory'
        )
      }
      const toRemove = this.#diff(saved, tagNames)
      this._context.logger.debug(
        { toRemove },
        'Tags to remove'
      )
      for (const tagName of toRemove) {
        this._context.logger.debug(
          { object: object.id, tagName },
          'Telling bot to undo share object in TagBotFactory'
        )
        const bot = await this.create(tagName)
        try {
          await bot.undoShareObject(object)
          this._context.logger.debug(
            { object: object.id, tagName },
            'Finished telling bot to undo share object in TagBotFactory'
          )
        } catch (error) {
          this._context.logger.warn(
            { object: object.id, tagName, error },
            'Failed to undo share object in TagBotFactory'
          )
        }
      }
      await this.#saveTagNames(object, tagNames)
    }
  }

  async #handleDelete (activity) {
    this._context.logger.debug(
      { activity: activity.id },
      'Handling public delete activity in TagBotFactory'
    )
    if (this.#isQuietPublic(activity)) {
        this._context.logger.debug(
          { activity: activity.id },
          'Skipping quiet public activity'
        )
        return
    }
    const actors = Array.from(activity.actor)
    for (const actor of actors) {
      if (await this.#noContactActor(actor)) {
        this._context.logger.debug(
          { activity: activity.id, actor: actor.id },
          'Skipping content by actor'
        )
        return
      }
    }
    for (const object of activity.object) {
      const saved = (await this.#haveTagNames(object))
        ? await this.#getTagNames(object)
        : []
      this._context.logger.debug(
        { saved, object: object.id },
        'Extracted and saved'
      )
      for (const tagName of saved) {
        this._context.logger.debug(
          { object: object.id, tagName },
          'Telling bot to undo share object in TagBotFactory'
        )
        const bot = await this.create(tagName)
        try {
          await bot.undoShareObject(object)
          this._context.logger.debug(
            { object: object.id, tagName },
            'Finished telling bot to undo share object in TagBotFactory'
          )
        } catch (error) {
          this._context.logger.warn(
            { object: object.id, tagName, error },
            'Failed to undo share object in TagBotFactory'
          )
        }
      }
      await this.#clearTagNames(object)
    }
  }

  async #handleAnnounce (activity) {
    this._context.logger.debug(
      { activity: activity.id },
      'Handling public announce activity in TagBotFactory'
    )
    const actors = Array.from(activity.actor)
    if (!actors.some(actor => this.#announceAllowList.includes(actor.id))) {
      this._context.logger.debug(
        { activity: activity.id, actors: actors.map(actor => actor.id) },
        'Skipping announce because no actor is in the allow list'
      )
      return
    }
    for (const ref of activity.object) {
      const object = await this._context.getObject(ref.id)
      if (object.isActivity()) {
        if (this.#isPublic(object)) {
          await this.onPublic(object)
        }
        continue
      }
      if (this.#isQuietPublic(object)) {
          this._context.logger.debug(
            { activity: activity.id },
            'Skipping quiet public activity'
          )
          continue
      }
      const actors = Array.from(object.attributedTo)
      let noContact = false
      for (const actor of actors) {
        if (await this.#noContactActor(actor)) {
          this._context.logger.debug(
            { activity: activity.id, actor: actor.id },
            'Skipping content by actor'
          )
          noContact = true
          break
        }
      }
      if (noContact) {
        continue
      }
      const tagNames = this.#extractTagNames(object)
      const saved = (await this.#haveTagNames(object))
        ? await this.#getTagNames(object)
        : []
      this._context.logger.debug(
        { tagNames, saved },
        'Extracted and saved'
      )
      const toAdd = this.#diff(tagNames, saved)
      this._context.logger.debug(
        { toAdd },
        'Tags to add'
      )
      for (const tagName of toAdd) {
        this._context.logger.debug(
          { object: object.id, tagName },
          'Telling bot to share object in TagBotFactory'
        )
        const bot = await this.create(tagName)
        await bot.shareObject(object, actors)
        this._context.logger.debug(
          { object: object.id, tagName },
          'Finished telling bot to share object in TagBotFactory'
        )
      }
      const toRemove = this.#diff(saved, tagNames)
      this._context.logger.debug(
        { toRemove },
        'Tags to remove'
      )
      for (const tagName of toRemove) {
        this._context.logger.debug(
          { object: object.id, tagName },
          'Telling bot to undo share object in TagBotFactory'
        )
        const bot = await this.create(tagName)
        try {
          await bot.undoShareObject(object)
          this._context.logger.debug(
            { object: object.id, tagName },
            'Finished telling bot to undo share object in TagBotFactory'
          )
        } catch (error) {
          this._context.logger.warn(
            { object: object.id, tagName, error },
            'Failed to undo share object in TagBotFactory'
          )
        }
      }
      await this.#saveTagNames(object, tagNames)
    }
  }

  #extractTagNames (object) {
    this._context.logger.debug(
      { object: object.id, type: object.type, tag: object.tag },
      'Handling object of activity in TagBotFactory'
    )
    const tagNames = new Set()
    if (object.tag) {
      for (const hashtag of object.tag) {
        this._context.logger.debug(
          { object: object.id, href: hashtag.href },
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
            { object: object.id, href: hashtag.href },
            'It is a hashtag'
          )
          const tagName = this.#scrubName(hashtag.name?.get())
          if (tagName && tagName.length > 0) {
            tagNames.add(tagName)
          } else {
            this._context.logger.debug(
              { object: object.id, href: hashtag.href },
              'Skipping unusual hashtag'
            )
          }
        }
      }
    }
    const value = [...tagNames]
    this._context.logger.debug(
      { object: object.id, value },
      'Extracted tag names'
    )
    return value
  }

  async #saveTagNames (object, tagNames) {
    const key = `tagnames:${object.id}`
    const value = [...tagNames]
    assert.ok(Array.isArray(value))
    this._context.logger.debug({ key, value }, 'Saving tag names')
    await this._context.setData(key, value)
  }

  async #haveTagNames (object) {
    const key = `tagnames:${object.id}`
    this._context.logger.debug({ key }, 'Checking if key exists')
    return await this._context.hasData(key)
  }

  async #getTagNames (object) {
    const key = `tagnames:${object.id}`
    this._context.logger.debug({ key }, 'Getting values for key')
    const value = await this._context.getData(key)
    this._context.logger.debug({ key, value }, 'Got values for key')
    assert.ok(Array.isArray(value))
    return value
  }

  async #clearTagNames (object) {
    const key = `tagnames:${object.id}`
    this._context.logger.debug({ key }, 'Clearing value for key')
    await this._context.deleteData(key)
    this._context.logger.debug({ key }, 'Deleted value for key')
  }

  #diff (a, b) {
    const result = a.filter(x => !b.includes(x))
    assert.ok(Array.isArray(result))
    return result
  }

  #scrubName (name) {
    if (!name) return null
    let result = name
    if (result.length > 0 && result[0] === '#') {
      result = name.slice(1)
    }
    result = anyAscii(result.normalize('NFKC'))
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '')

    return result
  }

  async #noContactActor (actorRef) {
    const actorId = actorRef.id
    if (!actorId) {
      return false
    }
    this._context.logger.debug(
      { actorId },
      "Getting actor"
    )

    let actor

    try {
      actor = await this._context.getObject(actorId)
    } catch (err) {
      return false
    }

    if (!actor) {
      return false;
    }
    this._context.logger.debug(
      { actorId },
      "Got actor"
    )
    if (!actor.summary) {
      return false
    }
    const summary = actor.summary.get()
    if (!summary) {
      return false
    }
    this._context.logger.debug(
      { actorId, summary },
      "Got summary"
    )
    if (summary.match(/\bNoBots\b/gi)) {
      return true
    }
    if (summary.match(/\bNoTagsPub\b/gi)) {
      return true
    }
    if (summary.match(/\bNoBot\b/gi)) {
      return true
    }
    return false
  }

  #isPublic (object) {
    return ['to', 'cc', 'audience'].some(
      prop => this.#isPublicInProp(object, prop)
    )
  }

  #isQuietPublic (object) {
    return this.#isPublicInProp(object, 'cc') &&
      !this.#isPublicInProp(object, 'to') &&
      !this.#isPublicInProp(object, 'audience')
  }

  #isPublicInProp (object, prop) {
    const vals = object.get(prop)
    if (vals) {
      for (const val of vals) {
        if (PUBLIC.includes(val.id)) {
          return true
        }
      }
    }
    return false
  }
}

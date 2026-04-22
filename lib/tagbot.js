import { Bot } from '@evanp/activitypub-bot'

export class TagBot extends Bot {
  get fullname () {
    return `#${this.username}`
  }

  get description () {
    return `
      Follow me if you're interested in the ${this.username} hashtag.
      I'm a global hashtag sharing bot from tags.pub. When content
      with the ${this.username} hashtag appears on the Social Web,
      this account will re-share the content to its followers.
      `
  }

  async shareObject (object, actors) {
    this._context.logger.debug(
      {
        class: this.constructor.name,
        object: object.id,
        username: this.username,
      },
      'Starting to share of object'
    )
    const activity = await this._context.announceObject(object, actors)
    this._context.logger.info(
      {
        class: this.constructor.name,
        object: object.id,
        username: this.username,
        activity: activity.id
      },
      'Shared tagged object'
    )
  }

  async undoShareObject (object) {
    this._context.logger.debug(
      {
        class: this.constructor.name,
        object: object.id,
        username: this.username,
      },
      'Starting to unshare object'
    )
    const activity = await this._context.unannounceObject(object)
    this._context.logger.info(
      {
        class: this.constructor.name,
        object: object.id,
        username: this.username,
        activity: activity.id
      },
      'Unshared tagged object'
    )
  }
}

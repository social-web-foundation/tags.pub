import { Bot } from '@evanp/activitypub-bot'

const iconUrl = new URL('../web/tagbot.png', import.meta.url)

export class TagBot extends Bot {
  get fullname () {
    return `#${this.username}`
  }

  get description () {
    return `
      <p>
        Follow me if you&apos;re interested in the #${this.username} hashtag.
        I&apos;m a global hashtag sharing bot from tags.pub. When content
        with the #${this.username} hashtag appears on the Social Web,
        this account will re-share the content to its followers.
      </p>
      <p>
        This account is not associated with or endorsed by any
        person or brand referenced in this hashtag. Trademarks are the property
        of their respective owners.
      </p>
      <p>
        <a href="https://tags.pub/">tags.pub</a> is a global hashtag
        server for the <a href="https://activitypub.rocks/">ActivityPub</a>
        network, provided by <a href="https://socialwebfoundation.org/">The Social Web Foundation</a>, a US non-profit dedicated to making the
        Social Web better for everyone.
      </p>
      <p>
        You can <a href="https://tags.pub/#optout">opt out</a> of being boosted.
      </p>
      <p>
        Report issues on <a href="https://github.com/social-web-foundation/tags.pub/">the GitHub repository</a>. Contact SWF at <a href="https://socialwebfoundation.org/contact/">our contact page</a>.
      </p>
      `
  }

  get icon () {
    return iconUrl
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

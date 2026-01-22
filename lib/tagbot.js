import { Bot } from '@evanp/activitypub-bot'

export class TagBot extends Bot {
  get fullname () {
    return `${this.username} hashtag`
  }

  get description () {
    return `
      Follow me if you're interested in the ${this.username} hashtag.
      I'm a global hashtag sharing bot from tags.pub. When content
      with the ${this.username} hashtag appears on the Social Web,
      this account will re-share the content to its followers.
      `
  }
}

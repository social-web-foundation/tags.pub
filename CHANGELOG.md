# Changelog

All notable changes to this project will be documented in this file.

The format is based on
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to
[Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.28.6] - 2026-04-27

### Fixed

- Upgrade activitypub-bot to clear out
  legacy actors stuck in `pendingFollowing` collection.

## [0.28.5] - 2026-04-27

### Fixed

- Upgrade activitypub-bot to clean up followbackbot social graph.
- Document followback bot in home page.

## [0.28.4] - 2026-04-27

### Fixed

- tagbot icon added.
- better description of tagbot, including trademark
  disclaimer and links.
- README.md
- add FAQ to homepage
- add Why is this needed? to FAQ

## [0.28.3] - 2026-04-26

### Fixed

- Use activitypub-bot 0.45.4 to fix issues with throttled distributions failing instead of retrying.

## [0.28.2] - 2026-04-24

### Fixed

- Use activitypub-bot 0.45.3 to fix issues with Announce
  activity summaries.

## [0.28.1] - 2026-04-24

### Fixed

- Use activitypub-bot 0.45.2 to fix interop issues
  with Misskey and Pixelfed.

## [0.28.0] - 2026-04-23

### Added

- Relay client now announces tagged content when it receives
  an Announce activity from a subscribed relay
- Info-level log entry when a tag bot shares content

### Changed

- Upgrade activitypub-bot to 0.45.1
- Consolidate relay clients into a single `_relayclient` bot
  that takes an array of relays
- Tag bot description uses a clearer name for the tag

## [0.27.3] - 2026-04-21

### Fixed

- Upgrade activitypub-bot to 0.41.3

## [0.27.2] - 2026-04-21

### Fixed

- Fast-fail on a bad tag name
- Handle objects with no `name` when extracting names

## [0.27.1] - 2026-04-13

### Fixed

- Upgrade activitypub-bot to 0.41.2

## [0.27.0] - 2026-04-13

### Changed

- Upgrade activitypub-bot to 0.41.0

## [0.26.0] - 2026-04-13

### Changed

- Upgrade activitypub-bot to 0.40.2

## [0.25.4] - 2026-04-11

### Fixed

- Upgrade activitypub-bot to 0.39.6

## [0.25.3] - 2026-04-10

### Fixed

- Upgrade activitypub-bot to 0.39.3

## [0.25.2] - 2026-04-10

### Fixed

- Upgrade activitypub-bot to 0.39.2

## [0.25.1] - 2026-04-10

### Changed

- Upgrade activitypub-bot to 0.39.1

## [0.25.0] - 2026-04-10

### Changed

- Upgrade activitypub-bot to 0.39.0

## [0.24.0] - 2026-04-07

### Changed

- Upgrade activitypub-bot to 0.38.4

## [0.23.1] - 2026-04-04

### Changed

- Upgrade activitypub-bot to 0.37.1

## [0.23.0] - 2026-04-04

### Changed

- Upgrade activitypub-bot to 0.37.0

## [0.22.1] - 2026-04-02

### Changed

- Upgrade activitypub-bot to 0.36.2

## [0.22.0] - 2026-03-31

### Changed

- Upgrade activitypub-bot to 0.36.0

## [0.21.0] - 2026-03-30

### Changed

- Upgrade activitypub-bot to 0.35.0

## [0.20.0] - 2026-03-29

### Changed

- Upgrade activitypub-bot to 0.34.1

## [0.19.0] - 2026-03-26

### Changed

- Upgrade activitypub-bot to 0.33.0

### Fixed

- Typo in docs: "you" -> "your" (thanks @gam3)

## [0.18.2] - 2026-03-24

### Changed

- Upgrade activitypub-bot to 0.32.3

## [0.18.1] - 2026-03-24

### Changed

- Upgrade activitypub-bot to 0.32.1

## [0.18.0] - 2026-03-24

### Changed

- Upgrade activitypub-bot to 0.32.0

## [0.17.1] - 2026-03-22

### Fixed

- Upgrade activitypub-bot to 0.31.1

## [0.17.0] - 2026-03-22

### Changed

- Upgrade `RelayClientBot` constructor usage
- Upgrade activitypub-bot to 0.31.0

## [0.16.3] - 2026-03-21

### Fixed

- Upgrade activitypub-bot to 0.30.6

## [0.16.2] - 2026-03-21

### Fixed

- Upgrade activitypub-bot to 0.30.5

## [0.16.1] - 2026-03-21

### Changed

- Upgrade activitypub-bot to 0.30.4

## [0.16.0] - 2026-03-21

### Added

- Opt-out with the singular `#NoBot` hashtag

### Changed

- Docs updated for `NoBot` singular

### Fixed

- Quote handling in `index.html`

## [0.15.2] - 2026-03-21

### Fixed

- Upgrade activitypub-bot to 0.30.2

## [0.15.1] - 2026-03-21

### Changed

- Upgrade activitypub-bot to 0.30.1

## [0.15.0] - 2026-03-19

### Changed

- Upgrade activitypub-bot with server Webfinger support

## [0.14.3] - 2026-03-19

### Fixed

- Install activitypub-bot bug fixes

## [0.14.2] - 2026-03-18

### Changed

- Upgrade activitypub-bot to 0.28.4

## [0.14.1] - 2026-03-18

### Changed

- Upgrade activitypub-bot to 0.28.3

## [0.14.0] - 2026-03-18

### Changed

- Upgrade activitypub-bot

## [0.13.4] - 2026-03-17

### Changed

- Upgrade activitypub-bot so outbound requests respect rate limits

## [0.13.3] - 2026-03-17

### Changed

- Upgrade GitHub Action versions

### Fixed

- Regex for the "no contact" opt-out check

## [0.13.2] - 2026-03-17

### Added

- Pass actors to `botcontext.announceObject()`

### Changed

- Upgrade activitypub-bot to 0.26.0

## [0.13.1] - 2026-03-17

### Fixed

- Upgrade activitypub-bot to 0.25.1 to fix relay issues

## [0.13.0] - 2026-03-16

### Added

- FollowBack bot so people can connect on their own
- Contributor Covenant Code of Conduct

### Changed

- Upgrade activitypub-bot

## [0.12.0] - 2026-03-12

### Added

- Skip sharing content from authors with `#NoBots` or `#NoTagsPub`
  in their profile

### Changed

- Upgrade activitypub-nock to 0.6.0

## [0.11.0] - 2026-03-12

### Changed

- Upgrade activitypub-bot to 0.24.1

### Fixed

- Handle Create activities correctly when they have no tags
- Also unsubscribe bots

## [0.10.0] - 2026-03-11

### Added

- Subscribe to remote relays

### Changed

- Upgrade activitypub-bot to 0.24.0

## [0.9.1] - 2026-03-11

### Added

- Table of contents on the home page

### Changed

- Home page centre column is readable and responsive

### Fixed

- Documented contact for privacy questions

## [0.9.0] - 2026-03-11

### Added

- Home page for tags.pub

### Changed

- Upgrade activitypub-bot to 0.23.0
- Upgrade activitypub-bot to 0.22.0

### Fixed

- How `makeApp()` is called

## [0.8.0] - 2026-03-09

### Changed

- Tag full name is now `#` plus the tag name
- Upgrade activitypub-bot to 0.21.2

### Fixed

- Tests clean up the app after running

## [0.7.1] - 2026-02-25

### Fixed

- Upgrade activitypub-bot to fix summary

## [0.7.0] - 2026-02-18

### Added

- Relay server inbox test

### Fixed

- Public inbox test

## [0.6.0] - 2026-02-18

### Changed

- Upgrade activitypub-bot to 0.21.0

## [0.5.0] - 2026-02-18

### Added

- Relay server bot

### Changed

- Upgrade activitypub-bot to 0.20.1

## [0.4.0] - 2026-02-17

### Changed

- Upgrade activitypub-bot to 0.19.0

## [0.3.0] - 2026-02-13

### Added

- Dockerfile
- Build Docker image on tag

### Changed

- Upgrade activitypub-bot

## [0.2.0] - 2026-01-28

### Added

- Initial `TagBot` and `TagBotFactory`
- Share tagged public objects
- Undo shares on update
- Clear tags on delete
- Bots and tests

### Changed

- Upgrade activitypub-bot (through 0.16.3)

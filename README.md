# tags.pub

A global hashtag server for the ActivityPub network.

tags.pub is a server for the ActivityPub network. It provides one account like `foo@tags.pub` for every hashtag like `#foo`. When public content is posted on the ActivityPub network with that hashtag, the `foo@tags.pub` account shares the content to its followers.

More information is available at [https://tags.pub/](https://tags.pub/).

## Table of Contents

- [Security](#security)
- [Contributing](#contributing)
- [License](#license)

## Security

Vulnerabilities can be reported privately at <https://github.com/social-web-foundation/tags.pub/security>

## Contributing

The server is based on [activitypub-bot](https://github.com/evanp/activitypub-bot), a server-side bot framework.

PRs are welcome; code should be formatted in StandardJS. New PRs should link to a GitHub issue and should include a unit test for the feature added/bug fixed.

Run `npm test` to test with in-memory SQLite. The relay-server suite is skipped
with this backend because it requires concurrent transactions.

Set `TEST_DATABASE_URL` to a SQLite file or external database URL to run that
suite too. The suites clean up their fixture data before and after running.
Run tests serially when sharing a database:

```sh
TEST_DATABASE_URL=sqlite:/tmp/tags-pub-test.sqlite npm run test:serial
```

## License

tags.pub -- global hashtag server for the ActivityPub network
Copyright (C) 2026, Social Web Foundation

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU Affero General Public License as published
by the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU Affero General Public License for more details.

You should have received a copy of the GNU Affero General Public License
along with this program.  If not, see <https://www.gnu.org/licenses/>.

tagbot.svg and tagbot.png images are based on [Tag](https://thenounproject.com/icon/tag-2028454/) by [Guru](https://thenounproject.com/creator/gurupurnima4/). Available under the Creative Commons Attribution license.

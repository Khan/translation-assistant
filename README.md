# Translation Assistant

[![CI](https://github.com/Khan/translation-assistant/workflows/Node.js%20CI/badge.svg?branch=master&event=push)](https://github.com/Khan/translation-assistant/actions?query=workflow%3A%22Node.js+CI%22)

Provides functions that analyze and suggest translations for similar strings
based on an existing translation. Powers the Smart Translations feature in Khan
Translation Editor.

To ignore eslint style-guide commits in blame history, use:
```sh
git blame --ignore-revs-file .git-blame-ignore-revs
```

or to do it automatically:
```sh
git config blame.ignoreRevsFile .git-blame-ignore-revs
```

## Tests and test coverage

To run the tests:
```sh
npm run build && npm run test
```

To run the tests with test coverage, and report the results as text:
```sh
npm run build:coverage && npm run test:coverage
```

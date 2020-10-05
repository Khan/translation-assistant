# Translation Assistant

[![CI](https://github.com/Khan/translation-assistant/workflows/Node.js%20CI/badge.svg?branch=master&event=push)](https://github.com/Khan/translation-assistant/actions?query=workflow%3A%22Node.js+CI%22)
[![codecov](https://codecov.io/gh/Khan/translation-assistant/branch/master/graph/badge.svg)](https://codecov.io/gh/Khan/translation-assistant)

Provides functions that analyze and suggest translations for similar strings
based on an existing translation. Powers the Smart Translations feature in Khan
Translation Editor.

## Auto-Translation of Math Notation

The Translation Assistant also auto-translates certain math notations,
per specifications in [this Google Sheet this document](https://docs.google.com/spreadsheets/d/1qgi-KjumcZ6yru19U5weqZK9TosRlTdLZqbXbABBJoQ/edit#gid=0).

A backup of that document is kept in this repo in `MathNotationByLanguage.tsv`.

When a new team starts translations, they need to update the document
with their math notations, and the rules must be added
to `MATH_RULES_LOCALES` in `src/math_translator.js`.

## For Devs

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

This repository is deployed to `webapp` as a git submodule 
in `webapp/third_party/javascript-khansrc/`.

To test the webapp build, use:
```sh
yarn run build:webpack-prod-local
```

To test the integration with the Translation Editor, use:
```sh
yarn test javascript/manticore-package/
```

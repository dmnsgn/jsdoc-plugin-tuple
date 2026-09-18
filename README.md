# jsdoc-plugin-tuple

[![npm version](https://img.shields.io/npm/v/jsdoc-plugin-tuple)](https://www.npmjs.com/package/jsdoc-plugin-tuple)
[![stability-stable](https://img.shields.io/badge/stability-stable-green.svg)](https://www.npmjs.com/package/jsdoc-plugin-tuple)
[![npm minzipped size](https://img.shields.io/bundlephobia/minzip/jsdoc-plugin-tuple)](https://bundlephobia.com/package/jsdoc-plugin-tuple)
[![dependencies](https://img.shields.io/librariesio/release/npm/jsdoc-plugin-tuple)](https://github.com/dmnsgn/jsdoc-plugin-tuple/blob/main/package.json)
[![types](https://img.shields.io/npm/types/jsdoc-plugin-tuple)](https://github.com/microsoft/TypeScript)
[![Conventional Commits](https://img.shields.io/badge/Conventional%20Commits-1.0.0-fa6673.svg)](https://conventionalcommits.org)
[![styled with prettier](https://img.shields.io/badge/styled_with-Prettier-f8bc45.svg?logo=prettier)](https://github.com/prettier/prettier)
[![linted with eslint](https://img.shields.io/badge/linted_with-ES_Lint-4B32C3.svg?logo=eslint)](https://github.com/eslint/eslint)
[![license](https://img.shields.io/github/license/dmnsgn/jsdoc-plugin-tuple)](https://github.com/dmnsgn/jsdoc-plugin-tuple/blob/main/LICENSE.md)

A [JSDoc](https://jsdoc.app/) plugin adding support for TypeScript tuple types (`[number, number]`) and index signatures (`{[key: string]: number}`), which JSDoc's type parser rejects.

[![paypal](https://img.shields.io/badge/donate-paypal-informational?logo=paypal)](https://paypal.me/dmnsgn)
[![coinbase](https://img.shields.io/badge/donate-coinbase-informational?logo=coinbase)](https://commerce.coinbase.com/checkout/56cbdf28-e323-48d8-9c98-7019e72c97f3)
[![twitter](https://img.shields.io/twitter/follow/dmnsgn?style=social)](https://twitter.com/dmnsgn)
[![bluesky](https://img.shields.io/badge/-blue?logo=bluesky&label=Follow%20%40dmnsgn.me&style=social)](https://bsky.app/profile/dmnsgn.me)

![](https://raw.githubusercontent.com/dmnsgn/jsdoc-plugin-tuple/main/screenshot.gif)

## Installation

```bash
npm install jsdoc-plugin-tuple
```

## Usage

Add the plugin to your JSDoc configuration:

```json
{
  "plugins": ["jsdoc-plugin-tuple"]
}
```

Then write tuples the way you would in TypeScript:

```js
/** @typedef {[x: number, y: number]} Point */

/**
 * @param {[number, number]} size A tuple.
 * @param {[number, number][]} sizes An array of tuples.
 * @param {[string, ...number[]][]} entries A tuple as a type argument.
 * @param {[number, number] | null} bounds A tuple in a union.
 * @param {readonly [number, number]} frozen A readonly tuple.
 * @param {{ [key: string]: number }} lookup An index signature.
 * @returns {[boolean, string]} A tuple.
 */
function resize(size, sizes, entries, bounds, frozen, lookup) {}
```

Labelled (`[x: number, y: number]`), optional (`[number, number?]`), rest (`[string, ...number[]]`), nested and empty tuples are all supported, in every tag holding a type.

### How it works

JSDoc parses type expressions with [catharsis](https://github.com/hegemonic/catharsis), whose grammar has no notion of tuples: `{[number, number]}` is a hard parse error. On `jsdocCommentFound` the plugin quotes each tuple into a string literal type, which catharsis does accept, and on `newDoclet` it unquotes them again so documentation renders the original syntax. Index signatures have a JSDoc equivalent and are rewritten to it: `{[key: string]: number}` becomes `Object.<string, number>`.

TypeScript itself reads the original source, so generated type definitions are unaffected.

### Limitations

- A tuple is a single opaque type name, so its members are not hyperlinked: `{[Point, Point]}` renders as written, but `Point` does not link to its typedef.
- JSDoc reduces every record type to `Object`, so a tuple inside one (`{{a: [number, number]}}`) parses but its member types are dropped &mdash; as they are without this plugin.
- Mapped types (`{[K in keyof T]: V}`) have no JSDoc equivalent and are left untouched.

## API

<!-- api-start -->

Auto-generated API content.

<!-- api-end -->

## License

MIT. See [license file](https://github.com/dmnsgn/jsdoc-plugin-tuple/blob/main/LICENSE.md).

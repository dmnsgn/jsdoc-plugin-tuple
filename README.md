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

<a name="module_jsdoc-plugin-tuple"></a>

## jsdoc-plugin-tuple

Adds support for TypeScript tuple types and index signatures to JSDoc.

JSDoc parses type expressions with catharsis, whose grammar has no notion of
tuples: `{[number, number]}` is a hard parse error. Tuples are quoted into
string literal types, which catharsis does accept, then unquoted again on the
resulting doclets so documentation renders the original syntax.

- [jsdoc-plugin-tuple](#module_jsdoc-plugin-tuple)
  - [~CLOSERS](#module_jsdoc-plugin-tuple..CLOSERS)
  - [~ARRAY_SUFFIX](#module_jsdoc-plugin-tuple..ARRAY_SUFFIX)
  - [~TYPE_TAG](#module_jsdoc-plugin-tuple..TYPE_TAG)
  - [~INDEX_SIGNATURE](#module_jsdoc-plugin-tuple..INDEX_SIGNATURE)
  - [~TYPED_LISTS](#module_jsdoc-plugin-tuple..TYPED_LISTS)
  - [~handlers](#module_jsdoc-plugin-tuple..handlers)
  - [~findClosing()](#module_jsdoc-plugin-tuple..findClosing)
  - [~normalizeWhitespace()](#module_jsdoc-plugin-tuple..normalizeWhitespace)
  - [~transformRecord()](#module_jsdoc-plugin-tuple..transformRecord)
  - [~transformComment(comment)](#module_jsdoc-plugin-tuple..transformComment) ⇒ <code>string</code>
  - [~matchEncodedTuple()](#module_jsdoc-plugin-tuple..matchEncodedTuple)
  - [~restoreTypeName(name)](#module_jsdoc-plugin-tuple..restoreTypeName) ⇒ <code>string</code>
  - [~restoreDoclet(doclet)](#module_jsdoc-plugin-tuple..restoreDoclet) ⇒ <code>object</code>

<a name="module_jsdoc-plugin-tuple..CLOSERS"></a>

### jsdoc-plugin-tuple~CLOSERS

Closing character for each bracket pair tracked while scanning.

**Kind**: inner constant of [<code>jsdoc-plugin-tuple</code>](#module_jsdoc-plugin-tuple)
<a name="module_jsdoc-plugin-tuple..ARRAY_SUFFIX"></a>

### jsdoc-plugin-tuple~ARRAY\_SUFFIX

A "[" directly after one of these belongs to an array suffix (`number[]`) or
an indexed access (`Foo["bar"]`), never to a tuple.

**Kind**: inner constant of [<code>jsdoc-plugin-tuple</code>](#module_jsdoc-plugin-tuple)
<a name="module_jsdoc-plugin-tuple..TYPE_TAG"></a>

### jsdoc-plugin-tuple~TYPE\_TAG

A tag whose type expression opens on the same line, eg. `@param {`.

**Kind**: inner constant of [<code>jsdoc-plugin-tuple</code>](#module_jsdoc-plugin-tuple)
<a name="module_jsdoc-plugin-tuple..INDEX_SIGNATURE"></a>

### jsdoc-plugin-tuple~INDEX\_SIGNATURE

`[key: string]: number`, the only index signature shape with a JSDoc
equivalent.

**Kind**: inner constant of [<code>jsdoc-plugin-tuple</code>](#module_jsdoc-plugin-tuple)
<a name="module_jsdoc-plugin-tuple..TYPED_LISTS"></a>

### jsdoc-plugin-tuple~TYPED\_LISTS

Doclet properties holding a list of typed items.

**Kind**: inner constant of [<code>jsdoc-plugin-tuple</code>](#module_jsdoc-plugin-tuple)
<a name="module_jsdoc-plugin-tuple..handlers"></a>

### jsdoc-plugin-tuple~handlers

JSDoc plugin event handlers.

**Kind**: inner constant of [<code>jsdoc-plugin-tuple</code>](#module_jsdoc-plugin-tuple)
<a name="module_jsdoc-plugin-tuple..findClosing"></a>

### jsdoc-plugin-tuple~findClosing()

Index of the bracket closing the one at `start`, or -1.

Uses a stack rather than a counter so that the ">" of an arrow type (`(a:
number) => void`) is not mistaken for the end of a type application. Escapes
are skipped so that a tuple survives both forms it is seen in: quoted in the
comment, and unquoted by catharsis on the doclet.

**Kind**: inner method of [<code>jsdoc-plugin-tuple</code>](#module_jsdoc-plugin-tuple)
<a name="module_jsdoc-plugin-tuple..normalizeWhitespace"></a>

### jsdoc-plugin-tuple~normalizeWhitespace()

Flattens a tuple written across several comment lines onto one line.

**Kind**: inner method of [<code>jsdoc-plugin-tuple</code>](#module_jsdoc-plugin-tuple)
<a name="module_jsdoc-plugin-tuple..transformRecord"></a>

### jsdoc-plugin-tuple~transformRecord()

Maps an index signature to its JSDoc equivalent, or transforms the members of
a plain record type. Mapped types (`{[K in keyof T]: V}`) have no equivalent
and are left for JSDoc to report.

**Kind**: inner method of [<code>jsdoc-plugin-tuple</code>](#module_jsdoc-plugin-tuple)
<a name="module_jsdoc-plugin-tuple..transformComment"></a>

### jsdoc-plugin-tuple~transformComment(comment) ⇒ <code>string</code>

Rewrites the tuple and index signature types of a JSDoc comment into
equivalents JSDoc can parse.

**Kind**: inner method of [<code>jsdoc-plugin-tuple</code>](#module_jsdoc-plugin-tuple)
**Returns**: <code>string</code> - The rewritten comment.

| Param   | Type                | Description                                        |
| ------- | ------------------- | -------------------------------------------------- |
| comment | <code>string</code> | The raw comment, as passed to `jsdocCommentFound`. |

<a name="module_jsdoc-plugin-tuple..matchEncodedTuple"></a>

### jsdoc-plugin-tuple~matchEncodedTuple()

Start and end of the encoded tuple opening at `index`, or null.

**Kind**: inner method of [<code>jsdoc-plugin-tuple</code>](#module_jsdoc-plugin-tuple)
<a name="module_jsdoc-plugin-tuple..restoreTypeName"></a>

### jsdoc-plugin-tuple~restoreTypeName(name) ⇒ <code>string</code>

Unquotes the tuples of a single type name, eg. `Array.<"[number, number]">`.

**Kind**: inner method of [<code>jsdoc-plugin-tuple</code>](#module_jsdoc-plugin-tuple)
**Returns**: <code>string</code> - The name with its tuples restored.

| Param | Type                | Description         |
| ----- | ------------------- | ------------------- |
| name  | <code>string</code> | A doclet type name. |

<a name="module_jsdoc-plugin-tuple..restoreDoclet"></a>

### jsdoc-plugin-tuple~restoreDoclet(doclet) ⇒ <code>object</code>

Restores the tuple syntax of a doclet in place, so documentation shows what
was written rather than the quoted form JSDoc parsed.

**Kind**: inner method of [<code>jsdoc-plugin-tuple</code>](#module_jsdoc-plugin-tuple)
**Returns**: <code>object</code> - The same doclet.

| Param  | Type                | Description                           |
| ------ | ------------------- | ------------------------------------- |
| doclet | <code>object</code> | The doclet, as passed to `newDoclet`. |

<!-- api-end -->

## License

MIT. See [license file](https://github.com/dmnsgn/jsdoc-plugin-tuple/blob/main/LICENSE.md).

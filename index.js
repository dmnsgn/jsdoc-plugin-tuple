/**
 * Adds support for TypeScript tuple types and index signatures to JSDoc.
 *
 * JSDoc parses type expressions with catharsis, whose grammar has no notion of
 * tuples: `{[number, number]}` is a hard parse error. Tuples are quoted into
 * string literal types, which catharsis does accept, then unquoted again on the
 * resulting doclets so documentation renders the original syntax.
 *
 * @module jsdoc-plugin-tuple
 */

/** Closing character for each bracket pair tracked while scanning. */
const CLOSERS = { "[": "]", "<": ">", "(": ")", "{": "}" };

/**
 * A "[" directly after one of these belongs to an array suffix (`number[]`) or
 * an indexed access (`Foo["bar"]`), never to a tuple.
 */
const ARRAY_SUFFIX = /[\w$\]>)]/;

/** A tag whose type expression opens on the same line, eg. `@param {`. */
const TYPE_TAG = /@[a-zA-Z]+[ \t]*\{/g;

/**
 * `[key: string]: number`, the only index signature shape with a JSDoc
 * equivalent.
 */
const INDEX_SIGNATURE =
  /^\s*(?:readonly\s+)?\[\s*[A-Za-z_$][\w$]*\s*:\s*([^\]]+?)\s*\]\s*:\s*([\s\S]+?)\s*;?\s*$/;

const READONLY = /(?:^|[^\w$])(readonly\s+)$/;

function skipString(source, index) {
  const quote = source[index];
  let i = index + 1;
  while (i < source.length) {
    if (source[i] === "\\") {
      i += 2;
      continue;
    }
    if (source[i] === quote) return i + 1;
    i++;
  }
  return source.length;
}

/**
 * Index of the bracket closing the one at `start`, or -1.
 *
 * Uses a stack rather than a counter so that the ">" of an arrow type (`(a:
 * number) => void`) is not mistaken for the end of a type application. Escapes
 * are skipped so that a tuple survives both forms it is seen in: quoted in the
 * comment, and unquoted by catharsis on the doclet.
 */
function findClosing(source, start) {
  const stack = [CLOSERS[source[start]]];
  let i = start + 1;
  while (i < source.length) {
    const char = source[i];
    if (char === "\\") {
      i += 2;
      continue;
    }
    if (char === '"' || char === "'") {
      i = skipString(source, i);
      continue;
    }
    if (char === stack[stack.length - 1]) {
      stack.pop();
      if (!stack.length) return i;
    } else if (CLOSERS[char]) {
      stack.push(CLOSERS[char]);
    }
    i++;
  }
  return -1;
}

/** Flattens a tuple written across several comment lines onto one line. */
function normalizeWhitespace(text) {
  return text
    .replace(/\s*\r?\n[ \t]*\*?[ \t]*/g, " ")
    .replace(/\s{2,}/g, " ")
    .replace(/\[\s+/g, "[")
    .replace(/\s+\]/g, "]")
    .trim();
}

function encodeTuple(text) {
  return `"${normalizeWhitespace(text).replace(/(["\\])/g, "\\$1")}"`;
}

function isTupleStart(expression, index) {
  const before = expression.slice(0, index);
  if (READONLY.test(before)) return true;
  const previous = before.replace(/\s+$/, "").slice(-1);
  return !previous || !ARRAY_SUFFIX.test(previous);
}

/**
 * Maps an index signature to its JSDoc equivalent, or transforms the members of
 * a plain record type. Mapped types (`{[K in keyof T]: V}`) have no equivalent
 * and are left for JSDoc to report.
 */
function transformRecord(members) {
  const match = members.match(INDEX_SIGNATURE);
  if (match) {
    return `Object.<${match[1]}, ${transformTypeExpression(match[2])}>`;
  }
  return `{${transformTypeExpression(members)}}`;
}

function transformTypeExpression(expression) {
  let result = "";
  let i = 0;

  while (i < expression.length) {
    const char = expression[i];

    if (char === '"' || char === "'") {
      const end = skipString(expression, i);
      result += expression.slice(i, end);
      i = end;
      continue;
    }

    if (char === "{" || (char === "[" && isTupleStart(expression, i))) {
      const end = findClosing(expression, i);
      if (end === -1) {
        result += char;
        i++;
        continue;
      }
      if (char === "{") {
        result += transformRecord(expression.slice(i + 1, end));
      } else {
        // Carry a "readonly" modifier inside the quotes: on its own it is not a
        // type catharsis can parse.
        const readonly = result.match(READONLY);
        if (readonly) result = result.slice(0, -readonly[1].length);
        result += encodeTuple(
          (readonly ? readonly[1] : "") + expression.slice(i, end + 1),
        );
      }
      i = end + 1;
      continue;
    }

    result += char;
    i++;
  }

  return result;
}

/**
 * Rewrites the tuple and index signature types of a JSDoc comment into
 * equivalents JSDoc can parse.
 *
 * @param {string} comment The raw comment, as passed to `jsdocCommentFound`.
 * @returns {string} The rewritten comment.
 */
function transformComment(comment) {
  if (typeof comment !== "string" || !comment.includes("[")) return comment;

  let result = "";
  let last = 0;
  let match;

  TYPE_TAG.lastIndex = 0;
  while ((match = TYPE_TAG.exec(comment))) {
    const open = match.index + match[0].length - 1;
    const close = findClosing(comment, open);
    if (close === -1) break;

    result +=
      comment.slice(last, open + 1) +
      transformTypeExpression(comment.slice(open + 1, close));
    last = close;
    TYPE_TAG.lastIndex = close;
  }

  return result + comment.slice(last);
}

/** Start and end of the encoded tuple opening at `index`, or null. */
function matchEncodedTuple(name, index) {
  const readonly = name.slice(index + 1).match(/^readonly\s+/);
  const start = index + 1 + (readonly ? readonly[0].length : 0);
  if (name[start] !== "[") return null;

  const end = findClosing(name, start);
  if (end === -1 || name[end + 1] !== '"') return null;

  return { text: name.slice(index + 1, end + 1), end: end + 2 };
}

/**
 * Unquotes the tuples of a single type name, eg. `Array.<"[number, number]">`.
 *
 * @param {string} name A doclet type name.
 * @returns {string} The name with its tuples restored.
 */
function restoreTypeName(name) {
  if (typeof name !== "string" || !name.includes('"')) return name;

  let result = "";
  let i = 0;

  while (i < name.length) {
    if (name[i] === '"') {
      const tuple = matchEncodedTuple(name, i);
      if (tuple) {
        result += tuple.text.replace(/\\(["\\])/g, "$1");
        i = tuple.end;
        continue;
      }
    }
    result += name[i];
    i++;
  }

  return result;
}

/** Doclet properties holding a list of typed items. */
const TYPED_LISTS = ["params", "properties", "returns", "yields", "exceptions"];

function restoreType(type) {
  if (type && Array.isArray(type.names))
    type.names = type.names.map(restoreTypeName);
}

/**
 * Restores the tuple syntax of a doclet in place, so documentation shows what
 * was written rather than the quoted form JSDoc parsed.
 *
 * @param {object} doclet The doclet, as passed to `newDoclet`.
 * @returns {object} The same doclet.
 */
function restoreDoclet(doclet) {
  if (!doclet) return doclet;

  restoreType(doclet.type);
  for (const list of TYPED_LISTS) {
    if (Array.isArray(doclet[list])) {
      for (const item of doclet[list]) restoreType(item && item.type);
    }
  }

  return doclet;
}

/** JSDoc plugin event handlers. */
const handlers = {
  jsdocCommentFound(event) {
    event.comment = transformComment(event.comment);
  },
  newDoclet(event) {
    restoreDoclet(event.doclet);
  },
};

exports.handlers = handlers;
exports.transformComment = transformComment;
exports.restoreDoclet = restoreDoclet;

import { describe, it } from "node:test";
import assert from "node:assert/strict";

import { transformComment, restoreDoclet, handlers } from "../index.js";

const type = (expression) => `/** @param {${expression}} a */`;

const transformType = (expression) => {
  const match = transformComment(type(expression)).match(/\{([\s\S]*)\} a/);
  return match[1];
};

describe("transformComment()", () => {
  describe("tuples", () => {
    const cases = [
      ["[number, number]", `"[number, number]"`],
      ["[Point, Point]", `"[Point, Point]"`],
      ["[x: number, y: number]", `"[x: number, y: number]"`],
      ["[number, number?]", `"[number, number?]"`],
      ["[string, ...number[]]", `"[string, ...number[]]"`],
      ["[number, [string, boolean]]", `"[number, [string, boolean]]"`],
      ["[]", `"[]"`],
      ["readonly [number, number]", `"readonly [number, number]"`],
      ["[number, number][]", `"[number, number]"[]`],
      ["[number, number]|null", `"[number, number]"|null`],
      ["Array<[number, number]>", `Array<"[number, number]">`],
      [
        "Object.<string, [number, number]>",
        `Object.<string, "[number, number]">`,
      ],
      ["[number, number]=", `"[number, number]"=`],
      ["...[number, number]", `..."[number, number]"`],
      ["?[number, number]", `?"[number, number]"`],
      ["{a: [number, number]}", `{a: "[number, number]"}`],
    ];

    for (const [source, expected] of cases) {
      it(source, () => assert.equal(transformType(source), expected));
    }
  });

  describe("index signatures", () => {
    const cases = [
      ["{[key: string]: number}", "Object.<string, number>"],
      ["{[index: number]: string}", "Object.<number, string>"],
      [
        "{[key: string]: [number, number]}",
        `Object.<string, "[number, number]">`,
      ],
      ["{readonly [key: string]: number}", "Object.<string, number>"],
    ];

    for (const [source, expected] of cases) {
      it(source, () => assert.equal(transformType(source), expected));
    }
  });

  describe("passes through", () => {
    const untouched = [
      "number[]",
      "Array.<number>",
      "Array<Array<number>>",
      "Object.<string, number>",
      "{a: number, b: string}",
      "string",
      "*",
      '"[literal]"',
    ];

    for (const source of untouched) {
      it(source, () => assert.equal(transformType(source), source));
    }

    it("leaves descriptions alone", () => {
      const comment =
        "/**\n * Text with [brackets] and {@link Foo}.\n * @param {number} a [not a tuple]\n */";
      assert.equal(transformComment(comment), comment);
    });

    it("leaves comments without brackets alone", () => {
      const comment = "/**\n * @param {string} a A string.\n */";
      assert.equal(transformComment(comment), comment);
    });

    it("leaves non-strings alone", () => {
      assert.equal(transformComment(undefined), undefined);
    });
  });

  it("flattens a tuple spanning several lines", () => {
    const comment =
      "/**\n * @param {[\n *   number,\n *   number\n * ]} a A tuple.\n */";
    assert.equal(
      transformComment(comment),
      '/**\n * @param {"[number, number]"} a A tuple.\n */',
    );
  });

  it("transforms every tag holding a type", () => {
    const comment =
      "/**\n * @typedef {[number, number]} Point\n * @property {[number, number]} range\n * @returns {[number, number]} A tuple.\n */";
    assert.equal(comment.match(/\[number, number\]/g).length, 3);
    assert.equal(
      transformComment(comment).match(/"\[number, number\]"/g).length,
      3,
    );
  });
});

describe("restoreDoclet()", () => {
  const names = (doclet) => restoreDoclet(doclet);

  it("restores a member type", () => {
    assert.deepEqual(
      names({ type: { names: [`"[number, number]"`] } }).type.names,
      ["[number, number]"],
    );
  });

  it("restores tuples nested in a type application", () => {
    assert.deepEqual(
      names({ type: { names: [`Array.<"[x: number, y: number]">`] } }).type
        .names,
      ["Array.<[x: number, y: number]>"],
    );
  });

  it("restores every typed list", () => {
    const doclet = names({
      params: [{ type: { names: [`"[number, number]"`, "null"] } }],
      properties: [{ type: { names: [`"[number, number]"`] } }],
      returns: [{ type: { names: [`"[boolean, string]"`] } }],
      yields: [{ type: { names: [`"[]"`] } }],
      exceptions: [{ type: { names: ["Error"] } }],
    });

    assert.deepEqual(doclet.params[0].type.names, ["[number, number]", "null"]);
    assert.deepEqual(doclet.properties[0].type.names, ["[number, number]"]);
    assert.deepEqual(doclet.returns[0].type.names, ["[boolean, string]"]);
    assert.deepEqual(doclet.yields[0].type.names, ["[]"]);
    assert.deepEqual(doclet.exceptions[0].type.names, ["Error"]);
  });

  it("restores a readonly tuple", () => {
    assert.deepEqual(
      names({ type: { names: [`"readonly [number, number]"`] } }).type.names,
      ["readonly [number, number]"],
    );
  });

  it("leaves string literal types alone", () => {
    assert.deepEqual(names({ type: { names: [`"a"|"b"`] } }).type.names, [
      `"a"|"b"`,
    ]);
  });

  it("leaves doclets without types alone", () => {
    assert.deepEqual(names({ kind: "function" }), { kind: "function" });
    assert.equal(restoreDoclet(undefined), undefined);
  });
});

describe("round trip", () => {
  const roundTrip = (expression) => {
    const doclet = { type: { names: [transformType(expression)] } };
    return restoreDoclet(doclet).type.names[0];
  };

  for (const expression of [
    "[number, number]",
    "[x: number, y: number]",
    "[number, [string, boolean]]",
    "readonly [number, number]",
    "[]",
    `[a: "x"|"y", number]`,
  ]) {
    it(expression, () => assert.equal(roundTrip(expression), expression));
  }
});

describe("handlers", () => {
  it("rewrites the comment on jsdocCommentFound", () => {
    const event = { comment: type("[number, number]") };
    handlers.jsdocCommentFound(event);
    assert.equal(event.comment, type(`"[number, number]"`));
  });

  it("restores the doclet on newDoclet", () => {
    const event = { doclet: { type: { names: [`"[number, number]"`] } } };
    handlers.newDoclet(event);
    assert.deepEqual(event.doclet.type.names, ["[number, number]"]);
  });
});

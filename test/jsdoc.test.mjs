import { describe, it, before } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { writeFileSync, mkdtempSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { fileURLToPath } from "node:url";

import jsdocParse from "jsdoc-parse";

const FIXTURE = join(import.meta.dirname, "fixtures", "tuples.js");

/**
 * Runs JSDoc over the fixture with the plugin installed. JSDoc reports a type
 * it cannot parse on stderr and still exits 0, so stderr is part of the
 * result.
 */
function runJsdoc() {
  const config = join(
    mkdtempSync(join(tmpdir(), "jsdoc-plugin-tuple-")),
    "conf.json",
  );
  writeFileSync(
    config,
    JSON.stringify({
      plugins: [join(import.meta.dirname, "..", "index.js")],
    }),
  );

  const { status, stdout, stderr } = spawnSync(
    process.execPath,
    [
      fileURLToPath(import.meta.resolve("jsdoc/jsdoc.js")),
      "-c",
      config,
      "-X",
      FIXTURE,
    ],
    { encoding: "utf8" },
  );
  assert.equal(status, 0, stderr);

  return { doclets: JSON.parse(stdout), stderr };
}

describe("jsdoc", () => {
  let doclets;
  let stderr;
  let byName;

  before(() => {
    ({ doclets, stderr } = runJsdoc());
    byName = new Map(doclets.map((doclet) => [doclet.longname, doclet]));
  });

  it("parses every tuple without an error", () => {
    assert.equal(stderr, "");
  });

  it("documents a tuple typedef", () => {
    assert.deepEqual(byName.get("Point").type.names, [
      "[x: number, y: number]",
    ]);
  });

  it("documents a tuple member", () => {
    assert.deepEqual(byName.get("size").type.names, ["[number, number]"]);
  });

  it("documents a tuple property", () => {
    const [range] = byName.get("Options").properties;
    assert.deepEqual(range.type.names, ["[number, number]"]);
  });

  it("documents a tuple return", () => {
    const [returns] = byName.get("everything").returns;
    assert.deepEqual(returns.type.names, ["[boolean, string]"]);
  });

  it("documents every tuple parameter", () => {
    const types = Object.fromEntries(
      byName
        .get("everything")
        .params.map(({ name, type }) => [name, type.names]),
    );

    assert.deepEqual(types, {
      plain: ["[number, number]"],
      typedefs: ["[Point, Point]"],
      nested: ["[number, [string, boolean]]"],
      arrayOf: ["Array.<[number, number]>"],
      generic: ["Array.<[string, ...number[]]>"],
      union: ["[number, number]", "null"],
      optional: ["[number, number?]"],
      readOnly: ["readonly [number, number]"],
      empty: ["[]"],
      indexSignature: ["Object.<string, number>"],
      // JSDoc reduces every record type to "Object", tuple members or not.
      record: ["Object"],
      multiline: ["[number, number]"],
      untouched: ["Array.<number>"],
    });
  });

  it("documents string literal tuple members", () => {
    const [literals] = byName.get("literals").params;
    assert.deepEqual(literals.type.names, [`[kind: "x"|"y", value: number]`]);
  });

  it("survives jsdoc-parse", () => {
    const [point] = jsdocParse(doclets).filter(({ id }) => id === "Point");
    assert.deepEqual(point.type.names, ["[x: number, y: number]"]);
  });
});

/**
 * A 2D point.
 * @typedef {[x: number, y: number]} Point
*/

/**
 * Every tuple shape the plugin claims to support.
 * @param {[number, number]} plain A tuple.
 * @param {[Point, Point]} typedefs A tuple of typedefs.
 * @param {[number, [string, boolean]]} nested A nested tuple.
 * @param {[number, number][]} arrayOf An array of tuples.
 * @param {Array<[string, ...number[]]>} generic A tuple as a type argument.
 * @param {[number, number]|null} union A tuple in a union.
 * @param {[number, number?]} optional An optional member.
 * @param {readonly [number, number]} readOnly A readonly tuple.
 * @param {[]} empty An empty tuple.
 * @param {{[key: string]: number}} indexSignature An index signature.
 * @param {{a: [number, number]}} record A tuple in a record type.
 * @param {[
 *   number,
 *   number
 * ]} multiline A tuple spanning several lines.
 * @param {number[]} untouched A plain array.
 * @returns {[boolean, string]} A tuple.
 */
function everything(
  plain,
  typedefs,
  nested,
  arrayOf,
  generic,
  union,
  optional,
  readOnly,
  empty,
  indexSignature,
  record,
  multiline,
  untouched,
) {}

/**
 * A tuple as a member type.
 * @type {[number, number]}
 */
const size = [0, 0];

/**
 * Options.
 * @typedef {object} Options
 * @property {[number, number]} range A tuple property.
 */

/**
 * String literal members.
 * @param {[kind: "x"|"y", value: number]} literals A tuple of string literals.
 */
function literals(literals) {}

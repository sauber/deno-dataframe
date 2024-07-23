/**
 * A module storing transforming data in columnar format
 *
 * @example
 * ```ts
 * import { DataFrame } from "@sauber/dataframe";
 * 
 * const testdata = [
 *   { n: 1, s: "a", b: true },
 *   { n: 2, s: "b", b: false },
 * ];
 *
 *  const df = DataFrame.fromRecords(testdata);
 *  const sorted = df.sort("n");
* ```
 *
 * @module
 */

export * from "./src/dataframe.ts";
export * from "./src/series.ts";

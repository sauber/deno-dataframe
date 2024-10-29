import {
  assertEquals,
  assertGreaterOrEqual,
  assertInstanceOf,
  assertLessOrEqual,
} from "@std/assert";
import { DataFrame } from "./dataframe.ts";
import type { SeriesTypes } from "./series.ts";

const testdata = [
  { n: 1, s: "a", b: true, o: { l: "foo" } },
  { n: 3, s: "b", b: false, o: { l: "bar" } },
];

Deno.test("Empty initialization", () => {
  const df = new DataFrame();
  assertInstanceOf(df, DataFrame);
});

Deno.test("Import and export records", () => {
  const df = DataFrame.fromRecords(testdata);
  assertEquals(df.column("b").values, [true, false]);
  const e = df.records;
  assertEquals(testdata, e);
});

Deno.test("Explicit define headers", () => {
  const df = DataFrame.fromDef(
    { n: "number", s: "string", b: "bool", o: "object" },
    testdata
  );
  assertEquals(df.names, ["n", "s", "b", "o"]);
});

Deno.test("Print as Table", { ignore: true }, () => {
  const df = DataFrame.fromRecords(testdata);
  assertEquals(df.print(), undefined, "Without Title");
  assertEquals(df.print("Test Title"), undefined, "With Title");
});

Deno.test("Grid", () => {
  const df = DataFrame.fromRecords(testdata);
  const g: SeriesTypes[][] = df.grid;
  assertEquals(g[0][0], 1);
});

Deno.test("Include Columns", () => {
  const df = DataFrame.fromRecords(testdata);
  const cols = ["s", "n"];
  const sel = df.include(cols);
  assertEquals(sel.names, cols);
});

Deno.test("Exclude columns", () => {
  const df = DataFrame.fromRecords(testdata);
  const cols = ["s", "n"];
  const sel = df.exclude(cols);
  assertEquals(sel.names, ["b", "o"]);
});

Deno.test("Correlation Matrix", () => {
  function r() {
    return Math.round(10 * Math.random());
  }

  // Input records
  const i = DataFrame.fromRecords([
    { i1: r(), i2: r(), i3: r() },
    { i1: r(), i2: r(), i3: r() },
    { i1: r(), i2: r(), i3: r() },
  ]);

  // Output records
  const o = DataFrame.fromRecords([
    { o1: r(), o2: r() },
    { o1: r(), o2: r() },
    { o1: r(), o2: r() },
  ]);

  // Correlated input to output
  const c: DataFrame = i.correlationMatrix(o);
  console.log({c});

  // Confirm row and column names
  assertEquals(c.column("Keys").values, ["i1", "i2", "i3"]);
  assertEquals(c.names, ["Keys", "o1", "o2"]);

  // Confirm output in range -1 to +1
  ["o1", "o2"].forEach((name) =>
    c.values<number>(name).forEach((v) => {
      assertGreaterOrEqual(v, -1);
      assertLessOrEqual(v, 1);
    })
  );
});

Deno.test("Sorting", () => {
  const testdata = [{ k: 2 }, { k: 1 }];
  const df = DataFrame.fromRecords(testdata);
  const sorted = df.sort("k");
  assertEquals(sorted.records, testdata.reverse());
});

Deno.test("Generate Column", () => {
  const df = DataFrame.fromRecords(testdata);
  const amend = df.amend("neg", (r) => (r.n !== undefined ? -r.n : undefined));
  assertEquals(amend.column("neg").values, [-1, -3]);
});

Deno.test("Reverse Rows", () => {
  const df = DataFrame.fromRecords(testdata);
  const rev = df.reverse;
  assertEquals(rev.column("n").values, [1, 3]);
});

Deno.test("Shuffle Rows", () => {
  const df = DataFrame.fromRecords(testdata);
  const ran = df.shuffle;
  assertEquals(ran.length, 2);
});

Deno.test("Reduce Rows", () => {
  const df = DataFrame.fromRecords(testdata);
  const rev = df.slice(0, 1);
  assertEquals(rev.records, [testdata[0]]);
});

Deno.test("Filter Rows", () => {
  const df = DataFrame.fromRecords(testdata);
  const rev = df.select((r) => r.b);
  assertEquals(rev.records, [testdata[0]]);
});

Deno.test("Rename Columns", () => {
  const df = DataFrame.fromRecords(testdata);
  const mv = df.rename({ s: "t", b: "c" });
  assertEquals(mv.names, ["n", "t", "c", "o"]);
});

Deno.test("Combine DataFrames", () => {
  const df = DataFrame.fromRecords(testdata);
  const dg = DataFrame.fromRecords([{ o: 4 }, { o: 5 }]);
  const dc = df.join(dg);
  assertEquals(dc.values<number>("n"), [1, 3]);
  assertEquals(dc.values<number>("o"), [4, 5]);
});

Deno.test("Distribution", () => {
  const df = DataFrame.fromRecords(testdata);
  const ds = df.distribute("n");
  assertEquals(ds.values<number>("n"), [0.25, 0.75]);
});

Deno.test("Digits", () => {
  const df = DataFrame.fromRecords(testdata);
  const dn = df.scale("n", 1 / 7).digits(2);
  assertEquals(dn.values<number>("n"), [0.14, 0.43]);
});

Deno.test("Log", () => {
  const df = DataFrame.fromRecords(testdata);
  const dl = df.log("n").digits(3);
  assertEquals(dl.values<number>("n"), [0, 1.099]);
});

Deno.test("Addition", () => {
  const df = DataFrame.fromRecords(testdata);
  const da = df.add("n", 1);
  assertEquals(da.values<number>("n"), [2, 4]);
});

Deno.test("Outlier Detection", () => {
  const values = [1, 2, 1, 2, 1, 10];
  const outldata = values.map((x) => ({ n: x }));
  const df = DataFrame.fromRecords(outldata);
  const dr = df.outlier(2);
  assertEquals(df.values("n"), values);
  assertEquals(dr.values("n"), values.slice(0, -1));
});

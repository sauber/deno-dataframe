import { assertEquals, assertInstanceOf } from "@std/assert";
import { BoolSeries, ObjectSeries, Series, TextSeries } from "./series.ts";

Deno.test("Numbers", () => {
  const s = new Series();
  assertInstanceOf(s, Series);
});

Deno.test("Text", () => {
  const s = new TextSeries();
  assertInstanceOf(s, TextSeries);
});

Deno.test("Boolean", () => {
  const s = new BoolSeries();
  assertInstanceOf(s, BoolSeries);
});

Deno.test("Object", () => {
  const s = new ObjectSeries();
  assertInstanceOf(s, ObjectSeries);
});

Deno.test("First and last", () => {
  const s = new Series([10, 20]);
  assertEquals(s.first, 10);
  assertEquals(s.last, 20);
});

Deno.test("Any item", () => {
  const s = new Series([10]);
  assertEquals(s.any, 10);
});

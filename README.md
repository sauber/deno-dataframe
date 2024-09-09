# deno-dataframe

Data is stored in columns. Most operations only apply to the index and no changes are made to original columns.
When exported only modified data will be included.

## Examples

Import data from array of records:

```typescript
import { DataFrame } from "@sauber/dataframe";

const records = [
  { n: 1, s: "a", b: true },
  { n: 2, s: "b", b: false },
];

const dataframe: DataFrame = DataFrame.fromRecords(records);
```

Create new dataframe only with certain columns included:

```typescript
// Result only includes columns "n" and "s"
const inclusive: DataFrame = dataframe.include(["n", "s"]);
```

Create new dataframe with certain clumns excluded:

```typescript
// Result does not include column "b"
const exclusive: DataFrame = dataframe.exclude(["b"]);
```

Reduce count of significant digits:

```typescript
const longNumbers = [
  { s: "a", n: 0.125 },
  { s: "b", n: 0.6666 },
];

// Only two significant digits in result, ie. 0.13 and 0.67
const short: DataFrame = DataFrame.fromRecords(longNumbers).digits(2);
```

Sort rows by value in one column:

```typescript
// Sort rows alphabetically by text column s
const alphabetically: DataFrame = dataframe.sort("s");

// Sort rows alphabetically by number column n
const numerically: DataFrame = dataframe.sort("n");
```

Generate a new column based on values in existing columns:

```typescript
// Add new column "squared"
const amended: DataFrame = dataframe.amend("squared", (row) => row.n * row.n);
```

Include only matching rows:

```typescript
// Keep only rows where column "n" is greater than 1
const matching: DataFrame = dataframe.select((row) => row.n > 1);
```

Reverse order of rows:

```typescript
// Rows in opposite order
const reversed: DataFrame = dataframe.reverse;
```

Keep range of rows:

```typescript
// Keep only first two rows
const range: DataFrame = dataframe.slice(0, 2);
```

Shuffle order of rows:

```typescript
// Random reordering of rows
const random: DataFrame = dataframe.shuffle;
```

Combine two dataframes. Both dataframes must have identical index.

```typescript
const other: DataFrame = new DataFrame.fromRecords([
  { o: 3, p: "yes" },
  { o: 4, p: "no" },
]);

// Result has columns "n", "s", "b", "o" and "p"
const extended: DataFrame = dataframe.join(other);
```

Rename columns:

```typescript
// Rename column "s" to "t", and columns "n" to "o"
const renamed: DataFrame = dataframe.rename({ s: "t", n: "o" });
```

Scale values in column to make sum equal to one:

```typescript
// Column "n" will have values 0.333... and 0.666...
const distributed: DataFrame = dataframe.distribute("n");
```

Take log2 of each value in column:

```typescript
// Column "n" will have values 0 and 0.6931471805599453
const log: DataFrame = dataframe.log("n");
```

Scale each value in column by factor:

```typescript
// Column "n" will have values 5 and 10
const scaled: DataFrame = dataframe.scale("n", 5);
```

Increment each value in column by value:

```typescript
// Column "n" will have values 6 and 7
const raised: DataFrame = dataframe.add("n", 5);
```

Export columns to list of records:

```typescript
// [ { n: 1, s: "a", b: true }, { n: 2, s: "b", b: false } ]
const records: Array<Record<string, string | number | boolean>> =
  dataframe.records;
```

Export values from a columns:

```typescript
// [ 1, 2 ]
const column: Array<number> = dataframe.values<number>("n");
```

Export all values as two-dimensional array:

```typescript
// [ [ 1, "a", true ], [ 2, "b", false ] ]
const matrix: Array<Array<string, string | number | boolean>> = dataframe.grid;
```

Names of columns:

```typescript
// [ "n", "s", "b" ]
const keys: Array<string> = dataframe.names;
```

Count of records:

```typescript
// 3
const count: number = dataframe.length;
```

Pretty print content to console:

```typescript
/** Output:
[ My First DataFrame ]
╔═══╤═══╤═══════╗
║ n │ s │ b     ║
╟───┼───┼───────╢
║ 1 │ a │  true ║
║ 2 │ b │ false ║
╚═══╧═══╧═══════╝
*/
dataframe.print("My First DataFrame");
```

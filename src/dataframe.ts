import { avg, correlation, std } from "@sauber/statistics";
import { Table } from "@sauber/table";
import { shuffleArray } from "@hugoalh/shuffle-array";
import { BoolSeries, ObjectSeries, Series, TextSeries } from "./series.ts";
import type { SeriesClasses, SeriesTypes } from "./series.ts";

type Column = Series | TextSeries | BoolSeries | ObjectSeries<object>;
type Columns = Record<string, Column>;

/** A single record of values spanning columns */
export type RowRecord = Record<string, SeriesTypes>;

/** All columns converted to list of records */
export type RowRecords = Array<RowRecord>;

type RowValues = Array<SeriesTypes>;
type Index = number[];
type ColumnNames = string[];
type SortElement = [number, SeriesTypes];
type RowCallback = (row: RowRecord) => SeriesTypes;
type ColumnName = string;
type ColumnTypeName = "number" | "string" | "bool" | "object";
type Header = Record<ColumnName, ColumnTypeName>;

/** Auto-generate a series from an array of unknown values */
function series(array: Array<unknown>): SeriesClasses {
  switch (typeof array.filter((v) => v != undefined)[0]) {
    case "number":
      return new Series(array as number[]);
    case "string":
      return new TextSeries(array as string[]);
    case "boolean":
      return new BoolSeries(array as boolean[]);
    default:
      return new ObjectSeries<object>(array as object[]);
  }
}

/** A collection of series with same length */
export class DataFrame {
  private readonly index: Index;

  constructor(
    // Data Series
    private readonly columns: Columns = {},
    // Ordering of rows
    index?: Index,
  ) {
    // Names of columns
    const names: ColumnNames = Object.keys(columns);

    // Index
    if (index) {
      this.index = index;
    } else {
      if (names.length) {
        const first = columns[names[0]];
        this.index = Array.from(Array(first.length).keys());
      } else {
        this.index = [];
      }
    }
  }

  /** Import data from list of records, autodetect types from first record */
  public static fromRecords(records: RowRecords): DataFrame {
    // Transpose records to columns
    const arrays: Record<string, Array<unknown>> = {};
    records.forEach((rec: Record<string, unknown>, index: number) =>
      Object.entries(rec).forEach(([key, value]) => {
        if (!(key in arrays)) {
          arrays[key] = new Array(records.length).with(index, value);
        } else arrays[key][index] = value;
      })
    );

    // Identify types of columns
    const columns: Columns = Object.assign(
      {},
      ...Object.entries(arrays).map(([key, array]) => ({
        [key]: series(array),
      })),
    );

    // Compile DataFrame
    return new DataFrame(columns);
  }

  /** Generate a DataFrame from a header definition and optional data.  */
  public static fromDef(header: Header, records: RowRecords = []): DataFrame {
    const columns: Columns = Object.fromEntries(
      Object.entries(header).map(([name, type]) => {
        const values = records.map((r) => r[name]);
        const series = function () {
          switch (type) {
            case "number":
              return new Series(values as number[]);
            case "string":
              return new TextSeries(values as string[]);
            case "bool":
              return new BoolSeries(values as boolean[]);
            default:
              return new ObjectSeries<object>(values as object[]);
          }
        };
        return [name, series()];
      }),
    );
    return new DataFrame(columns);
  }

  /** A new dataframe with subset of columns */
  public include(names: ColumnNames): DataFrame {
    return new DataFrame(
      Object.assign({}, ...names.map((x) => ({ [x]: this.column(x) }))),
      this.index,
    );
  }

  /** A new dataframe except named columns */
  public exclude(names: ColumnNames): DataFrame {
    const keep: ColumnNames = this.names.filter((n) => !names.includes(n));
    return this.include(keep);
  }

  /** Correlation of each series to each series on other dataframe
   * TODO: Only apply to rows in index
   */
  public correlationMatrix(other: DataFrame): DataFrame {
    const RowRecords = this.names;
    const cols = other.names;
    const columns: Columns = {
      Name: new TextSeries(RowRecords),
    };
    for (const colname of cols) {
      const results: number[] = [];
      for (const RowRecordname of RowRecords) {
        const sc = other.column(colname) as Series;
        const sr = this.column(RowRecordname) as Series;
        const coef: number = correlation(
          sc.values as number[],
          sr.values as number[],
        );
        results.push(coef);
      }
      columns[colname] = new Series(results);
    }

    return new DataFrame(columns);
  }

  /** Generate new number series based on existing named series */
  private generate(name: string, callback: (n: number) => number): Series {
    const current = this.columns[name].values as Array<number>;
    const values = Array<number>(current.length);
    for (const i of this.index) {
      if (current[i] != undefined) values[i] = callback(current[i]);
    }
    return new Series(values);
  }

  /** Reduce count of significant digits */
  public digits(units: number, names: string[] = this.names): DataFrame {
    const columns: Columns = {};
    names.forEach((name) => {
      const column: Column = this.column(name);
      // Only change columns with numbers
      columns[name] = column.isNumber
        ? this.generate(name, (n) => parseFloat(n.toFixed(units)))
        : column;
    });
    return new DataFrame(columns, this.index);
  }

  /** Sort rows by columns */
  public sort(colname: string, ascending: boolean = true): DataFrame {
    const index: Index = this.index;
    const value: SeriesTypes[] = this.column(colname).values;
    const zip: Array<SortElement> = index.map((i: number) => [i, value[i]]);
    const sorted: Array<SortElement> = ascending
      ? zip.sort((a, b) => (a[1] || 0) < (b[1] || 0) ? -1 : 1)
      : zip.sort((a, b) => (a[1] || 0) > (b[1] || 0) ? -1 : 1);
    const order: Index = sorted.map((a: SortElement) => a[0]);
    return this.reindex(order);
  }

  /** Generate a new column from existing columns */
  public amend<SeriesTypes>(name: string, callback: RowCallback): DataFrame {
    const array = Array(this.length);
    for (const index of this.index) {
      const row = this.record(index);
      const value = callback(row);
      array[index] = value;
    }
    const ser = series(array);
    return new DataFrame(
      Object.assign({}, this.columns, { [name]: ser }),
      this.index,
    );
  }

  /** Rearrange order of rows */
  private reindex(index: Index): DataFrame {
    return new DataFrame(this.columns, index);
  }

  /** Select only matching rows */
  public select(callback: RowCallback): DataFrame {
    return this.reindex(
      this.index.filter((index: number) => callback(this.record(index))),
    );
  }

  /** Rows in reverse order */
  public get reverse(): DataFrame {
    return this.reindex(this.index.slice().reverse());
  }

  /** Slice each column */
  public slice(start: number, end: number): DataFrame {
    return this.reindex(this.index.slice(start, end));
  }

  /** Rows in random order */
  public get shuffle(): DataFrame {
    return this.reindex(shuffleArray(this.index));
  }

  /** Combine with series from other DataFrame */
  public join(other: DataFrame): DataFrame {
    return new DataFrame(Object.assign({}, this.columns, other.columns));
  }

  /** Rename columns */
  public rename(names: Record<string, string>): DataFrame {
    const columns: Columns = {};
    Object.entries(this.columns).forEach(([from, column]) => {
      const to: string = from in names ? names[from] : from;
      columns[to] = column;
    });
    return new DataFrame(columns, this.index);
  }

  /** Replace existing column with new */
  private replace(name: string, column: Column): DataFrame {
    const columns: Columns = { ...this.columns };
    columns[name] = column;
    return new DataFrame(columns, this.index);
  }

  /** Generate new numeric series where each value is derived from existing series */
  private derive(name: string, callback: (n: number) => number): DataFrame {
    return this.replace(name, this.generate(name, callback));
  }

  /** Scale values in column to sum of 1 */
  public distribute(name: string): DataFrame {
    const numbers = this.values<number>(name).filter((n) => isFinite(n));
    const sum = numbers.reduce((s, a) => s + a, 0);
    return this.derive(name, (n) => n / sum);
  }

  /** Take log of each value in column */
  public log(name: string): DataFrame {
    return this.derive(name, (n) => Math.log(n));
  }

  /** Scale values in column by factor */
  public scale(name: string, factor: number): DataFrame {
    return this.derive(name, (n) => n * factor);
  }

  /** Add operand to values in column */
  public add(name: string, operand: number): DataFrame {
    return this.derive(name, (n) => n + operand);
  }

  /** Values and columns names from all series at index */
  private record(index: number): RowRecord {
    return Object.assign(
      {},
      ...this.names.map((x) => ({ [x]: this.columns[x].values[index] })),
    );
  }

  /** Export data to list of records */
  public get records(): RowRecords {
    return this.index.map((i: number) => this.record(i));
  }

  /** Values from all series at index */
  private line(index: number): RowValues {
    return this.names.map((x) => this.columns[x].values[index]);
  }

  /** Values from a series */
  public values<T>(name: string): Array<T> {
    const all = this.columns[name].values as Array<T>;
    return this.index.map((i: number) => all[i]);
  }

  /** Export data to matrix */
  public get grid(): Array<RowValues> {
    return this.index.map((i: number) => this.line(i));
  }

  /** Names of Columns */
  public get names(): ColumnNames {
    return Object.keys(this.columns);
  }

  /** Lookup a particular column */
  public column(name: string): Column {
    return this.columns[name];
  }

  /** Count of records */
  public get length(): number {
    return this.index.length;
  }

  /** Pretty print as ascii table */
  public print(title?: string): DataFrame {
    const table = new Table();
    if (title) table.title = title;
    table.headers = this.names;
    table.rows = this.grid;
    console.log("\n" + table.toString());
    return this;
  }

  /** Remove records having numbers deviating by more than a factor of standard deviation of column */
  public outlier(factor: number): DataFrame {
    // Indices of rows having outliers
    const skip = new Set();

    // Loop each column having numerical values
    Object.entries(this.columns).forEach(([name, column]) => {
      if (column.isNumber) {
        const col = this.values<number>(name);
        const mean: number = avg(col);
        const stdv: number = std(col);

        // Loop all rows
        this.index.forEach((i) => {
          const val = column.values[i] as number;
          const outlie = Math.abs(mean - val) / stdv;
          if (outlie > factor) skip.add(i);
        });
      }
    });
    const trimmed = this.index.filter((i: number) => !skip.has(i));
    return this.reindex(trimmed);
  }

  /** Left join columns on matching string values */
  public leftJoin(other: DataFrame, name: string): DataFrame {
    // Names of columns to be inserted
    const names = other.names.filter((n) => n !== name);

    // Source and target columns of keys
    const source: string[] = other.column(name).values as string[];
    const target: string[] = this.column(name).values as string[];

    // Keys to be matched
    const keys: string[] = other.values<string>(name);

    // Generate lookup of source and target row number for each key
    const rowmap: Array<[number, number]> = [];
    keys.forEach((key: string) => {
      const targetRow: number = target.indexOf(key);
      if (targetRow > -1) {
        const sourceRow: number = source.indexOf(key);
        rowmap.push([sourceRow, targetRow]);
      }
    });

    // Copy values from other dataframe to new columns in this dataframe
    const columns: Columns = {};
    names.forEach((n) => {
      const values: SeriesTypes[] = [];
      const sourceColumn = other.column(n).values;
      rowmap.forEach(([sourceRow, targetRow]) => {
        values[targetRow] = sourceColumn[sourceRow];
      });
      columns[n] = series(values);
    });

    // Return new dataframe with additional columns
    return this.join(new DataFrame(columns));
  }
}

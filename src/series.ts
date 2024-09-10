/** Series of similar types */
export interface SeriesInterface<T> {
  /** List of all values */
  values: Array<T>;

  /** First value */
  first: T;

  /** First value */
  last: T;

  /** Random value */
  any: T;
}

/** Native types allowed in series. A series can be of only one type. */
export type SeriesTypes = number | string | boolean | object | undefined;

/** Series classes available */
export type SeriesClasses =
  | Series
  | TextSeries
  | BoolSeries
  | ObjectSeries<object>;

/** Abstract series */
abstract class DataSeries<T> implements SeriesInterface<T> {
  // Does series contain numbers
  public readonly isNumber: boolean;

  constructor(public readonly values: Array<T> = []) {
    this.isNumber = false;
  }

  /** Count of elements in series */
  public get length(): number {
    return this.values.length;
  }

  /** First elements in series */
  public get first(): T {
    return this.values[0];
  }

  /** Last elements in series */
  public get last(): T {
    return this.values[this.values.length - 1];
  }

  /** Random elements in series */
  public get any(): T {
    const index: number = Math.floor(this.values.length * Math.random());
    return this.values[index];
  }
}

/** Series of strings */
export class TextSeries
  extends DataSeries<string>
  implements SeriesInterface<string>
{
  constructor(values?: Array<string>) {
    super(values);
  }

  /** Sort alphabetically */
  // public get sort(): TextSeries {
  //   return new TextSeries(this.values.sort(Intl.Collator().compare));
  // }
}

/** Series of booleans */
export class BoolSeries
  extends DataSeries<boolean>
  implements SeriesInterface<boolean>
{
  constructor(values?: Array<boolean>) {
    super(values);
  }
}

/** Series of objects */
export class ObjectSeries<T>
  extends DataSeries<T>
  implements SeriesInterface<T>
{
  constructor(values?: Array<T>) {
    super(values);
  }
}

/** Series of numbers (or undefined values) */
export class Series
  extends DataSeries<number | undefined>
  implements SeriesInterface<number | undefined>
{
  public readonly isNumber: boolean = true;
  constructor(values?: Array<number | undefined>) {
    super(values);
  }

  /** Modify each valid number in series */
  private derive(callback: (n: number) => number): Series {
    return new Series(
      this.values.map((n) => (n !== undefined ? callback(n) : undefined))
    );
  }

  /** Generate new Series: n => n*n */
  public get pow2(): Series {
    return this.derive((n) => n * n);
  }

  /** Convert to absolute numbers */
  public get abs(): Series {
    return this.derive((n) => Math.abs(n));
  }

  /** Multiply each items in this series with item at other series: n[i] = x[i] * y[i] */
  public dot(other: Series): Series {
    const values = [];
    for (let i = 0; i < this.values.length; i++) {
      const [x, y] = [this.values[i], other.values[i]];
      values.push(x !== undefined && y !== undefined ? x * y : undefined);
    }
    return new Series(values);
  }

  /** Calculate sum of numbers in series */
  public get sum(): number {
    return this.values.reduce(
      (sum: number, a) => sum + (a !== undefined ? a : 0),
      0
    );
  }

  /** Calculate Pearson Correlation Coefficient to other series */
  public correlation(other: Series): number {
    const n: number = this.values.length;
    const x: number = this.sum;
    const y: number = other.sum;
    const x2: number = this.pow2.sum;
    const y2: number = other.pow2.sum;
    const xy: number = this.dot(other).sum;
    const r: number =
      (n * xy - x * y) / Math.sqrt((n * x2 - x * x) * (n * y2 - y * y));
    return r;
  }
}

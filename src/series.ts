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
  override readonly isNumber: boolean = true;
  constructor(values?: Array<number | undefined>) {
    super(values);
  }
}

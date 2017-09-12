declare namespace Abstract {
  interface LevelDOWN<
    TKey=any,
    TValue=any,
    TOptions=any,
    TPutOptions=any,
    TGetOptions=any,
    TDeleteOptions=any,
    TIteratorOptions=any,
    TBatchOptions=any> {
    open(callback: any): void;
    open(options: TOptions, callback: any): void;
    close(callback: any): void;
    get(key: TKey, callback: any): void;
    get(key: TKey, options: TGetOptions, callback: any): void;
    put(key: TKey, value: TValue, callback: any): void;
    put(key: TKey, value: TValue, options: TPutOptions, callback: any): void;
    del(key: TKey, callback: any): void;
    del(key: TKey, options: TDeleteOptions, callback: any): void;
    batch(): ChainedBatch<TKey, TValue>
    batch(array: any[], callback: any): any;
    batch(array: any[], options: TBatchOptions, callback: any): any;
    iterator(options?: TIteratorOptions): Iterator
    [index: string]: any;
  }

  interface LevelDOWNConstructor {
    new
      <
      TKey=any,
      TValue=any,
      TOptions=any,
      TPutOptions=any,
      TGetOptions=any,
      TDeleteOptions=any,
      TIteratorOptions=any,
      TBatchOptions=any
      >(location: string): LevelDOWN<
      TKey,
      TValue,
      TOptions,
      TPutOptions,
      TGetOptions,
      TDeleteOptions,
      TIteratorOptions,
      TBatchOptions>;
    <
      TKey=any,
      TValue=any,
      TOptions=any,
      TPutOptions=any,
      TGetOptions=any,
      TDeleteOptions=any,
      TIteratorOptions=any,
      TBatchOptions=any
      >(location: string): LevelDOWN<
      TKey,
      TValue,
      TOptions,
      TPutOptions,
      TGetOptions,
      TDeleteOptions,
      TIteratorOptions,
      TBatchOptions>
  }

  interface Iterator {
    next(callback: any): void;
    end(callback: any): void;
    [index: string]: any;
  }
  interface IteratorConstructor {
    new(db: any): Iterator;
    (db: any): Iterator;
  }

  interface ChainedBatch<TKey=any, TValue=any> {
    put(key: TKey, value: TValue): this;
    del(key: TKey): this;
    clear(): this;
    write(callback: any): any
    write(options: any, callback: any): any
    [index: string]: any;
  }

  interface ChainedBatchConstructor {
    new <TKey, TValue>(db: any): ChainedBatch<TKey, TValue>;
    <TKey, TValue>(db: any): ChainedBatch<TKey, TValue>;
  }

  export const AbstractIterator: IteratorConstructor & Iterator;
  export const AbstractLevelDOWN: LevelDOWNConstructor & LevelDOWN;
  export const AbstractChainedBatch: ChainedBatchConstructor & ChainedBatch;
  export function isLevelDOWN(db: any): boolean;
}

export = Abstract;
// flow-typed signature: 32993181603d76233defc552d278b4f8
// flow-typed version: 688dcd5148/underscore_v1.x.x/flow_>=v0.13.x

// type definitions for (some of) underscore

declare module "underscore" {
  /**
   * Collections
   */
  declare function each<T>(o: {[key:string]: T}, iteratee: (val: T, key: string)=>void): void;
  declare function each<T>(a: T[], iteratee: (val: T, key: string)=>void): void;
  declare function forEach<T>(o: {[key:string]: T}, iteratee: (val: T, key: string)=>void): void;
  declare function forEach<T>(a: T[], iteratee: (val: T, key: string)=>void): void;

  declare function map<T, U>(a: T[], iteratee: (val: T, n: number)=>U): U[];
  declare function map<K, T, U>(a: {[key:K]: T}, iteratee: (val: T, k: K)=>U): U[];
  declare function collect<T, U>(a: T[], iteratee: (val: T, n: number)=>U): U[];
  declare function collect<K, T, U>(a: {[key:K]: T}, iteratee: (val: T, k: K)=>U): U[];

  declare function reduce<T, MemoT>(a: Array<T>, iterator: (m: MemoT, o: T)=>MemoT, initialMemo?: MemoT): MemoT;
  declare function inject<T, MemoT>(a: Array<T>, iterator: (m: MemoT, o: T)=>MemoT, initialMemo?: MemoT): MemoT;
  declare function foldl<T, MemoT>(a: Array<T>, iterator: (m: MemoT, o: T)=>MemoT, initialMemo?: MemoT): MemoT;

  declare function reduceRight<T, MemoT>(a: Array<T>, iterator: (m: MemoT, o: T)=>MemoT, initialMemo?: MemoT): MemoT;
  declare function foldr<T, MemoT>(a: Array<T>, iterator: (m: MemoT, o: T)=>MemoT, initialMemo?: MemoT): MemoT;

  declare function find<T>(list: T[], predicate: (val: T)=>boolean): ?T;
  declare function detect<T>(list: T[], predicate: (val: T)=>boolean): ?T;

  declare function filter<T>(o: {[key:string]: T}, pred: (val: T, k: string)=>boolean): T[];
  declare function filter<T>(a: T[], pred: (val: T, k: string)=>boolean): T[];
  declare function select<T>(o: {[key:string]: T}, pred: (val: T, k: string)=>boolean): T[];
  declare function select<T>(a: T[], pred: (val: T, k: string)=>boolean): T[];

  // TODO: where

  declare function findWhere<T>(list: Array<T>, properties: {[key:string]: any}): ?T;

  declare function reject<T>(o: {[key:string]: T}, pred: (val: T, k: string)=>boolean): T[];
  declare function reject<T>(a: T[], pred: (val: T, k: string)=>boolean): T[];

  declare function every<T>(a: Array<T>, pred: (val: T)=>boolean): boolean;
  declare function all<T>(a: Array<T>, pred: (val: T)=>boolean): boolean;

  declare function some<T>(a: Array<T>, pred: (val: T)=>boolean): boolean;
  declare function any<T>(a: Array<T>, pred: (val: T)=>boolean): boolean;

  declare function contains<T>(list: T[], val: T, fromIndex?: number): boolean;
  declare function includes<T>(list: T[], val: T, fromIndex?: number): boolean;

  // TODO: invoke

  declare function pluck(a: Array<any>, propertyName: string): Array <any>;

  declare function max<T>(a: Array<T>|{[key:any]: T}): T;

  declare function min<T>(a: Array<T>|{[key:any]: T}): T;

  declare function sortBy<T>(a: T[], property: any): T[];
  declare function sortBy<T>(a: T[], iteratee: (val: T)=>any): T[];

  declare function groupBy<T>(a: Array<T>, iteratee: (val: T, index: number)=>any): {[key:string]: T[]};

  // TODO: indexBy

  // TODO: countBy

  // TODO: shuffle

  declare function sample<T>(a: T[]): T;

  // TODO: toArray

  declare function size(o: Object): number;
  declare function size(o: Array<any>): number;

  declare function partition<T>(o: {[key:string]: T}, pred: (val: T, k: string)=>boolean): [T[], T[]];
  declare function partition<T>(o: Array<T>, pred: (val: T)=>boolean): [T[], T[]];

  /**
   * Arrays
   */
  declare function first<T>(a: Array<T>, n: number): Array<T>;
  declare function first<T>(a: Array<T>): T;
  declare function head<T>(a: Array<T>, n: number): Array<T>;
  declare function head<T>(a: Array<T>): T;
  declare function take<T>(a: Array<T>, n: number): Array<T>;
  declare function take<T>(a: Array<T>): T;

  declare function initial<T>(a: Array<T>, n?: number): Array<T>;

  declare function last<T>(a: Array<T>, n: number): Array<T>;
  declare function last<T>(a: Array<T>): T;

  declare function rest<T>(a: Array<T>, index?: number): Array<T>;
  declare function tail<T>(a: Array<T>, index?: number): Array<T>;
  declare function drop<T>(a: Array<T>, index?: number): Array<T>;

  declare function compact<T>(a: Array<?T>): T[];

  declare function flatten<S>(a: S[][]): S[];

  declare function without<T>(a: T[], ...values: T[]): T[];

  // TODO: union

  declare function intersection<T>(...arrays: Array<Array<T>>): Array<T>;

  declare function difference<T>(array: Array<T>, ...others: Array<Array<T>>): Array<T>;

  declare function uniq<T>(a: T[]): T[];
  declare function unique<T>(a: T[]): T[];

  declare function zip<S, T>(a1: S[], a2: T[]): Array<[S, T]>;

  // TODO: unzip

  declare function object<T>(a: Array<[string, T]>): {[key:string]: T};

  declare function indexOf<T>(list: T[], val: T): number;

  // TODO: lastIndexOf

  // TODO: sortedIndex

  declare function findIndex<T>(list: T[], predicate: (val: T)=>boolean): number;

  // TODO: findLastIndex

  declare function range(a: number, b: number): Array<number>;

  /**
   * Functions
   */
  // TODO: bind

  // TODO: bindAll

  // TODO: partial

  // TODO: memoize

  // TODO: delay

  declare function defer(fn: Function, ...arguments: Array<any>): void;

  declare function throttle<T>(fn: T, wait: number, options?: {leading?: boolean, trailing?: boolean}): T;

  declare function debounce<T>(fn: T, wait: number, immediate?: boolean): T;

  // TODO: once

  // TODO: after

  // TODO: before

  // TODO: wrap

  // TODO: negate

  // TODO: compose

  /**
   * Objects
   */
  declare function keys<K, V>(o: {[key: K]: V}): K[];

  // TODO: allKeys

  declare function values<K, V>(o: {[key: K]: V}): V[];

  // TODO: mapObject

  declare function pairs<T>(o: {[key:string]: T}): Array<[string, T]>;

  // TODO: invert

  // TODO: create

  // TODO: functions, methods

  // TODO: findKey

  declare function extend<S, T>(o1: S, o2: T): S & T;

  // TODO: extendOwn, assign

  declare function pick(o: any, ...keys: any): any;
  declare function pick<T>(o: T, fn: (v: any, k: any, o: T) => boolean): any;

  declare function omit(o: any, ...keys: Array < string > ): any;
  declare function omit<T>(o: any, fn: (v: any, k: any, o: T) => boolean): any;

  // TODO: defaults

  declare function clone<T>(obj: T): T;

  // TODO: tap

  declare function has(o: any, k: any): boolean;

  // TODO: matcher, matches
  // TODO: property
  // TODO: propertyOf

  declare function isEqual(a: any, b: any): boolean;

  // TODO: isMatch

  declare function isEmpty(o: any): boolean;

  // TODO: isElement

  declare function isArray(a: any): boolean;

  // TODO: isObject
  // TODO: isArguments
  // TODO: isFunction
  // TODO: isString
  // TODO: isNumber
  // TODO: isFinite
  // TODO: isBoolean
  // TODO: isDate
  // TODO: isRegExp
  // TODO: isError
  // TODO: isNaN
  // TODO: isNull
  // TODO: isUndefined

  /**
   * Utility
   */
  // TODO: noConflict
  // TODO: identity
  // TODO: constant
  // TODO: noop
  // TODO: times
  // TODO: random
  // TODO: mixin
  // TODO: iteratee
  // TODO: uniqueId
  // TODO: escape
  // TODO: unescape
  // TODO: result
  // TODO: now
  // TODO: template

  /**
   * Chaining
   */
  declare function chain<S>(obj: S): any;
  // TODO: value

}


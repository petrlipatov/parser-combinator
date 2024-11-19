import { ParserState, ParserType } from "../constants";

export interface ParserResult {
  state: ParserState;
}
export interface ParserYieldResult extends ParserResult {}
export interface ParserReturnResult extends ParserResult {}

export interface OptionalYieldToken<R = unknown, T = unknown>
  extends ParserYieldResult {
  state: ParserState.YIELD;
  type: string;
  data: T extends (...args: any[]) => infer U ? U : R;
}

export interface DataQueryToken extends ParserYieldResult {
  state: ParserState.EXPECT_NEW_INPUT;
  message: string;
}

export interface SuccessfulReturnToken<R = unknown> extends ParserReturnResult {
  state: ParserState.SUCCESSFUL;
  type: ParserType;
  data: R;
  iter: Iterable<string>;
}

export interface AbortedReturnToken<R = unknown> extends ParserReturnResult {
  state: ParserState.ABORTED;
  type: ParserType;
  message: string;
  pattern?: Iterable<TestPattern> | TestPattern;
  options?: ParserOptions;
  prevParser?: SuccessfulReturnToken;
  prevValue?: R;
  stack?: AbortedReturnToken[];
  iter?: Iterable<string>;
}

//Generator<T = unknown, TReturn = any, TNext = any>

export type Parser<R = unknown, T = unknown> = (
  iterable: Iterable<string>,
  prev?: SuccessfulReturnToken
) => Generator<
  OptionalYieldToken<R, T> | DataQueryToken,
  SuccessfulReturnToken<R> | AbortedReturnToken<R>,
  Iterable<string> | undefined
>;

export interface ParserOptions<R = unknown> {
  token?: string;
  tokenValue?(parsedChars: R);
}

export type TestPattern = string | RegExp | ((char: string) => boolean);

export interface ExtendedIterableIterator<T> extends IterableIterator<T> {
  revert(iterable): void;
  getBuffer: () => T[];
}

export interface BufferedIterator<T> extends ExtendedIterableIterator<T> {
  revert(iterable): void;
  getBuffer: () => T[];
}

export class ParserError extends Error {
  prev: SuccessfulReturnToken | undefined;
  constructor(message: string, prev: SuccessfulReturnToken | undefined) {
    super(message);
    this.prev = prev;
  }
}

import { ParserState, ParserType } from "../constants";

export interface ParserResult {
  state: ParserState;
}
export interface ParserYieldResult extends ParserResult {}
export interface ParserReturnResult extends ParserResult {}

export interface ParserToken<R = unknown, T = unknown>
  extends ParserYieldResult {
  state: ParserState.YIELD;
  type: string;
  data: T extends (...args: any[]) => infer U ? U : R;
}

export interface DataQuery extends ParserYieldResult {
  state: ParserState.EXPECT_NEW_INPUT;
  message: string;
}

export interface SuccessfulResult<R = unknown> extends ParserReturnResult {
  state: ParserState.SUCCESSFUL;
  type: ParserType;
  data: R;
  iter: Iterable<string>;
}

export interface AbortedResult<R = unknown> extends ParserReturnResult {
  state: ParserState.ABORTED;
  type: ParserType;
  message: string;
  pattern?: Iterable<TestPattern> | TestPattern;
  options?: ParserOptions;
  prevParser?: SuccessfulResult;
  prevValue?: R;
  stack?: AbortedResult[];
  iter?: Iterable<string>;
}

export type Parser<R = unknown, T = unknown> = (
  iterable: Iterable<string>,
  prev?: SuccessfulResult
) => Generator<
  ParserToken<R, T> | DataQuery,
  SuccessfulResult<R> | AbortedResult<R>,
  Iterable<string> | undefined
>;

export interface ParserOptions<R = unknown> {
  token?: string;
  tokenValue?(parsedChars: R);
}

export type TestPattern = string | RegExp | ((char: string) => boolean);

export interface ExtendedIterableIterator<T> extends IterableIterator<T> {
  peak(): IteratorResult<T>;
  revert(iterable): void;
}

export interface BufferedIterator<T> extends ExtendedIterableIterator<T> {
  getIter: () => ExtendedIterableIterator<T>;
  getBuffer: () => T[];
}

export class ParserError extends Error {
  prev: SuccessfulResult | undefined;
  constructor(message: string, prev: SuccessfulResult | undefined) {
    super(message);
    this.prev = prev;
  }
}

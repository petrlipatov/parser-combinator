import { ParserMessage, ParserState, ParserType } from "../constants";
import {
  SuccessfulReturnToken,
  AbortedReturnToken,
  OptionalYieldToken,
  DataQueryToken,
  TestPattern,
  ParserOptions,
} from "../types";

export class SuccessfulResult<R = unknown> implements SuccessfulReturnToken {
  state;
  data;
  iter;
  type;

  constructor(type: ParserType, data: R, iter: Iterable<string>) {
    this.state = ParserState.SUCCESSFUL;
    this.type = type;
    this.data = data;
    this.iter = iter;
  }
}

export class AbortedResult<R = unknown> implements AbortedReturnToken {
  state;
  type;
  message;
  pattern;
  options;
  prevParser;
  prevValue;
  stack;
  iter;

  constructor({
    type,
    message,
    pattern,
    options,
    prevParser,
    prevValue,
    stack,
    iter,
  }: {
    type: ParserType;
    message: string;
    pattern?: Iterable<TestPattern> | TestPattern;
    options?: ParserOptions;
    prevParser?: SuccessfulReturnToken;
    prevValue?: R;
    stack?: AbortedReturnToken[];
    iter?: Iterable<string>;
  }) {
    this.state = ParserState.ABORTED;
    this.type = type;
    this.message = message;

    if (pattern !== undefined) this.pattern = pattern;
    if (options !== undefined) this.options = options;
    if (prevParser !== undefined) this.prevParser = prevParser;
    if (prevValue !== "") this.prevValue = prevValue;
    if (stack !== undefined) this.stack = stack;
    if (iter !== undefined) this.iter = iter;
  }
}

export class DataQuery implements DataQueryToken {
  state: ParserState.EXPECT_NEW_INPUT;
  message: ParserMessage.EXPECT_NEW_INPUT;

  constructor() {
    this.state = ParserState.EXPECT_NEW_INPUT;
    this.message = ParserMessage.EXPECT_NEW_INPUT;
  }
}

// export interface AbortedReturnToken<R = unknown> extends ParserReturnResult {

//   stack?: AbortedReturnToken[];
//   iter?: Iterable<string>;
// }

export class OptionalToken<R = unknown> implements OptionalYieldToken {
  state: ParserState.YIELD;
  type: string;
  data;
  constructor(data: R, options: ParserOptions) {
    this.state = ParserState.YIELD;
    this.type = options.token;
    this.data = options.valueMapper?.(data) ?? data;
  }
}

// export const createParserToken = <R>(
//   options: ParserOptions,
//   parsedChars: R
// ): ParserToken<R, typeof options.tokenValue> | null => {
//   if (!options.token) return null;
//   return {
//     state: ParserState.YIELD,
//     type: options.token,
//     data: options.tokenValue?.(parsedChars) ?? parsedChars,
//   };
// };

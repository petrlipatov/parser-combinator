import { ParserMessage, ParserState, ParserType } from "../../shared/constants";
import { createParserToken, intoIter } from "../../helpers";
import {
  AbortedReturnToken,
  Parser,
  ParserOptions,
  OptionalYieldToken,
} from "../../shared/types";
import {
  AbortedResult,
  OptionalToken,
  SuccessfulResult,
} from "../../shared/classes";
import { optionsProvided } from "../../shared/helpers";

export function or<R = SuccessfulResult, T = unknown>(
  ...parsers: Parser[]
): Parser<T, R>;

export function or<R = SuccessfulResult, T = unknown>(
  options: ParserOptions<R>,
  ...parsers: Parser[]
): Parser<R | R[], typeof options.valueMapper>;

export function or(
  firstArg: ParserOptions | Parser,
  ...parsers: Parser[]
): Parser {
  let options: ParserOptions = {};

  if (typeof firstArg === "function") {
    parsers.unshift(firstArg);
  } else {
    options = firstArg;
  }

  return function* (source, prev: SuccessfulResult) {
    let parsedResult: SuccessfulResult;
    let sourceIter = intoIter(source);
    let isSuccessful = false;

    let parserIter;
    let buffer = sourceIter.getBuffer();
    let bufferLengthOnInit = buffer.length;

    const errorsStack: AbortedReturnToken[] = [];
    const bufferedTokens: OptionalYieldToken[] = [];

    outer: for (const parser of parsers) {
      parserIter = parser(sourceIter);

      inner: while (true) {
        let chunk = parserIter.next();
        let { state: parserState } = chunk.value;

        while (parserState === ParserState.EXPECT_NEW_INPUT) {
          const newInput = yield chunk.value;
          chunk = parserIter.next(newInput);
          parserState = chunk.value.state;
        }

        switch (parserState) {
          case ParserState.SUCCESSFUL: {
            const { iter } = chunk.value;
            parsedResult = chunk.value;
            prev = chunk.value;
            isSuccessful = true;
            sourceIter = intoIter(iter);
            break outer;
          }

          case ParserState.YIELD: {
            bufferedTokens.push(chunk.value);
            break;
          }

          case ParserState.ABORTED: {
            errorsStack.push(chunk.value);
            const symbolsToRollback = buffer.length - bufferLengthOnInit;
            if (symbolsToRollback > 0) {
              sourceIter.revert(symbolsToRollback);
            }
            bufferedTokens.splice(0, bufferedTokens.length);
            break inner;
          }
        }
      }
    }

    if (!isSuccessful) {
      return new AbortedResult({
        type: ParserType.OR,
        message: ParserMessage.OR_ERROR,
        stack: errorsStack,
        prevParser: prev,
      });
    }

    yield* bufferedTokens;

    if (optionsProvided(options)) {
      yield new OptionalToken(parsedResult, options);
    }

    return new SuccessfulResult(ParserType.OR, parsedResult, sourceIter);
  };
}

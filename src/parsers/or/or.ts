import { ParserMessage, ParserState, ParserType } from "../../shared/constants";
import {
  createParserToken,
  intoBufIter,
  intoIter,
  isBufferedIter,
} from "../../helpers";
import {
  AbortedReturnToken,
  Parser,
  ParserOptions,
  OptionalYieldToken,
} from "../../shared/types";
import { AbortedResult, SuccessfulResult } from "../../shared/classes";

export function or<R = SuccessfulResult, T = unknown>(
  ...parsers: Parser[]
): Parser<T, R>;

export function or<R = SuccessfulResult, T = unknown>(
  options: ParserOptions<R>,
  ...parsers: Parser[]
): Parser<R | R[], typeof options.tokenValue>;

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
    let output: SuccessfulResult;
    let sourceIter = intoIter(source);
    let isSuccessful = false;

    let parserIter;
    let buffer = [];
    let bufferLengthOnInit = 0;

    if (isBufferedIter(sourceIter)) {
      buffer = sourceIter.getBuffer();
      bufferLengthOnInit = buffer.length;
    }

    const errorsStack: AbortedReturnToken[] = [];
    const bufferedTokens: OptionalYieldToken[] = [];

    outer: for (const parser of parsers) {
      if (isBufferedIter(sourceIter)) {
        parserIter = parser(sourceIter);
      } else {
        parserIter = parser(intoBufIter(sourceIter, buffer), prev);
      }

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
            output = chunk.value;
            prev = chunk.value;
            isSuccessful = true;

            if (isBufferedIter(iter)) {
              sourceIter = iter.getIter();
            } else {
              sourceIter = intoIter(iter);
            }

            break outer;
          }

          case ParserState.YIELD: {
            bufferedTokens.push(chunk.value);
            break;
          }

          case ParserState.ABORTED: {
            errorsStack.push(chunk.value);

            if (isBufferedIter(sourceIter)) {
              sourceIter = sourceIter.getIter();
            }

            const bufferDelta = buffer.length - bufferLengthOnInit;
            if (bufferDelta > 0) {
              const chars = buffer.splice(-bufferDelta);
              sourceIter.revert(chars);
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

    const parserToken = createParserToken(options, output);
    if (parserToken) {
      yield parserToken;
    }

    return new SuccessfulResult(ParserType.OR, output, sourceIter);
  };
}

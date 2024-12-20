import { ParserMessage, ParserState, ParserType } from "../../shared/constants";
import { createParserToken, intoIter } from "../../helpers";
import { Parser, OptionalYieldToken, ParserError } from "../../shared/types";
import { RepeatOptions } from "./utils/types";
import {
  SuccessfulResult,
  AbortedResult,
  OptionalToken,
} from "../../shared/classes";
import { optionsProvided } from "../../shared/helpers";

export function repeat<R = SuccessfulResult, T = unknown>(
  parser: Parser,
  options: RepeatOptions<R[]> = {}
): Parser {
  return function* (source: Iterable<string>, prev: SuccessfulResult) {
    const { min = 1, max = Infinity, invalidSubstring } = options;
    let sourceIter = intoIter(source);
    let count = 0;

    const parsedResult: SuccessfulResult[] = [];
    const bufferedYields: OptionalYieldToken[] = [];

    let parserIter;
    let buffer = sourceIter.getBuffer();
    let bufferLengthOnInit = buffer.length;

    outer: while (true) {
      parserIter = parser(sourceIter);

      inner: while (true) {
        if (count >= max) {
          break outer;
        }

        if (invalidSubstring) {
          let peakedSubstring = "";
          for (let i = 0; i < invalidSubstring.length; i++) {
            const peakedChar = sourceIter.next();
            peakedSubstring += peakedChar.value;
          }

          sourceIter.revert(invalidSubstring.length);
          if (invalidSubstring === peakedSubstring) {
            if (count < min) {
              return new AbortedResult({
                type: ParserType.REPEAT,
                message: invalidSubstring,
              });
            }
            break outer;
          }
        }

        let chunk = parserIter.next();
        let { state: parserState } = chunk.value;

        while (parserState === ParserState.EXPECT_NEW_INPUT) {
          if (count >= min) {
            const charsCountToRevert = buffer.length - bufferLengthOnInit;
            if (charsCountToRevert > 0) {
              sourceIter.revert(charsCountToRevert);
            }
            break outer;
          }
          const newInput = yield chunk.value;
          chunk = parserIter.next(newInput);
          parserState = chunk.value.state;
        }

        switch (parserState) {
          case ParserState.SUCCESSFUL: {
            const { iter } = chunk.value;
            parsedResult.push(chunk.value);
            prev = chunk.value;
            count++;
            sourceIter = intoIter(iter);
            bufferLengthOnInit = buffer.length;

            if (count >= min) {
              yield* bufferedYields.splice(0, bufferedYields.length);
            }
            break inner;
          }

          case ParserState.YIELD: {
            bufferedYields.push(chunk.value);
            break;
          }

          case ParserState.ABORTED: {
            const symbolsToRollback = buffer.length - bufferLengthOnInit;
            if (symbolsToRollback > 0) {
              sourceIter.revert(symbolsToRollback);
            }

            if (count < min) {
              return new AbortedResult({
                type: ParserType.REPEAT,
                message: ParserMessage.REPEAT_ERROR,
                prevParser: prev,
                prevValue: parsedResult,
                options,
              });
            }
            break outer;
          }
        }
      }
    }

    if (optionsProvided(options) && count > 0) {
      yield new OptionalToken(parsedResult, options);
    }

    return new SuccessfulResult(ParserType.REPEAT, parsedResult, sourceIter);
  };
}

import { ParserState, ParserType } from "../../shared/constants";
import {
  createParserToken,
  createSeqErrorMessage,
  intoIter,
} from "../../helpers";
import {
  Parser,
  ParserOptions,
  SuccessfulReturnToken,
} from "../../shared/types";
import {
  AbortedResult,
  OptionalToken,
  SuccessfulResult,
} from "../../shared/classes";

export function seq<R = SuccessfulReturnToken>(
  ...parsers: Parser[]
): Parser<R[], never>;

export function seq<R = SuccessfulReturnToken>(
  options: ParserOptions<R[]>,
  ...parsers: Parser[]
): Parser<R[], (typeof options.tokenValue)[]>;

export function seq(
  firstArg: Parser | ParserOptions,
  ...parsers: Parser[]
): Parser {
  let options: ParserOptions = {};

  if (typeof firstArg === "function") {
    parsers.unshift(firstArg);
  } else {
    options = firstArg;
  }

  return function* (source, prev: SuccessfulReturnToken) {
    let parsedValues: SuccessfulReturnToken[] = [];
    let sourceIter = intoIter(source);
    let parserIter;

    for (const parser of parsers) {
      parserIter = parser(sourceIter);

      loop: while (true) {
        const chunk = parserIter.next();
        const { state: parserState } = chunk.value;
        switch (parserState) {
          case ParserState.SUCCESSFUL: {
            const { iter } = chunk.value;
            parsedValues.push(chunk.value);
            sourceIter = intoIter(iter);
            prev = chunk.value;
            break loop;
          }

          case ParserState.YIELD: {
            yield chunk.value;
            break;
          }

          case ParserState.EXPECT_NEW_INPUT: {
            const newInput = yield chunk.value;
            parserIter.next(newInput);
            break;
          }

          case ParserState.ABORTED: {
            const message = createSeqErrorMessage(
              chunk.value.type,
              chunk.value.message
            );

            return new AbortedResult({
              type: ParserType.SEQ,
              message,
              options,
              prevParser: prev,
            });
          }
        }
      }
    }

    if ("token" in options) {
      yield new OptionalToken(parsedValues, options);
    }

    return new SuccessfulResult(ParserType.SEQ, parsedValues, sourceIter);
  };
}

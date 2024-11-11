import { ParserState, ParserType } from "../../constants";
import {
  createAbortedResult,
  createParserToken,
  createSeqErrorMessage,
  createSuccesfullResult,
  intoBufIter,
  intoIter,
  isBufferedIter,
} from "../../helpers";
import { Parser, ParserOptions, SuccessfulResult } from "../../types";

export function seq<R = SuccessfulResult>(
  ...parsers: Parser[]
): Parser<R[], never>;

export function seq<R = SuccessfulResult>(
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

  return function* (source, prev: SuccessfulResult) {
    let combinedParsedData: SuccessfulResult[] = [];
    let sourceIter = intoIter(source);

    let buffer = [];
    if (isBufferedIter(sourceIter)) {
      buffer = sourceIter.getBuffer();
    }

    for (const parser of parsers) {
      let parserIter;
      if (isBufferedIter(sourceIter)) {
        parserIter = parser(sourceIter);
      } else {
        parserIter = parser(intoBufIter(sourceIter, buffer), prev);
      }

      loop: while (true) {
        const chunk = parserIter.next();
        const { state: parserState } = chunk.value;
        switch (parserState) {
          case ParserState.SUCCESSFUL: {
            const { iter } = chunk.value;
            combinedParsedData.push(chunk.value);
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

            return createAbortedResult({
              type: ParserType.SEQ,
              message,
              options,
              prevParser: prev,
            });
          }
        }
      }
    }

    const parserToken = createParserToken(options, combinedParsedData);
    if (parserToken) {
      yield parserToken;
    }

    return createSuccesfullResult(
      ParserType.SEQ,
      combinedParsedData,
      sourceIter
    );
  };
}

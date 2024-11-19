import {
  Parser,
  ParserOptions,
  TestPattern,
  SuccessfulReturnToken,
} from "../../shared/types";

import { createParserToken, intoIter, testChar } from "../../helpers";
import { ParserType } from "../../shared/constants";
import {
  AbortedResult,
  DataQuery,
  OptionalToken,
  SuccessfulResult,
} from "../../shared/classes";

export function tag<R = string>(
  pattern: Iterable<TestPattern>,
  options: ParserOptions<R> = {}
): Parser<string, typeof options.tokenValue> {
  return function* (source: Iterable<string>, prev: SuccessfulReturnToken) {
    let sourceIter = intoIter(source);
    let parsedChars = "";

    for (const patternSymbol of pattern) {
      let chunk = sourceIter.next();
      let char = chunk.value;

      if (chunk.done) {
        source = yield new DataQuery();
        sourceIter = intoIter(source);
        chunk = sourceIter.next();
        char = chunk.value;
      }

      try {
        testChar(patternSymbol, char, prev);
      } catch (err) {
        const { message } = err;
        return new AbortedResult({
          type: ParserType.TAG,
          message,
          options,
          prevParser: prev,
          prevValue: parsedChars,
          pattern,
        });
      }
      parsedChars += char;
    }

    if ("token" in options) {
      yield new OptionalToken(parsedChars, options);
    }

    return new SuccessfulResult(ParserType.TAG, parsedChars, sourceIter);
  };
}

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
import { optionsProvided } from "../../shared/helpers";

export function tag<R = string>(
  pattern: Iterable<TestPattern>,
  options: ParserOptions<R> = {}
): Parser<string, typeof options.valueMapper> {
  return function* (source: Iterable<string>, prev: SuccessfulReturnToken) {
    let sourceIter = intoIter(source);
    let parsedResult = "";

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
          prevValue: parsedResult,
          pattern,
        });
      }
      parsedResult += char;
    }

    if (optionsProvided(options)) {
      yield new OptionalToken(parsedResult, options);
    }

    return new SuccessfulResult(ParserType.TAG, parsedResult, sourceIter);
  };
}

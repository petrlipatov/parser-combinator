import {
  Parser,
  ParserOptions,
  SuccessfulResult,
  TestPattern,
} from "../../types";

import {
  createAbortedResult,
  createExpectResult,
  createParserToken,
  createSuccesfullResult,
  intoIter,
  testChar,
} from "../../helpers";
import { ParserType } from "../../constants";

export function tag<R = string>(
  pattern: Iterable<TestPattern>,
  options: ParserOptions<R> = {}
): Parser<string, typeof options.tokenValue> {
  return function* (source: Iterable<string>, prev: SuccessfulResult) {
    let sourceIter = intoIter(source);
    let parsedChars = "";

    for (const patternSymbol of pattern) {
      let chunk = sourceIter.next();
      let char = chunk.value;

      if (chunk.done) {
        source = yield createExpectResult();
        sourceIter = intoIter(source);
        chunk = sourceIter.next();
        char = chunk.value;
      }

      try {
        testChar(patternSymbol, char, prev);
      } catch (err) {
        const { message } = err;
        return createAbortedResult({
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

    const parserToken = createParserToken(options, parsedChars);
    if (parserToken) {
      yield parserToken;
    }

    return createSuccesfullResult(ParserType.TAG, parsedChars, sourceIter);
  };
}

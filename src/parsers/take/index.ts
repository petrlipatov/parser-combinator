import { ParserType } from "../../constants";
import {
  createAbortedResult,
  createExpectResult,
  createParserToken,
  createSuccesfullResult,
  intoIter,
  iterSeq,
  testChar,
} from "../../helpers";
import { Parser, SuccessfulResult, TestPattern } from "../../types";
import { TakeOptions } from "./types";

export function take(
  pattern: TestPattern,
  options: TakeOptions = {}
): Parser<string, typeof options.tokenValue> {
  return function* (source, prev: SuccessfulResult) {
    const { min = 1, max = Infinity } = options;

    let sourceIter = intoIter(source);
    let parsedChars = "";
    let count = 0;

    const buffer: string[] = [];

    while (true) {
      if (count >= max) {
        break;
      }
      let chunk = sourceIter.next();
      let char = chunk.value;

      if (chunk.done) {
        if (count >= min) {
          break;
        }
        source = yield createExpectResult();
        sourceIter = intoIter(source);
        chunk = sourceIter.next();
        char = chunk.value;
      }

      try {
        if (testChar(pattern, char, prev)) {
          count++;
        }
      } catch (err) {
        if (count < min) {
          const { message } = err;
          return createAbortedResult({
            type: ParserType.TAKE,
            message,
            options,
            pattern,
            prevParser: prev,
            prevValue: parsedChars,
          });
        }

        buffer.push(char);
        break;
      }
      parsedChars += char;
    }

    const parserToken = createParserToken(options, parsedChars);
    if (parserToken && count > 0) {
      yield parserToken;
    }

    return createSuccesfullResult(
      ParserType.TAKE,
      parsedChars,
      buffer.length > 0 ? iterSeq(buffer, sourceIter) : sourceIter
    );
  };
}

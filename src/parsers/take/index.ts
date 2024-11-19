import { ParserType } from "../../shared/constants";
import { createParserToken, intoIter, iterSeq, testChar } from "../../helpers";
import { Parser, TestPattern, SuccessfulReturnToken } from "../../shared/types";
import { TakeOptions } from "./types";
import {
  AbortedResult,
  DataQuery,
  SuccessfulResult,
} from "../../shared/classes";

export function take(
  pattern: TestPattern,
  options: TakeOptions = {}
): Parser<string, typeof options.tokenValue> {
  return function* (source, prev: SuccessfulReturnToken) {
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
        source = yield new DataQuery();
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
          return new AbortedResult({
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

    return new SuccessfulResult(
      ParserType.TAKE,
      parsedChars,
      buffer.length > 0 ? iterSeq(buffer, sourceIter) : sourceIter
    );
  };
}

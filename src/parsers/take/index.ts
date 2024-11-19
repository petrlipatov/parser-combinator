import { ParserType } from "../../shared/constants";
import { createParserToken, intoIter, testChar } from "../../helpers";
import { Parser, TestPattern, SuccessfulReturnToken } from "../../shared/types";
import { TakeOptions } from "./types";
import {
  AbortedResult,
  DataQuery,
  OptionalToken,
  SuccessfulResult,
} from "../../shared/classes";
import { optionsProvided } from "../../shared/helpers";

export function take(
  pattern: TestPattern,
  options: TakeOptions = {}
): Parser<string, typeof options.valueMapper> {
  return function* (source, prev: SuccessfulReturnToken) {
    const { min = 1, max = Infinity } = options;

    let sourceIter = intoIter(source);
    let parsedResult = "";
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
            prevValue: parsedResult,
          });
        }

        buffer.push(char);
        break;
      }
      parsedResult += char;
    }

    if (optionsProvided(options) && count > 0) {
      yield new OptionalToken(parsedResult, options);
    }

    return new SuccessfulResult(
      ParserType.TAKE,
      parsedResult,
      []
      // buffer.length > 0 ? iterSeq(buffer, sourceIter) : sourceIter
    );
  };
}

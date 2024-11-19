import { ParserState, ParserType } from "../../shared/constants";
import { createParserToken, intoIter } from "../../helpers";
import { Parser, OptionalYieldToken } from "../../shared/types";
import { RepeatOptions } from "./utils/types";
import { SuccessfulResult, AbortedResult } from "../../shared/classes";

export function repeat<R = SuccessfulResult, T = unknown>(
  parser: Parser,
  options: RepeatOptions<R[]> = {}
): Parser {
  return function* (source: Iterable<string>, prev: SuccessfulResult) {
    const { min = 1, max = Infinity, invalidPairs } = options;
    let sourceIter = intoIter(source);
    let count = 0;

    const parsersResults: SuccessfulResult[] = [];
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

        let chunk = parserIter.next();
        let { state: parserState } = chunk.value;

        // if (invalidPairs && "data" in chunk.value) {
        //   const { data: currChunkChar } = chunk.value;
        //   const { value: nextChunkChar } = sourceIter.peak();

        //   for (const pair of invalidPairs) {
        //     if (isPairInvalid(currChunkChar, nextChunkChar, pair)) {
        //       if (count < min) {
        //         return createAbortedResult({
        //           type: ParserType.REPEAT,
        //           prevParser: prev,
        //           message: `Invalid pair "${currChunkChar}${nextChunkChar}"`,
        //           options,
        //         });
        //       }

        //       sourceIter =
        //         buffer.length > 0 ? iterSeq(buffer, sourceIter) : sourceIter;
        //       break outer;
        //     }
        //   }
        // }

        while (parserState === ParserState.EXPECT_NEW_INPUT) {
          if (count >= min) {
            const delta = buffer.length - bufferLengthOnInit;

            if (delta > 0) {
              const spliced = buffer.splice(-delta);
              sourceIter.revert(spliced);
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

            parsersResults.push(chunk.value);
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
            if (count < min) {
              const delta = buffer.length - bufferLengthOnInit;

              if (delta > 0) {
                sourceIter.revert(delta);
              }
              return new AbortedResult({
                type: ParserType.REPEAT,
                message: "repeat error",
                prevParser: prev,
                options,
              });
            }

            const delta = buffer.length - bufferLengthOnInit;

            if (delta > 0) {
              sourceIter.revert(delta);
            }

            break outer;
          }
        }
      }
    }

    const parserToken = createParserToken(options, parsersResults);

    if (parserToken && count > 0) {
      yield parserToken;
    }

    return new SuccessfulResult(ParserType.REPEAT, parsersResults, sourceIter);
  };
}

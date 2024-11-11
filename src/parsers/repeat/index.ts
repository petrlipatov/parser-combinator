import { ParserState, ParserType } from "../../constants";
import {
  createAbortedResult,
  createParserToken,
  createSuccesfullResult,
  intoBufIter,
  intoIter,
  isBufferedIter,
  iterSeq,
} from "../../helpers";
import { Parser, ParserToken, SuccessfulResult } from "../../types";
import { RepeatOptions } from "./types";

export function repeat<R = SuccessfulResult, T = unknown>(
  parser: Parser,
  options: RepeatOptions<R[]> = {}
): Parser {
  return function* (source: Iterable<string>, prev: SuccessfulResult) {
    const { min = 1, max = Infinity, invalidPairs } = options;
    let sourceIter = intoIter(source);

    let count = 0;

    const parsersResults: SuccessfulResult[] = [];
    const bufferedYields: ParserToken[] = [];

    let parserIter;
    let buffer = [];
    let bufferLengthOnInit = 0;
    let ownBuffer = true;

    if (isBufferedIter(sourceIter)) {
      buffer = sourceIter.getBuffer();
      bufferLengthOnInit = buffer.length;
      ownBuffer = false;
    }

    outer: while (true) {
      if (isBufferedIter(sourceIter)) {
        parserIter = parser(sourceIter);
      } else {
        parserIter = parser(intoBufIter(sourceIter, buffer), prev);
      }

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
            if (ownBuffer && delta > 0) {
              const spliced = buffer.splice(-delta);
              sourceIter = iterSeq(spliced, sourceIter);
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
              if (isBufferedIter(sourceIter)) {
                sourceIter = sourceIter.getIter();
              }

              const delta = buffer.length - bufferLengthOnInit;

              if (delta > 0) {
                const spliced = buffer.splice(-delta);
                sourceIter.revert(spliced);
              }

              return createAbortedResult({
                type: ParserType.REPEAT,
                prevParser: prev,
                message: "repeat error",
                options,
              });
            }

            if (isBufferedIter(sourceIter)) {
              sourceIter = sourceIter.getIter();
            }

            const delta = buffer.length - bufferLengthOnInit;

            if (delta > 0) {
              const spliced = buffer.splice(-delta);
              sourceIter.revert(spliced);
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

    return createSuccesfullResult(
      ParserType.REPEAT,
      parsersResults,
      sourceIter
    );
  };
}

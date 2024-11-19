import { SuccessfulResult } from "../shared/classes";
import { ParserType } from "../shared/constants";
import { ParserMessage, ParserState } from "../shared/constants";
import {
  AbortedReturnToken,
  BufferedIterator,
  DataQueryToken,
  ExtendedIterableIterator,
  ParserError,
  ParserOptions,
  OptionalYieldToken,
  TestPattern,
} from "../shared/types";

export let callCount2 = 0;

export function intoIter<T>(
  iterable: Iterable<T>
): ExtendedIterableIterator<T> {
  if ("revert" in iterable[Symbol.iterator]()) {
    callCount2++;

    return iterable[Symbol.iterator]() as ExtendedIterableIterator<T>;
  }

  const stack = [];
  const buffer = [];

  let currIter = iterable[Symbol.iterator]();

  return {
    [Symbol.iterator]() {
      return this;
    },

    next() {
      let chunk = currIter.next();

      while (chunk.done) {
        if (stack.length === 0) {
          return chunk;
        }
        currIter = stack.pop();
        chunk = currIter.next();
      }

      if (!chunk.done) {
        buffer.push(chunk.value);
      }

      return chunk;
    },

    getBuffer() {
      return buffer;
    },

    revert(revertedValueCount) {
      stack.push(currIter);
      const spliced = buffer.splice(buffer.length - revertedValueCount);

      currIter = spliced[Symbol.iterator]();
    },
  };
}

// export function intoIter<T>(
//   iterable: Iterable<T>
// ): ExtendedIterableIterator<T> {
//   let iter = iterable[Symbol.iterator]();

//   if ("peak" in iter) {
//     return iter as ExtendedIterableIterator<T>;
//   }

//   let nextValue: IteratorResult<T> | null = null;

//   return {
//     [Symbol.iterator]() {
//       return this;
//     },

//     next() {
//       if (nextValue !== null) {
//         const result = nextValue;
//         nextValue = null;
//         return result;
//       }

//       const chunk = iter.next();
//       callCount1 += 1;
//       // console.log("intoIter", callCount);
//       // console.log(chunk);
//       return chunk;
//     },

//     revert(iterable: Iterable<T>) {
//       const old = iter as ExtendedIterableIterator<T>;
//       iter = iterSeq(iterable, old);
//     },

//     peak() {
//       if (nextValue === null) {
//         nextValue = iter.next();
//       }
//       return nextValue;
//     },
//   };
// }

// export function intoBufIter<T>(
//   iterable: Iterable<T>,
//   buffer: T[]
// ): BufferedIterator<T> {
//   const iter = intoIter(iterable);

//   return {
//     [Symbol.iterator]() {
//       return this;
//     },

//     next() {
//       const chunk = iter.next();
//       callCount2 += 1;
//       // console.log(chunk);
//       if (!chunk.done) {
//         buffer.push(chunk.value);
//       }

//       return chunk;
//     },

//     revert(iterable) {
//       iter.revert(iterable);
//     },

//     getIter() {
//       return iter;
//     },

//     getBuffer() {
//       return buffer;
//     },

//     peak() {
//       return iter.peak();
//     },
//   };
// }

// export function iterSeq<T>(
//   ...iterable: Iterable<T>[]
// ): ExtendedIterableIterator<T> {
//   let cursor = 0;
//   let iter = intoIter(iterable[cursor]);

//   return {
//     [Symbol.iterator]() {
//       return this;
//     },

//     revert(iterable) {
//       iter.revert(iterable);
//     },

//     next() {
//       let chunk = iter.next();
//       callCount3 += 1;
//       while (chunk.done) {
//         cursor++;

//         if (iterable[cursor] == null) {
//           return chunk;
//         }

//         iter = intoIter(iterable[cursor]);
//         chunk = iter.next();
//       }

//       return chunk;
//     },
//     peak() {
//       return iter.peak();
//     },
//   };
// }

export function testChar(
  test: TestPattern,
  char: string,
  prev: SuccessfulResult | undefined
) {
  switch (typeof test) {
    case "string":
      if (test != char) {
        throw new ParserError(
          `Parser's comparator expected "${test}", but received "${char}"`,
          prev
        );
      }
      break;

    case "function":
      if (!test(char)) {
        throw new ParserError(
          `Parser's comparator expected "${test}", but received "${char}"`,
          prev
        );
      }
      break;

    default:
      if (!test.test(char)) {
        throw new ParserError(
          `Parser's comparator expected "${test}", but received "${char}"`,
          prev
        );
      }
  }
  return true;
}

export const createExpectResult = (): DataQueryToken => ({
  state: ParserState.EXPECT_NEW_INPUT,
  message: ParserMessage.EXPECT_NEW_INPUT,
});

interface AbortedResultOptions<R> {
  type: ParserType;
  message: string;
  options?: ParserOptions;
  prevParser?: SuccessfulResult;
  prevValue?: R;
  pattern?: Iterable<TestPattern> | TestPattern;
  stack?: AbortedReturnToken<R>[];
}

export const createAbortedResult = <T, R>({
  type,
  message,
  options,
  prevParser,
  prevValue,
  pattern,
  stack,
}: AbortedResultOptions<R>): AbortedReturnToken<R> => ({
  state: ParserState.ABORTED,
  type,
  message,
  ...(pattern && { pattern }),
  ...(prevParser && { prevParser }),
  ...(options && { options }),
  ...(prevValue && { prevValue }),
  ...(stack && { stack }),
});

export const createSuccesfullResult = <R>(
  type: ParserType,
  data: R,
  iter: Iterable<string>
): SuccessfulResult<R> => {
  return {
    state: ParserState.SUCCESSFUL,
    type,
    data,
    iter,
  };
};

export const createParserToken = <R>(
  options: ParserOptions,
  parsedChars: R
): OptionalYieldToken<R, typeof options.tokenValue> | null => {
  if (!options.token) return null;
  return {
    state: ParserState.YIELD,
    type: options.token,
    data: options.tokenValue?.(parsedChars) ?? parsedChars,
  };
};

export function createSeqErrorMessage(
  type: string,
  message: string | string[]
) {
  return `Execution of the "${type}" parser failed: ${message}`;
}

export function isBufferedIter<T = string>(
  source: Iterable<T>
): source is BufferedIterator<T> {
  if (!source) {
    return;
  }

  return (
    typeof source === "object" &&
    "getIter" in source &&
    "getBuffer" in source &&
    typeof source.getIter === "function" &&
    typeof source.getBuffer === "function"
  );
}

import { or } from "./or";
import { tag } from "../tag";
import { seq } from "../seq";
import { repeat } from "../repeat";

describe("or Parser:", () => {
  it("should return successfull result for second single char TAG parser", () => {
    const parser = or(tag("a"), tag("b"));
    const parserIter = parser("b");
    const parsingResult = parserIter.next();

    expect(parsingResult).toEqual({
      value: {
        state: 0,
        type: "OR",
        data: {
          state: 0,
          type: "TAG",
          data: "b",
          iter: expect.any(Object),
        },

        iter: expect.any(Object),
      },
      done: true,
    });
  });

  it("should return successfull result for third three chars TAG parser", () => {
    const parser = or(tag("abc"), tag("bcd"), tag("cde"));
    const parserIter = parser("cde");
    const parsingResult = parserIter.next();

    expect(parsingResult).toEqual({
      value: {
        state: 0,
        type: "OR",
        data: {
          state: 0,
          type: "TAG",
          data: "cde",
          iter: expect.any(Object),
        },

        iter: expect.any(Object),
      },
      done: true,
    });
  });

  it("should return successfull result for second sequence", () => {
    const parser = or(
      seq(tag("<"), tag("div"), tag(">")),
      seq(tag("<"), repeat(tag([/[a-z]/])), tag(">"))
    );
    const parserIter = parser("<span>");
    const result = parserIter.next();

    expect(result).toEqual({
      value: {
        state: 0,
        type: "OR",
        data: {
          state: 0,
          type: "SEQ",
          data: [
            {
              state: 0,
              type: "TAG",
              data: "<",
              iter: expect.any(Object),
            },
            {
              state: 0,
              type: "REPEAT",
              data: [
                {
                  state: 0,
                  type: "TAG",
                  data: "s",
                  iter: expect.any(Object),
                },
                {
                  state: 0,
                  type: "TAG",
                  data: "p",
                  iter: expect.any(Object),
                },
                {
                  state: 0,
                  type: "TAG",
                  data: "a",
                  iter: expect.any(Object),
                },
                {
                  state: 0,
                  type: "TAG",
                  data: "n",
                  iter: expect.any(Object),
                },
              ],
              iter: expect.any(Object),
            },
            {
              state: 0,
              type: "TAG",
              data: ">",
              iter: expect.any(Object),
            },
          ],
          iter: expect.any(Object),
        },

        iter: expect.any(Object),
      },
      done: true,
    });
  });
});

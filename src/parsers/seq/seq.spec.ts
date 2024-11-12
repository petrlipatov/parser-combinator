import { seq } from "./seq";
import { tag } from "../tag";

describe("seq Parser:", () => {
  it("should return successfull result when parsing a correct flat sequence", () => {
    const parser = seq(tag("<"), tag("div"), tag(">"));
    const parserIter = parser("<div>");
    const result = parserIter.next();

    expect(result).toEqual({
      value: {
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
            type: "TAG",
            data: "div",
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
      done: true,
    });
  });

  it("should return exception result when parsing an incorrect flat sequence", () => {
    const parser = seq(tag("<"), tag("div"), tag(">"));
    const parserIter = parser("<span>");
    const result = parserIter.next();

    expect(result).toEqual({
      value: {
        state: 1,
        type: "SEQ",
        message: `Execution of the "TAG" parser failed: Parser's comparator expected "d", but received "s"`,
        prevParser: {
          state: 0,
          type: "TAG",
          data: "<",
          iter: expect.any(Object),
        },
        options: {},
      },
      done: true,
    });
  });

  it("should return successfull parser token when parsing a correct flat sequence", () => {
    const parser = seq(
      {
        token: "DIV_TOKEN",
        tokenValue: (output) => output.reduce((acc, el) => acc + el.data, ""),
      },
      tag("<"),
      tag("div"),
      tag(">")
    );
    const parserIter = parser("<div>");
    const result = [...parserIter];

    expect(result[0]).toEqual({
      state: 3,
      type: "DIV_TOKEN",
      data: "<div>",
    });
  });
});

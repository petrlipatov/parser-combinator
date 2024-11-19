import { tag } from "./tag";

describe("tag Parser:", () => {
  it("should return successfull result when parsing a correct single char", () => {
    const aParser = tag("a");
    const aParserIter = aParser("a");
    const parserResult = aParserIter.next();
    expect(parserResult).toEqual({
      value: {
        state: 0,
        type: "TAG",
        data: "a",
        iter: expect.any(Object),
      },
      done: true,
    });
  });

  it("should return successfull result when parsing multiple correct chars", () => {
    const aParser = tag("abc");
    const aParserIter = aParser("abc");
    const parserResult = aParserIter.next();
    expect(parserResult).toEqual({
      value: {
        state: 0,
        type: "TAG",
        data: "abc",
        iter: expect.any(Object),
      },
      done: true,
    });
  });

  it("should return exception result when parsing an incorrect single char", () => {
    const aParser = tag("a");
    const aParserIter = aParser("b");
    const parserResult = aParserIter.next();

    expect(parserResult).toEqual({
      value: {
        state: 1,
        type: "TAG",
        message: `Parser's comparator expected "a", but received "b"`,
        pattern: "a",
        options: {},
      },
      done: true,
    });
  });

  it("should return correct parser token when parsing a correct single char", () => {
    const aParser = tag("a", { token: "TEST_TOKEN_NAME" });
    const aParserIter = aParser("a");
    const parserResult = [...aParserIter];

    expect(parserResult[0]).toEqual({
      state: 3,
      type: "TEST_TOKEN_NAME",
      data: "a",
    });
  });
});

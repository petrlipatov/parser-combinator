import { optional } from "./optional";
import { tag } from "../tag";
import { seq } from "../seq";
import { repeat } from "../repeat";

describe("optional Parser:", () => {
  it("should return empty successfull result when a TAG parser ended with an exception", () => {
    const parser = optional(tag("a"));
    const parserIter = parser("b");
    const res = parserIter.next();

    expect(res).toEqual({
      value: {
        state: 0,
        type: "REPEAT",
        data: [],
        iter: expect.any(Object),
      },
      done: true,
    });
  });

  it("should return successfull result when a TAG parser succeded", () => {
    const parser = optional(tag("a"));
    const parserIter = parser("a");
    const res = parserIter.next();

    expect(res).toEqual({
      value: {
        state: 0,
        type: "REPEAT",
        data: [{ state: 0, type: "TAG", data: "a", iter: expect.any(Object) }],
        iter: expect.any(Object),
      },
      done: true,
    });
  });

  it("should return correct token when a TAG parser succeded", () => {
    const parser = optional(tag("a"), { token: "TOKEN_TYPE" });
    const parserIter = parser("a");
    const res = [...parserIter];

    expect(res[0]).toEqual({
      state: 3,
      type: "TOKEN_TYPE",
      data: [{ state: 0, type: "TAG", data: "a", iter: expect.any(Object) }],
    });
  });
});

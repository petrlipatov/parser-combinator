import { repeat } from "./repeat";
import { tag } from "../tag";
import { or } from "../or";
import { seq } from "../seq";

describe("repeat Parser:", () => {
  it("should parse string completely and return a successful result", () => {
    const parser = repeat(tag("a"));
    const parserIter = parser("aaaa");
    const parsingResult = parserIter.next();

    expect(parsingResult).toEqual({
      value: {
        state: 0,
        type: "REPEAT",
        data: [
          {
            state: 0,
            type: "TAG",
            data: "a",
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
            data: "a",
            iter: expect.any(Object),
          },
          {
            state: 0,
            type: "TAG",
            data: "a",
            iter: expect.any(Object),
          },
        ],
        iter: expect.any(Object),
      },
      done: true,
    });
  });

  it("should parse string up to first invalid char and return successful result", () => {
    const parser = repeat(tag("a"));
    const parserIter = parser("aac");
    const parsingResult = parserIter.next();

    expect(parsingResult).toEqual({
      value: {
        state: 0,
        type: "REPEAT",
        data: [
          {
            state: 0,
            type: "TAG",
            data: "a",
            iter: expect.any(Object),
          },

          {
            state: 0,
            type: "TAG",
            data: "a",
            iter: expect.any(Object),
          },
        ],
        iter: expect.any(Object),
      },
      done: true,
    });
  });

  it("should return correct result when parsing overlapping sequences", () => {
    const parser = repeat(
      or(
        seq(tag("<"), tag("div"), tag(">")),
        seq(tag("<"), tag("span"), tag(">")),
        seq(tag("<"), tag("h1"), tag(">"))
      )
    );

    const parserIter = parser("<h1><div><span>");
    const result = parserIter.next();

    expect(result).toEqual({
      value: {
        state: 0,
        type: "REPEAT",
        data: [
          {
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
                  type: "TAG",
                  data: "h1",
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
          {
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
            iter: expect.any(Object),
          },
          {
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
                  type: "TAG",
                  data: "span",
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
        ],
        iter: expect.any(Object),
      },
      done: true,
    });
  });

  it("should return correct result when parsing deep overlapping sequences", () => {
    const parser = repeat(
      or(
        // /[a-ce-rt-z0-9]/ - any char or digit except 'd' and 's'
        // /[a-ce-gi-z]/ - any char except 'd' and 'h'
        // /[a-gi-rt-z]/ - any char or digit except 'h' and 's'
        seq(tag("<"), repeat(tag([/[a-ce-rt-z0-9]/])), tag(">")),
        seq(tag("<"), repeat(tag([/[a-ce-gi-z]/])), tag(">")),
        seq(tag("<"), repeat(tag([/[a-gi-rt-z]/])), tag(">"))
      )
    );

    const parserIter = parser("<h1><div><span>");
    const result = parserIter.next();

    expect(result).toEqual({
      value: {
        state: 0,
        type: "REPEAT",
        data: [
          {
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
                      data: "h",
                      iter: expect.any(Object),
                    },
                    {
                      state: 0,
                      type: "TAG",
                      data: "1",
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
          {
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
                      data: "d",
                      iter: expect.any(Object),
                    },
                    {
                      state: 0,
                      type: "TAG",
                      data: "i",
                      iter: expect.any(Object),
                    },
                    {
                      state: 0,
                      type: "TAG",
                      data: "v",
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
          {
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
        ],
        iter: expect.any(Object),
      },
      done: true,
    });
  });

  it("should return correct parser token with custom mapped value", () => {
    const parser = repeat(tag([/[a-z]/]), {
      token: "TOKEN",
      valueMapper: (output) => output.reduce((acc, el) => acc + el.data, ""),
    });

    const parserIter = parser("name");
    const parsingResult = [...parserIter];

    expect(parsingResult[0]).toEqual({
      state: 3,
      type: "TOKEN",
      data: "name",
    });
  });
});

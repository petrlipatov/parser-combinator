# Parser Combinator

This project provides a powerful and flexible parser combinator implementation in TypeScript. The library allows you to define parsers using composable functions, handle various parsing strategies, and manage parsing states efficiently.

---

## Features

- **Composable Parsers**: Build complex parsers by combining smaller ones.
- **Parsing States**: Handles success, failure, and intermediate states (`SUCCESSFUL`, `ABORTED`, `YIELD`, `EXPECT_NEW_INPUT`).
- **Built-in Parser Types**:
  - `TAG`: Matches a specific pattern or sequence of characters.
  - `SEQ`: Combines multiple parsers to process sequentially.
  - `OR`: Tries multiple parsers and returns the result of the first successful one.
  - `REPEAT`: Repeats a parser multiple times.
- **Extensibility**: Create custom parsers tailored to your needs.

## States

Each parser returns a state context representing the outcome of its operation. The state context is defined by the ParserState enum, which includes the following values:

```typescript
enum ParserState {
  SUCCESSFUL, // 0: Indicates the parser successfully processed the input.
  ABORTED, // 1: Indicates the parser aborted due to an error or invalid input.
  EXPECT_NEW_INPUT, // 2: The parser expects new input to continue its operation.
  YIELD, // 3: The parser has yielded an OptionalToken
}
```

## TAG Parser

```typescript
const aParser = tag("a");

const i = aParser("a");

console.log(i.next());

// {
//  value: SuccessfulResult {
//    state: 0,
//    type: 'TAG',
//    data: 'a',
//    iter: {...}
//  },
//  done: true
// }
```

```typescript
const DOCTYPE_REGX = [
  /</,
  /!/,
  /[dD]/,
  /[oO]/,
  /[cC]/,
  /[tT]/,
  /[yY]/,
  /[pP]/,
  /[eE]/,
  /\s/,
  /[hH]/,
  /[tT]/,
  /[mM]/,
  /[lL]/,
  />/,
];

const doctypeParser = tag(DOCTYPE_REGX, { token: "DOCTYPE" });

const i = doctypeParser("<!DOCTYPE html>");

console.log(...i);

// OptionalToken { state: 3, type: 'DOCTYPE', data: '<!DOCTYPE html>' },
```

## SEQ Parser

```typescript
const divTag = seq(tag("<"), tag("div"), tag(">"));

const i = divTag("<div>");

console.log(i.next());

// {
//   value: SuccessfulResult {
//     state: 0,
//     type: 'SEQ',
//     data: [
//       SuccessfulResult {
//         state: 0,
//         type: 'TAG',
//         data: '<',
//         iter: {...}
//       },
//       SuccessfulResult {
//         state: 0,
//         type: 'TAG',
//         data: 'div',
//         iter: {...}
//       },
//       SuccessfulResult {
//         state: 0,
//         type: 'TAG',
//         data: '>',
//         iter: {...}
//       }
//     ],
//     iter: {...}
//   },
//   done: true
// }
```

## OR Parser

```typescript
const abcParser = or(
  { token: '"a" or "b" or "c" char' },
  tag("a"),
  tag("b"),
  tag("c")
);

const i = abcParser("b");

console.log(...i);

// OptionalToken {
//   state: 3,
//   type: '"a" or "b" or "c" char',
//   data: SuccessfulResult {
//     state: 0,
//     type: 'TAG',
//     data: 'b',
//     iter: {...}
//   }
// }
```

## REPEAT Parser

```typescript
const divsParser = repeat(seq(tag("<"), tag("div"), tag(">")));

const i = divsParser("<div><div><div><div>");

console.log(i.next());

// {
//   state: 0,
//   type: 'REPEAT',
//   data: [
//     {
//       state: 0,
//       type: 'SEQ',
//       data: [
//         { state: 0, type: 'TAG', data: '<', iter: {} },
//         { state: 0, type: 'TAG', data: 'div', iter: {} },
//         { state: 0, type: 'TAG', data: '>', iter: {} }
//       ],
//       iter: {...}
//     },
//     {
//       state: 0,
//       type: 'SEQ',
//       data: [
//         { state: 0, type: 'TAG', data: '<', iter: {} },
//         { state: 0, type: 'TAG', data: 'div', iter: {} },
//         { state: 0, type: 'TAG', data: '>', iter: {} }
//       ],
//       iter: {...}
//     },
//     {
//       state: 0,
//       type: 'SEQ',
//       data: [
//         { state: 0, type: 'TAG', data: '<', iter: {} },
//         { state: 0, type: 'TAG', data: 'div', iter: {} },
//         { state: 0, type: 'TAG', data: '>', iter: {} }
//       ],
//       iter: {...}
//     },
//     {
//       state: 0,
//       type: 'SEQ',
//       data: [
//         { state: 0, type: 'TAG', data: '<', iter: {} },
//         { state: 0, type: 'TAG', data: 'div', iter: {} },
//         { state: 0, type: 'TAG', data: '>', iter: {} }
//       ],
//       iter: {...}
//     }
//   ],
//   iter: {...}
// }
```

## Options: Optional Yield Token

First case — return type: SuccessfulResult (no options provided):

```typescript
const aParser = tag("a");

const i = aParser("a");

console.log(i.next());

// {
//  value: SuccessfulResult {
//    state: 0,
//    type: 'TAG',
//    data: 'a',
//    iter: {...}
//  },
//  done: true
// }
```

Second case — yield type: OptionalToken (options provided):

```typescript
const aParser = tag("a", { token: "A CHAR" });

const i = aParser("a");

console.log(...i);

// OptionalToken { state: 3, type: 'A CHAR', data: 'a' }
```

## Options: Value Mapper

In the first example, the parser returns each character as a separate result, creating an array of SuccessfulResult objects, each with one character in the data field.

```typescript
const textNode = repeat(tag(TEXT_NODE_CHAR_REGX), {
  token: "TEXT_NODE",
});

const i = textNode("text template");

console.log(i.next());

// {
//   value: OptionalToken {
//     state: 3,
//     type: 'TEXT_NODE',
//     data: Array(13) [
//       SuccessfulResult {
//         state: 0,
//         type: 'TAG',
//         data: 't',
//         iter: {}
//       },
//       SuccessfulResult {
//         state: 0,
//         type: 'TAG',
//         data: 'e',
//         iter: {}
//       },
//       SuccessfulResult {
//         state: 0,
//         type: 'TAG',
//         data: 'x',
//         iter: {}
//       },
//       SuccessfulResult {
//         state: 0,
//         type: 'TAG',
//         data: 't',
//         iter: {}
//       },
//       SuccessfulResult {
//         state: 0,
//         type: 'TAG',
//         data: ' ',
//         iter: {}
//       },
//       SuccessfulResult {
//         state: 0,
//         type: 'TAG',
//         data: 't',
//         iter: {}
//       },
//       SuccessfulResult {
//         state: 0,
//         type: 'TAG',
//         data: 'e',
//         iter: {}
//       },
//       SuccessfulResult {
//         state: 0,
//         type: 'TAG',
//         data: 'm',
//         iter: {}
//       },
//       SuccessfulResult {
//         state: 0,
//         type: 'TAG',
//         data: 'p',
//         iter: {}
//       },
//       SuccessfulResult {
//         state: 0,
//         type: 'TAG',
//         data: 'l',
//         iter: {}
//       },
//       SuccessfulResult {
//         state: 0,
//         type: 'TAG',
//         data: 'a',
//         iter: {}
//       },
//       SuccessfulResult {
//         state: 0,
//         type: 'TAG',
//         data: 't',
//         iter: {}
//       },
//       SuccessfulResult {
//         state: 0,
//         type: 'TAG',
//         data: 'e',
//         iter: {}
//       }
//     ]
//   },
//   done: false
// }
```

In the second example, a value mapper is used to combine all characters into a single string ('text template'), turning the array of individual characters into a single output.

```typescript
const textNode = repeat(tag(TEXT_NODE_CHAR_REGX), {
  token: "TEXT_NODE",
  valueMapper: (output) => output.reduce((acc, el) => acc + el.data, ""),
});

const i = textNode("text template");

console.log(i.next());

// {
//   value: OptionalToken { state: 3, type: 'TEXT_NODE', data: 'text template' },
//   done: false
// }
```

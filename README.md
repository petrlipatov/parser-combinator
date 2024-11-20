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

const bParser = tag("b", { token: "b Symbol" });

const i = bParser("b");

console.log(...i);

// OptionalToken { state: 3, type: 'b Symbol', data: 'b' }
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

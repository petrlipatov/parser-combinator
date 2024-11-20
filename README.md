# Parser Combinator 

This project provides a powerful and flexible parser combinator implementation in TypeScript. The library allows you to define parsers using composable functions, handle various parsing strategies, and manage parsing states efficiently.

---

## Features

- **Composable Parsers**: Build complex parsers by combining smaller ones.
- **Parsing States**: Handles success, failure, and intermediate states (`SUCCESSFUL`, `ABORTED`, `YIELD`, `EXPECT_NEW_INPUT`).
- **Built-in Parser Types**:
  - `TAG`: Matches a specific pattern or sequence of characters.
  - `TAKE`: Matches characters based on a given condition, with optional constraints on length.
  - `SEQ`: Combines multiple parsers to process sequentially.
  - `OR`: Tries multiple parsers and returns the result of the first successful one.
  - `REPEAT`: Repeats a parser multiple times.
- **Extensibility**: Create custom parsers tailored to your needs.

---

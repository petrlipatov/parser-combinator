// Constants
export enum ParserType {
  TAG = "TAG",
  TAKE = "TAKE",
  SEQ = "SEQ",
  OR = "OR",
  REPEAT = "REPEAT",
}

export enum ParserMessage {
  EXPECT_NEW_INPUT = "Parser expects new value",
  OR_ERROR = "At least one parser must succeed for the 'OR' operation to be valid.",
}

export enum ParserState {
  SUCCESSFUL,
  ABORTED,
  EXPECT_NEW_INPUT,
  YIELD,
}

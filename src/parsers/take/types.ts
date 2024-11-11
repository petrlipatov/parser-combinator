import { ParserOptions } from "../../types";

export interface TakeOptions extends ParserOptions<string> {
  min?: number;
  max?: number;
}

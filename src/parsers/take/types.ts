import { ParserOptions } from "../../shared/types";

export interface TakeOptions extends ParserOptions<string> {
  min?: number;
  max?: number;
}

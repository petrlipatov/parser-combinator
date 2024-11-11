import { ParserOptions } from "../../types";

export interface RepeatOptions<R = unknown> extends ParserOptions<R> {
  min?: number;
  max?: number;
  invalidPairs?: [string, string][];
}

import { ParserOptions } from "../types";

export function optionsProvided(options: ParserOptions) {
  return "token" in options;
}

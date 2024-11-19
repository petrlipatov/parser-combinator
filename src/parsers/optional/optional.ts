import { Parser, ParserOptions } from "../../shared/types";
import { repeat } from "../repeat";

export function optional<T = unknown, R = unknown>(
  parser: Parser,
  options?: ParserOptions<T[]>
): Parser {
  return repeat(parser, { min: 0, max: 1, ...options });
}

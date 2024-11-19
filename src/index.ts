import { ParserType } from "./shared/constants";
import { callCount1, callCount2, callCount3 } from "./helpers";
import { optional } from "./parsers/optional";
import { or } from "./parsers/or";
import { repeat } from "./parsers/repeat";
import { seq } from "./parsers/seq";
import { tag } from "./parsers/tag";

const html = `
  <!DOCTYPE html>
  <html lang="en">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Sample HTML Page</title>
    <style>
      body { font-family: Arial, sans-serif; }
      h1 { color: #333; }
    </style>
    <script>
      console.log('Hello from script!');
    </script>
  </head>
  <body>
    <div id="main" class="container">
      <header>
        <h1>Welcome to the Sample Page</h1>
        <nav>
          <ul>
            <li><a href="#home">Home</a></li>
            <li><a href="#about">About</a></li>
            <li><a href="#contact">Contact</a></li>
          </ul>
        </nav>
      </header>

      <section id="home">
        <h2>Home Section</h2>
        <p>This is a <strong>sample</strong> paragraph with some <em>inline</em> elements.</p>
        <p>Here is an image:</p>
        <img src="image.jpg" alt="Sample image" width="300">
        <div style="border: 1px solid #ccc; padding: 10px; margin-top: 20px; background-color: #f9f9f9;">
          <h3 style="color: #007BFF;">Inline Styled Section</h3>
          <p style="font-size: 14px; line-height: 1.5;">This section has an inline border, padding, and background color.</p>
        </div>
      </section>

      <section id="about">
        <h2>About Us</h2>
        <p>We are a company that values <strong>quality</strong> and <em>innovation</em>.</p>
        <div style="color: green; font-weight: bold;">
          <p>This text is styled inline with green color and bold weight.</p>
        </div>
      </section>

      <section id="contact">
        <h2>Contact Us</h2>
        <form action="/submit" method="post">
          <label for="name">Name:</label>
          <input type="text" id="name" name="name">
          <label for="email">Email:</label>
          <input type="email" id="email" name="email">
          <button type="submit">Submit</button>
        </form>
      </section>
      <footer>
        <p>&copy; 2024 Sample Website. All rights reserved.</p>
      </footer>
    </div>
  </body>
  </html>
`;

const DOCTYPE = [
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

const WHITESPACE = [/\s/];
const TAG_NAME_CHAR = [/[a-zA-Z0-9]/];

const ATT_NAME_FIRST_CHAR = [/[a-zA-Z]/];
const ATT_NAME_NEXT_CHAR = [/[a-zA-Z0-9-]/];

const ATT_VALUE_UNQUOTED = [/[^-\s'">]/];
const ATT_VALUE_SINGLE_QUOTED = [/[^']/];
const ATT_VALUE_DOUBLE_QUOTED = [/[^"]/];

const STYLE_PROP_NAME_CHAR = [/[^:"\s]/];
const STYLE_PROP_VALUE_CHAR = [/[^;"]/];

const TEXT_NODE_CHAR = [/[^<>]/];
const COMMENT_CHAR = [/[^<>]/];

const doctype = tag(DOCTYPE, { token: "DOCTYPE" });

// const i = doctype("<!DOCTYPE html>"); // проверено
// console.log([...i]);

const ws = repeat(tag(WHITESPACE));

// const i = or(seq(ws, tag("a")), seq(ws, tag("b")), seq(ws, tag("c")))(" c");
// console.log(i.next());

const tagNameChar = tag(TAG_NAME_CHAR);

const attributeName = seq(
  {
    token: "ATTRIBUTE_NAME",
    tokenValue: (output) =>
      output.reduce((acc, el) => {
        const data = Array.isArray(el.data)
          ? el.data.map((item) => item.data).join("")
          : el.data;
        return acc + data;
      }, ""),
  },
  tag(ATT_NAME_FIRST_CHAR),
  repeat(tag(ATT_NAME_NEXT_CHAR))
);

// const i = attributeName("name"); // проверено
// console.log([...i]);

const attributeValue = or(
  {
    token: "ATTRIBUTE_VALUE",
    tokenValue: (output) => {
      if (output.type === ParserType.REPEAT && Array.isArray(output.data)) {
        return output.data.map((item) => item.data).join("");
      } else if (Array.isArray(output.data)) {
        const data = output.data.find(
          (item) => item.type === ParserType.REPEAT
        );
        return data.data.map((el) => el.data).join("");
      }
    },
  },
  repeat(tag(ATT_VALUE_UNQUOTED)),
  seq(tag(`'`), repeat(tag(ATT_VALUE_SINGLE_QUOTED)), tag(`'`)),
  seq(tag(`"`), repeat(tag(ATT_VALUE_DOUBLE_QUOTED)), tag(`"`))
);

// const i = attributeValue('"name"');
// console.log(i.next());

const styleAttributeAttribute = tag("style", {
  token: "STYLE_ATTRIBUTE",
});

// const i = styleAttributeAttribute("style"); // проверено
// console.log([...i]);

const styleProperty = seq(
  optional(ws),
  repeat(tag(STYLE_PROP_NAME_CHAR), {
    token: "STYLE_PROP_NAME",
    tokenValue: (output) => output.reduce((acc, el) => acc + el.data, ""),
  }),
  tag(":"),
  ws,
  repeat(tag(STYLE_PROP_VALUE_CHAR), {
    token: "STYLE_PROP_VALUE",
    tokenValue: (output) => output.reduce((acc, el) => acc + el.data, ""),
  }),
  tag(`;`)
);

// const i = styleProperty("color: green;");
// console.log(i.next());
// console.log(i.next());
// console.log(i.next());

const styleAttribute = seq(
  styleAttributeAttribute,
  tag("="),
  or(tag(`"`), tag(`'`)),
  repeat(styleProperty),
  or(tag(`"`), tag(`'`))
);

// const i = styleAttribute(`style="color: green; font-weight: bold;"`);
// console.log(...i);
// console.log(i.next());
// console.log(i.next());
// console.log(i.next());
// console.log(i.next());

const attributeKeyword = repeat(tagNameChar, {
  token: "KEYWORD",
  tokenValue: (output) => output.reduce((acc, el) => acc + el.data, ""),
});

const openTag = seq(
  tag("<"),
  repeat(tagNameChar, {
    token: "OPENING_TAG",
    tokenValue: (output) => output.reduce((acc, el) => acc + el.data, ""),
  }),
  optional(
    repeat(
      or(
        seq(ws, styleAttribute),
        seq(ws, attributeName, tag("="), attributeValue),
        seq(ws, attributeKeyword)
      )
    )
  ),
  tag(">")
);

// const i = repeat(
//   or(
//     seq(ws, styleAttribute),
//     seq(ws, attributeName, tag("="), attributeValue),
//     seq(ws, attributeKeyword)
//   )
// )(`< height="100" weight="30">`);
// console.log(...i);

// console.log(i.next());

// console.log(i.next());
// console.log(i.next());

const closeTag = seq(
  tag("<"),
  tag("/"),
  repeat(tagNameChar, {
    token: "CLOSING_TAG",
    tokenValue: (output) => output.reduce((acc, el) => acc + el.data, ""),
  }),
  tag(">")
);

// const i = repeat(or(openTag, closeTag))("<div></div>");
// console.log(i.next());

const textNode = repeat(tag(TEXT_NODE_CHAR), {
  token: "TEXT_NODE",
  tokenValue: (output) => output.reduce((acc, el) => acc + el.data, ""),
});

// const i = textNode("div");
// console.log([...i]);

// const comment = seq(
//   tag("<!--"),
//   repeat(tag(COMMENT_CHAR), {
//     token: "COMMENT",
//     tokenValue: (output) => output.reduce((acc, el) => acc + el.data, ""),
//     invalidPairs: [["-", "-"]],
//   }),
//   tag("-->")
// );

// const i = comment("<!-- Это пример комментария в HTML -->");
// console.log(i.next());

const htmlParser = seq(
  optional(ws),
  doctype,
  repeat(or(ws, openTag, textNode, closeTag))
);

const i = htmlParser(html);

const startTime = performance.now();
const res2 = [...i];
const endTime = performance.now();
console.log(`Время выполнения: ${endTime - startTime} мс`);

console.log(callCount1);
console.log(callCount2);
console.log(callCount3);

// res2.forEach((token) => {
//   console.log(token);
// });

// const str = "string";

// const i = intoIter(str);

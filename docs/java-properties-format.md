# Java `.properties` format

This document describes how `java.util.Properties.load(Reader)` parses a `.properties` file. It is the reference this library aims to match. When the parser and this document disagree, the parser is wrong unless the difference is listed under [Intentional deviations](#intentional-deviations).

Source: [`Properties.load(Reader)` javadoc, Java SE 17](https://docs.oracle.com/en/java/javase/17/docs/api/java.base/java/util/Properties.html#load(java.io.Reader)).
Every example below was checked against OpenJDK 17.0.21 (see [Verifying against Java](#verifying-against-java)).

In the examples, inputs are written exactly as they appear in the file. `⏎` marks a line break and `·` marks a space that matters. Results are written as JSON, so `\\` in a result is one backslash.

## 1. Lines

The parser reads input in two passes over lines.

- A **natural line** is the text up to a line terminator (`\n`, `\r`, or `\r\n`) or the end of input.
- A **logical line** is one key-element pair. It may span several natural lines joined by line continuation (section 4).

**White space** means space (`U+0020`), tab (`\t`), and form feed (`\f`). Line terminators are handled separately and are not white space in the rules below.

## 2. Blank lines

A natural line that contains **only white space** is blank and is ignored. An empty line and a line of only spaces are treated the same.

| Input | Result |
| --- | --- |
| `a=1⏎⏎b=2` | `{ a: "1", b: "2" }` |
| `a=1⏎···⏎b=2` | `{ a: "1", b: "2" }` |

## 3. Comment lines

A comment line has `#` or `!` as its **first non-white-space character**. Comment lines are ignored.

- **A comment cannot be continued.** A `\` at the end of a comment line does not join the next line, so the next line is parsed on its own.
- **There are no inline comments.** `#` after a key or inside a value is ordinary text.
- **A comment is recognised only while the logical line is still empty.** A continuation line that begins with `#` is part of the value. In OpenJDK, a continuation that has added nothing yet also counts as empty, so `\` on its own line followed by `# x` is a comment. The javadoc does not mention this; the parser follows the JDK.

| Input | Result |
| --- | --- |
| `# see \⏎key=value` | `{ key: "value" }` |
| `k=a # b` | `{ k: "a # b" }` |
| `k=a\⏎# not comment` | `{ k: "a# not comment" }` |
| `\⏎# x⏎a=1` | `{ a: "1" }` |

## 4. Line continuation

A natural line continues onto the next one when it ends with an **odd number** of contiguous backslashes.

- An even number of backslashes (`\\`, `\\\\`, …) at the end of a line are escaped backslashes. They do not continue the line.
- When lines are joined, three things are removed: the escaping `\`, the line terminator, and any **white space at the start of the next line**. Nothing replaces them.
- That leading white space is removed only from the one line being joined. Removal does not cross a line terminator, so an empty line after a `\` ends the logical line instead of being skipped.
- A `\` at the very end of the input is dropped.

| Input | Result | Why |
| --- | --- | --- |
| `a=hel\⏎···lo` | `{ a: "hello" }` | leading spaces on the next line are removed |
| `dir=C:\\⏎port=8080` | `{ dir: "C:\\", port: "8080" }` | two backslashes: no continuation, value is one `\` |
| `a=1\\\⏎b` | `{ a: "1\\b" }` | three backslashes: one escaped `\` plus a continuation |
| `a=1\⏎⏎b=2` | `{ a: "1", b: "2" }` | an empty line ends the logical line |
| `k=x\` (end of input) | `{ k: "x" }` | a final `\` is dropped |
| `a=1⏎\⏎` (end of input) | `{ a: "1", "": "" }` | OpenJDK quirk: a lone `\` + line terminator at the very end yields an empty line, so the key `""` |

The javadoc's own example joins three lines into one value:

```properties
fruits                           apple, banana, pear, \
                                 cantaloupe, watermelon, \
                                 kiwi, mango
```

→ `{ fruits: "apple, banana, pear, cantaloupe, watermelon, kiwi, mango" }`

## 5. Key

After line continuations are removed, the parser handles each logical line as follows:

1. Skip leading white space.
2. The key runs from the first non-white-space character up to, but not including, the first **unescaped** `=`, `:`, or white space character.
3. A character is unescaped when it has an even number of backslashes directly before it. For example, `\\=` is an escaped backslash followed by a real separator, but `\=` is an escaped `=`.
4. To put `=`, `:`, or a space in a key, escape it: `\=`, `\:`, `\ `.

| Input | Result |
| --- | --- |
| `\:\==x` | `{ ":=": "x" }` |
| `dir\\=x` | `{ "dir\\": "x" }` |
| `key\ with\ space=v` | `{ "key with space": "v" }` |
| `cheeses` | `{ cheeses: "" }` |
| `cheeses···` | `{ cheeses: "" }` |

## 6. Separator

After the key, the parser does three things:

1. Skip white space.
2. If the next character is `=` or `:`, consume **that one character only**.
3. Skip white space again.

This makes white space alone a valid separator. A second `=` or `:` belongs to the value.

| Input | Result |
| --- | --- |
| `Truth = Beauty` | `{ Truth: "Beauty" }` |
| `·Truth:Beauty` | `{ Truth: "Beauty" }` |
| `Truth···········:Beauty` | `{ Truth: "Beauty" }` |
| `fruits   apple` | `{ fruits: "apple" }` |
| `k==v` | `{ k: "=v" }` |
| `k = = v` | `{ k: "= v" }` |

## 7. Value

Everything left on the logical line is the value. If nothing is left, the value is `""`.

- **Trailing white space is kept.** Only white space *before* the value is skipped.
- To keep a leading space, escape it: `k=\ lead`.

| Input | Result |
| --- | --- |
| `greeting=hello···` | `{ greeting: "hello···" }` |
| `k=\ lead` | `{ k: " lead" }` |
| `url=http://example.com` | `{ url: "http://example.com" }` |

## 8. Escape sequences

Escapes are processed in keys and values **after** the key and value have been found. Because of this, an escaped separator never splits the line.

| Sequence | Result |
| --- | --- |
| `\t` `\n` `\r` `\f` | tab, newline, carriage return, form feed |
| `\\` | `\` |
| `\uXXXX` | the UTF-16 code unit `XXXX` (exactly one `u`, four hex digits) |
| `\` + any other character | that character (the backslash is dropped). For example, `\b` → `b`, `\z` → `z`, `\=` → `=`, `\ ` → space |

Java does **not** recognise:

- octal escapes;
- `\b` as backspace;
- `\uu0041` (more than one `u`).

A malformed `\u` escape, such as `\u00G1`, makes Java throw `IllegalArgumentException: Malformed \uxxxx encoding.`

## Conformance of this library

The parser in `src/index.ts` is a port of OpenJDK 17's `Properties.LineReader` and `load0`. With all options off, it returns the same result as `java.util.Properties.load` for every rule in sections 1–8. Each rule has a test in the `java.util.Properties conformance` block of `test/index.test.ts`, and the parser also matched Java on 7,000 randomly generated inputs.

The one open question is a malformed `\u` escape (see below).

Issue [#17](https://github.com/mehimanshupatil/propertiesToJSON/issues/17) covered the rules from §2, §3, §4, §5 and §7 that earlier versions got wrong.

## Intentional deviations

These are differences we keep on purpose. Each one is tested and listed in the README.

- **Malformed `\u` escapes:** not yet decided. Either throw like Java, or stay lenient and document that choice here.

Additions to the output (`convertToJsonTree`, `parseNumber`, `parseBooleanNullUndefined`) run **after** parsing and are not deviations. With all options off, the output must equal what Java returns.

## Verifying against Java

When a case is unclear, ask Java. With a JDK (11+) installed, run the reference converter on any file:

```sh
printf 'greeting=hello   \n' > /tmp/case.properties
java test/java/PropertiesToJson.java /tmp/case.properties
# [{"file":"/tmp/case.properties","result":{"greeting":"hello   "}}]
```

`test/java-compat.test.ts` uses the same helper. It compares the parser with Java on `sample.properties`, every file in `test/fixtures/`, and 2,000 seeded random inputs. CI installs Java and sets `REQUIRE_JAVA=1`, so these tests always run there. Locally they are skipped when `java` is not installed.

To lock in a new rule, add it to `test/fixtures/edge-cases.properties` (Java checks it automatically) or add a unit test to `test/index.test.ts` whose expected value you copied from the helper's output. Do not take an expected value from this parser's current output.

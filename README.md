Convert Java `.properties` files to JSON (using JavaScript/TypeScript).

Supports nested objects, arrays, Unicode escape sequences, and type coercion.

## Install

```sh
# pnpm
pnpm add js-properties-to-json

# npm
npm i js-properties-to-json
```

## Usage

```ts
import propertiesToJSON from 'js-properties-to-json';
// or CommonJS:
// const propertiesToJSON = require('js-properties-to-json');

const result = propertiesToJSON(`
# comment
server.host=localhost
server.port=8080
`);
// { 'server.host': 'localhost', 'server.port': '8080' }
```

### Read a local file in Node.js

```js
import fs from 'fs';
import propertiesToJSON from 'js-properties-to-json';

const data = fs.readFileSync('app.properties', 'utf-8');
console.log(propertiesToJSON(data, { convertToJsonTree: true, parseNumber: true }));
```

### Read a remote file in the browser

```js
import propertiesToJSON from 'js-properties-to-json';

const text = await fetch('/app.properties').then((r) => r.text());
console.log(propertiesToJSON(text));
```

## Options

```ts
import propertiesToJSON, { type Options } from 'js-properties-to-json';
```

| Option                      | Default | Description                                                                                  |
| :-------------------------: | :-----: | :------------------------------------------------------------------------------------------: |
| `jsonAsString`              | `false` | Return the result as a JSON string instead of an object                                      |
| `convertToJsonTree`         | `false` | Convert dotted keys into nested objects — e.g. `a.b=c` → `{ a: { b: "c" } }`               |
| `parseNumber`               | `false` | Coerce numeric strings to numbers — e.g. `port=8080` → `{ port: 8080 }`                     |
| `parseBooleanNullUndefined` | `false` | Coerce `"true"`, `"false"`, `"null"`, `"undefined"` to their JS equivalents (case-sensitive) |

## Examples

| Properties         | JSON                               |
| ------------------ | ---------------------------------- |
| `a=b`              | `{ "a": "b" }`                     |
| `a:b`              | `{ "a": "b" }`                     |
| `a = b`            | `{ "a": "b" }`                     |
| `a b`              | `{ "a": "b" }`                     |
| `a[0]=x`           | `{ "a": ["x"] }` (requires `convertToJsonTree`) |
| `a[1][1]=b`        | `{ "a": [null, [null, "b"]] }` (requires `convertToJsonTree`) |
| `a.b.c=d`          | `{ "a": { "b": { "c": "d" } } }` (requires `convertToJsonTree`) |
| `k=\u00e9`         | `{ "k": "é" }`                     |
| `k=hello\tworld`   | `{ "k": "hello\tworld" }`          |

## How values and edge cases are converted

The parser follows [`java.util.Properties.load`](https://docs.oracle.com/en/java/javase/17/docs/api/java.base/java/util/Properties.html#load(java.io.Reader)). Every example below is in [`test/fixtures/edge-cases.properties`](test/fixtures/edge-cases.properties), and CI checks it against real Java. In the JSON column, `\\` is one backslash.

### Keys, separators and values

| Properties | JSON | Rule |
| --- | --- | --- |
| `Truth = Beauty` | `{ "Truth": "Beauty" }` | white space around `=` or `:` is skipped |
| `space.separated value here` | `{ "space.separated": "value here" }` | the first space or tab also separates key and value |
| `double.eq==v` | `{ "double.eq": "=v" }` | only one `=` or `:` is a separator; the rest is value |
| `url=http://example.com:8080/path` | `{ "url": "http://example.com:8080/path" }` | `=` and `:` inside a value are kept |
| `cheeses` | `{ "cheeses": "" }` | a key on its own has an empty value |
| `trailing.spaces=hello␣␣␣` | `{ "trailing.spaces": "hello   " }` | trailing spaces in a value are kept (`␣` = space) |
| `escaped.leading.space=\ lead` | `{ "escaped.leading.space": " lead" }` | escape a leading space to keep it |
| `key\ with\ space=v` | `{ "key with space": "v" }` | escape spaces, `=` and `:` to use them in a key |
| `\:\==x` | `{ ":=": "x" }` | |
| `hash.in.value=a # b` | `{ "hash.in.value": "a # b" }` | there are no inline comments |

### Comments and blank lines

Lines whose first non-white-space character is `#` or `!` are comments. Blank lines and lines of only white space are skipped. A comment ending in `\` does **not** continue onto the next line:

```properties
# a comment ending in a backslash does not continue \
comment.not.continued=yes
```

```json
{ "comment.not.continued": "yes" }
```

### Line continuation and backslashes

A line ending in an **odd** number of backslashes continues onto the next line, and leading white space on that next line is dropped. An **even** number is a run of escaped backslashes and does not continue:

```properties
continued.value=hel\
    lo
even.backslashes=C:\\
after.even=8080
odd.backslashes=1\\\
b
empty.continuation=1\

after.empty=2
hash.on.continuation=a\
# not a comment
```

```json
{
  "continued.value": "hello",
  "even.backslashes": "C:\\",
  "after.even": "8080",
  "odd.backslashes": "1\\b",
  "empty.continuation": "1",
  "after.empty": "2",
  "hash.on.continuation": "a# not a comment"
}
```

An empty line after a `\` ends the value. A `#` at the start of a continued line is part of the value, not a comment.

Line endings can be `\n`, `\r\n` or `\r`, and can be mixed in one file.

## Supported escape sequences

Escapes work in both keys and values.

| Sequence      | Result                  |
| ------------- | ----------------------- |
| `\uXXXX`      | Unicode character (hex) |
| `\t`          | Tab                     |
| `\n`          | Newline                 |
| `\r`          | Carriage return         |
| `\f`          | Form feed               |
| `\\`          | Literal backslash (so `\\u0041` is the text `\u0041`, not `A`) |
| `\=`, `\:`, `\ ` | Literal `=`, `:` or space |
| `\` + any other character | That character; the backslash is dropped (`\b` → `b`, `\"` → `"`) |

## Java compatibility

With all options off, the output matches what `java.util.Properties.load` returns. See [docs/java-properties-format.md](docs/java-properties-format.md) for the full format rules and any known differences.

Note that `#` and `!` start a comment only at the beginning of a line, so `key=value # comment` gives the value `value # comment`.

## Online converter

[https://mehimanshupatil.github.io/propertiesToJSON/](https://mehimanshupatil.github.io/propertiesToJSON/)

## Inspiration

- [ryanpcmcquen/propertiesToJSON](https://github.com/ryanpcmcquen/propertiesToJSON)
- [jeanpaulattard/json-to-properties](https://github.com/jeanpaulattard/json-to-properties)

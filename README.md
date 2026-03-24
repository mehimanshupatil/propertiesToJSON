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
| `a[0]=x`           | `{ "a": ["x"] }`                   |
| `a[1][1]=b`        | `{ "a": [null, [null, "b"]] }`     |
| `a.b.c=d`          | `{ "a": { "b": { "c": "d" } } }` (requires `convertToJsonTree`) |
| `k=\u00e9`         | `{ "k": "é" }`                     |
| `k=hello\tworld`   | `{ "k": "hello\tworld" }`          |

## Supported escape sequences

| Sequence      | Result                  |
| ------------- | ----------------------- |
| `\uXXXX`      | Unicode character (hex) |
| `\t`          | Tab                     |
| `\n`          | Newline                 |
| `\r`          | Carriage return         |
| `\f`          | Form feed               |
| `\\`          | Literal backslash       |
| `\=`, `\:`    | Literal `=` or `:` in a key |

## Limitations

- Whitespace-only key separators (e.g. `key value`) are not supported — use `=` or `:`.
- Inline comments (e.g. `key=value # comment`) are not supported; the `# comment` becomes part of the value.
- `parseBooleanNullUndefined` is case-sensitive: `"True"` stays as a string.

## Online converter

[https://mehimanshupatil.github.io/propertiesToJSON/](https://mehimanshupatil.github.io/propertiesToJSON/)

## Inspiration

- [ryanpcmcquen/propertiesToJSON](https://github.com/ryanpcmcquen/propertiesToJSON)
- [jeanpaulattard/json-to-properties](https://github.com/jeanpaulattard/json-to-properties)

Convert Java `.properties` files to JSON (using JavaScript).

The function `propertiesToJSON` takes a string and returns
a JavaScript object.

### use

```
 propertiesToJSON(data, {
                jsonAsString: false,
                convertToJsonTree : false,
                parseNumber:false,
                parseBooleanNullUndefined:false,
            });
```

### Read a local file in `node`:

```js
const fs = require('fs');
const path = require('path');
const filePath = path.join(__dirname, 'sample.properties');
const propertiesToJSON = require('properties-to-json');

fs.readFile(filePath, { encoding: 'utf-8' }, (err, data) => {
    if (!err) {
        console.log(propertiesToJSON(data));
    }
});
```

### Read a remote file in the browser:

```js
const propertiesToJSON = require('properties-to-json');

const propsFile = new Request('https://gitcdn.link/repo/ryanpcmcquen/propertiesToJSON/master/sample.properties');

const props = fetch(propsFile)
    .then((response) => {
        return response.text();
    })
    .then((text) => {
        const propsText = propertiesToJSON(text);
        console.log(propsText);
        return propsText;
    });
```

### Available options

|          Option           | Default&#160;value |                                         Description                                          |
| :-----------------------: | :----------------: | :------------------------------------------------------------------------------------------: |
|       jsonAsString        |       false        |                                   return json as a string                                    |
|     convertToJsonTree     |       false        | convert properties to json tree eg `a.b=c` to `{ "a.b": c }` if false or `{ "a": {"b": c} }` |
|        parseNumber        |       false        |               parse value to number e.g - `a=1` to `{ a: "1" }` or `{ a: 1 }`                |
| parseBooleanNullUndefined |       false        |                  parse string value of `null`, `true`, `false`, `undefined`                  |

### How do I get it?

1. `npm i https://github.com/mehimanshupatil/propertiesToJSON`

### original code

[https://github.com/ryanpcmcquen/propertiesToJSON](https://github.com/ryanpcmcquen/propertiesToJSON)

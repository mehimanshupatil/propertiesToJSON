const fs = require('fs');
const path = require('path');
const filePath = path.join(__dirname, 'sample.properties');
const propertiesToJSON = require('./dist/index.js');

fs.readFile(filePath, { encoding: 'utf-8' }, (err, data) => {
    if (!err) {
        console.log(`
-----------------------------
'sample.properties' contents:
-----------------------------
        `);
        console.log(data);
        const props = propertiesToJSON(data);
        console.log(`
---------------------------------
Object of entire properties file:
---------------------------------
        `);
        console.log(props);

        const newProps = propertiesToJSON(data, {
            jsonAsString: false,
            convertToJsonTree: true,
            parseNumber: true,
            parseBooleanNullUndefined: true,
        });
        console.log(`
-----------------------------------------------------
Object of entire properties file with new json tree:
-----------------------------------------------------
        `);
        console.log(newProps);
        console.log(`
 
-----------------
That's all folks!
-----------------
        `);
    } else {
        console.log(err);
    }
});

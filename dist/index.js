'use strict';

// @ts-nocheck
var defaultValue = function (v, d) { return (v === undefined ? d : v); };
var typesMap = {
    "false": false,
    "true": true,
    undefined: undefined,
    "null": null
};
var defaults = {
    jsonAsString: false,
    convertToJsonTree: false,
    parseNumber: false,
    parseBooleanNullUndefined: false
};
function isNumeric(value) {
    return value != null && value !== '' && !isNaN(Number(value.toString()));
}
var propertiesToJSON = function (str, options) {
    if (options === void 0) { options = defaults; }
    var parsedOptions = {
        jsonAsString: defaultValue(options.jsonAsString, defaults.jsonAsString),
        convertToJsonTree: defaultValue(options.convertToJsonTree, defaults.convertToJsonTree),
        parseNumber: defaultValue(options.parseNumber, defaults.parseNumber),
        parseBooleanNullUndefined: defaultValue(options.parseBooleanNullUndefined, defaults.parseBooleanNullUndefined)
    };
    var jsonObj = str
        // Concat lines that end with '\'.
        .replace(/\\\n( )*/g, '')
        // Split by line breaks.
        .split('\n')
        // Remove commented lines and empty lines
        .filter(function (line) { return (!line || /(\#|\!)/.test(line.replace(/\s/g, '').slice(0, 1)) ? false : line); })
        // Create the JSON:
        .reduce(function (obj, line) {
        // Replace only '=' that are not escaped with '\' to handle separator inside key
        var colonifiedLine = line.replace(/(?<!\\)=/, ':');
        var key = colonifiedLine
            // Extract key from index 0 to first not escaped colon index
            .substring(0, colonifiedLine.search(/(?<!\\):/))
            // Remove not needed backslash from key
            .replace(/\\/g, '')
            .trim();
        var value = colonifiedLine.substring(colonifiedLine.search(/(?<!\\):/) + 1).trim();
        if (parsedOptions.parseNumber && isNumeric(value)) {
            value = +value;
        }
        else if (parsedOptions.parseBooleanNullUndefined) {
            value = value in typesMap ? typesMap[value] : value;
        }
        if (!parsedOptions.convertToJsonTree) {
            obj[key] = value;
            return obj;
        }
        var keys = key.split('.');
        return treeCreationRecursiveFn(keys, value, obj);
    }, {});
    if (parsedOptions.jsonAsString)
        return JSON.stringify(jsonObj);
    return jsonObj;
};
var treeCreationRecursiveFn = function (keys, value, result) {
    var key = keys[0];
    var regex = /\[(\d)*?\]/;
    if (key.match(regex)) {
        console.log("object", key.match(regex)[1]);
    }
    // key = key.replace(regex, '');
    if (keys.length === 1) {
        if (result[key] &&
            result[key].constructor === Object &&
            (typeof value === 'string' || typeof value === 'number')) {
            console.warn("key missing for value ->", value);
            console.warn('The value will have empty string as a key');
            result[key][''] = value;
        }
        else {
            result[key] = value;
        }
    }
    else {
        var obj = {};
        console.log("keys", keys[1]);
        if (result[key] && result[key].constructor === Object)
            obj = result[key];
        else if (typeof result[key] === 'string' || typeof result[key] === 'number') {
            // conflicting case: a=b \n a.c=d then o/p will be a: { '': 'b', c: 'd' }
            obj = { '': result[key] };
            console.warn("key missing for value ->", result[key]);
            console.warn('The value will have empty string as a key');
        }
        result[key] = treeCreationRecursiveFn(keys.slice(1), value, obj);
    }
    return result;
};

module.exports = propertiesToJSON;
//# sourceMappingURL=index.js.map

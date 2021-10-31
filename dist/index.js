'use strict';

/*! *****************************************************************************
Copyright (c) Microsoft Corporation.

Permission to use, copy, modify, and/or distribute this software for any
purpose with or without fee is hereby granted.

THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH
REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY
AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT,
INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM
LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR
OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR
PERFORMANCE OF THIS SOFTWARE.
***************************************************************************** */

var __assign = function() {
    __assign = Object.assign || function __assign(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p)) t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};

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
        // Remove commented lines:
        .filter(function (line) {
        return /(\#|\!)/.test(line.replace(/\s/g, '').slice(0, 1)) ? false : line;
    })
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
        var value = colonifiedLine
            .substring(colonifiedLine.search(/(?<!\\):/) + 1)
            .trim();
        if (parsedOptions.parseNumber && isNumeric(value)) {
            value = +value;
        }
        else if (parsedOptions.parseBooleanNullUndefined) {
            // @ts-ignore
            value = value in typesMap ? typesMap[value] : value;
        }
        if (!parsedOptions.convertToJsonTree) {
            // @ts-ignore
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
    if (keys.length === 1) {
        if (
        // @ts-ignore
        typeof result[key] !== null && // @ts-ignore
            typeof result[key] === 'object' &&
            typeof value === 'string') {
            console.warn("key missing for value ->", value);
            console.warn('The value will have empty string as a key'); // @ts-ignore
            result[key][''] = value; // @ts-ignore
        }
        else
            result[key] = value;
    }
    else {
        var obj = {};
        // since typeof null === "object" we check for null also https://stackoverflow.com/a/8511350/9740955
        if (
        // @ts-ignore
        typeof result[key] === 'object' && // @ts-ignore
            !Array.isArray(result[key]) && // @ts-ignore
            result[key] !== null)
            // @ts-ignore
            obj = result[key];
        // @ts-ignore
        else if (typeof result[key] === 'string') {
            // conflicting case: a=b \n a.c=d then o/p will be a: { '': 'b', c: 'd' }
            // @ts-ignore
            obj = __assign({}, (result[key] !== undefined && { '': result[key] })); // @ts-ignore
            console.warn("key missing for value ->", result[key]);
            console.warn('The value will have empty string as a key');
        }
        // @ts-ignore
        result[key] = treeCreationRecursiveFn(keys.slice(1), value, obj);
    }
    return result;
};

module.exports = propertiesToJSON;
//# sourceMappingURL=index.js.map

// @ts-nocheck
const defaultValue = (v: any, d: any) => (v === undefined ? d : v);

const typesMap = {
    false: false,
    true: true,
    undefined: undefined,
    null: null,
};

const defaults = {
    jsonAsString: false,
    convertToJsonTree: false,
    parseNumber: false,
    parseBooleanNullUndefined: false,
};

function isNumeric(value: string | number): boolean {
    return value != null && value !== '' && !isNaN(Number(value.toString()));
}

const propertiesToJSON = (str: string, options = defaults) => {
    const parsedOptions = {
        jsonAsString: defaultValue(options.jsonAsString, defaults.jsonAsString),
        convertToJsonTree: defaultValue(options.convertToJsonTree, defaults.convertToJsonTree),
        parseNumber: defaultValue(options.parseNumber, defaults.parseNumber),
        parseBooleanNullUndefined: defaultValue(options.parseBooleanNullUndefined, defaults.parseBooleanNullUndefined),
    };
    const jsonObj = str
        // Concat lines that end with '\'.
        .replace(/\\\n( )*/g, '')
        // Split by line breaks.
        .split('\n')
        // Remove commented lines and empty lines
        .filter((line) => (!line || /(\#|\!)/.test(line.replace(/\s/g, '').slice(0, 1)) ? false : line))
        // Create the JSON:
        .reduce((obj, line) => {
            // Replace only '=' that are not escaped with '\' to handle separator inside key
            const colonifiedLine = line.replace(/(?<!\\)=/, ':');
            const key = colonifiedLine
                // Extract key from index 0 to first not escaped colon index
                .substring(0, colonifiedLine.search(/(?<!\\):/))
                // Remove not needed backslash from key
                .replace(/\\/g, '')
                .trim();

            let value = colonifiedLine.substring(colonifiedLine.search(/(?<!\\):/) + 1).trim() as string | number;

            if (parsedOptions.parseNumber && isNumeric(value)) {
                value = +value;
            } else if (parsedOptions.parseBooleanNullUndefined) {
                value = value in typesMap ? typesMap[value] : value;
            }

            if (!parsedOptions.convertToJsonTree) {
                obj[key] = value;
                return obj;
            }

            const keys = key.split('.');
            return treeCreationRecursiveFn(keys, value, obj);
        }, {});

    if (parsedOptions.jsonAsString) return JSON.stringify(jsonObj);
    return jsonObj;
};

const regexG = /\[(\d)*?\]/g;
const regex = /\[(\d)*?\]/;

const treeCreationRecursiveFn = function (keys: string[], value: string | number, result: object) {
    let key = keys[0];

    const indexs = key.match(regexG)?.map((x) => +x.match(regex)[1]);
    if (indexs) key = key.replace(regexG, '');

    if (keys.length === 1) {
        if (indexs) {
            result[key] = arrayRecursiveFn(indexs, value, result[key] || []);
        } else if (
            result[key] &&
            result[key].constructor === Object &&
            (typeof value === 'string' || typeof value === 'number')
        ) {
            console.warn(`key missing for value ->`, value);
            console.warn('The value will have empty string as a key');
            result[key][''] = value;
        } else {
            result[key] = value;
        }
    } else {
        let obj = {};

        if (result[key] && result[key].constructor === Object) obj = result[key];
        else if (typeof result[key] === 'string' || typeof result[key] === 'number') {
            // conflicting case: a=b \n a.c=d then o/p will be a: { '': 'b', c: 'd' }

            obj = { '': result[key] };
            console.warn(`key missing for value ->`, result[key]);
            console.warn('The value will have empty string as a key');
        }
        if (indexs) {
            const val = treeCreationRecursiveFn(keys.slice(1), value, obj);
            result[key] = arrayRecursiveFn(indexs, val, result[key] || []);
        } else result[key] = treeCreationRecursiveFn(keys.slice(1), value, obj);
    }
    return result;
};

const arrayRecursiveFn = function (indexes, value, result) {
    let index = indexes[0];
    if (indexes.length === 1) {

        const prevVal = result[index]

        if (prevVal && typeof prevVal !== 'object')
            console.warn('conflicting case occured in array creation one or more properties can be replaced');
        if (prevVal && prevVal.constructor === Object && value.constructor === Object)
            result[index] = { ...prevVal, ...value };
        else if (prevVal && prevVal.constructor === Array && value.constructor === Array)
            result[index] = [...prevVal, ...value];
        else
            result[index] = value;

    } else {
        let obj = result[index] || [];
        if (result[index] && typeof result[index] === 'string') {
            console.warn('conflicting case occured in array creation one or more properties can be replaced');
            obj = [];
        } else if (result[index] && result[index].constructor === Object) {
            /**
             * o.a[1].b=we 
                o.a[1][2]=True 
             */
            console.warn('conflicting case occured as array is object key will be ""');
            obj = [];
            result[index][''] = arrayRecursiveFn(indexes.slice(1), value, obj);
        } else result[index] = arrayRecursiveFn(indexes.slice(1), value, obj);
    }
    return result;
};

export default propertiesToJSON;

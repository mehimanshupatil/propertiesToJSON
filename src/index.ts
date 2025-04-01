// @ts-nocheck
const isPlainObject = (o: any) => typeof o === "object" && o.__proto__ === Object.prototype;
const isArray = Array.isArray;

const defaultValue = (v: any, d: any) => (v === undefined ? d : v);

const typesMap = {
    false: false,
    true: true,
    undefined: undefined,
    null: null,
};

type ValueType = string | number | typeof typesMap[keyof typeof typesMap];
type KeyValType = { [key: string]: ValueType };
type NestableValueType = ValueType | NestableValueType[] | { [key: string]: NestableValueType };
type NestedKeyValType = { [key: string]: NestableValueType };

const defaults = {
    jsonAsString: false,
    convertToJsonTree: false,
    parseNumber: false,
    parseBooleanNullUndefined: false,
};

interface Options {
    jsonAsString?: boolean,
    convertToJsonTree?: boolean,
    parseNumber?: boolean,
    parseBooleanNullUndefined?: boolean,
};

function isNumeric(value: string | number): boolean {
    return value != null && value !== '' && !isNaN(Number(value.toString()));
}

const propertiesToJSON = (str: string, options: Options = defaults): NestedKeyValType | string => {
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
        .reduce((obj: NestedKeyValType, line) => {
            // Replace only '=' that are not escaped with '\' to handle separator inside key
            const colonifiedLine = line.replace(/(?<!\\)=/, ':');
            const key = colonifiedLine
                // Extract key from index 0 to first not escaped colon index
                .substring(0, colonifiedLine.search(/(?<!\\):/))
                // Unescape Unicode
                .replace(/\\u([0-9A-F]{4})/g, (s, u) => String.fromCharCode(parseInt(u, 16)))
                // Remove not needed backslash from key
                .replace(/\\([^\\])/g, '$1')
                .replace(/\\\\/g, '\\')
                .trim();

            let value: ValueType = colonifiedLine
                .substring(colonifiedLine.search(/(?<!\\):/) + 1)
                // Unescape Unicode
                .replace(/\\u([0-9A-F]{4})/g, (s, u) => String.fromCharCode(parseInt(u, 16)))
                // Remove not needed backslash from key
                .replace(/\\([^\\])/g, '$1')
                .replace(/\\\\/g, '\\')
                .trim();

            if (parsedOptions.parseNumber && isNumeric(value)) {
                value = +value;
            } else if (parsedOptions.parseBooleanNullUndefined) {
                value = value in typesMap ? typesMap[value as keyof typeof typesMap] : value;
            }

            if (!parsedOptions.convertToJsonTree) {
                obj[key] = value;
                return obj;
            }

            const keys = key.split('.');
            return treeCreationRecursiveFn(keys, value, obj);
        }, {} as NestedKeyValType);

    if (parsedOptions.jsonAsString) return JSON.stringify(jsonObj);
    return jsonObj;
};

const regexG = /\[(\d+)\]/g;
const regex = /\[(\d+)\]/;

const treeCreationRecursiveFn = function (keys: string[], value: ValueType, result: object) {
    let key = keys[0];

    const indexs = key.match(regexG)?.map((x) => +x.match(regex)![1]);
    if (indexs) key = key.replace(regexG, '');

    if (keys.length === 1) {
        if (indexs) {
            result[key] = arrayRecursiveFn(indexs, value, result[key] || []);
        } else if (
            isPlainObject(result[key]) &&
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

        if (isPlainObject(result[key])) obj = result[key];
        else if (typeof result[key] === 'string' || typeof result[key] === 'number') {
            // conflicting case: a=b \n a.c=d then o/p will be a: { '': 'b', c: 'd' }

            obj = { '': result[key] };
            console.warn(`key missing for value ->`, result[key]);
            console.warn('The value will have empty string as a key');
        }
        if (indexs) {
            const index = indexs[0];
            if (!result[key]) {
                const val = treeCreationRecursiveFn(keys.slice(1), value, obj);
                result[key] = arrayRecursiveFn(indexs, val, result[key] || []);
            }
            else {
                result[key][index] = treeCreationRecursiveFn(keys.slice(1), value, result[key][index] || {});
            }

        } else result[key] = treeCreationRecursiveFn(keys.slice(1), value, obj);
    }
    return result;
};

const arrayRecursiveFn = function (indexes: number[], value: ValueType, result: object) {
    let index = indexes[0];
    if (indexes.length === 1) {

        const prevVal = result[index];

        if (prevVal && !isPlainObject(prevVal)) {
            console.warn('conflicting case occured in array creation one or more properties can be replaced');
        }
        if (isPlainObject(prevVal) && isPlainObject(value))
            result[index] = { ...prevVal, ...value };
        else if (isArray(prevVal) && isArray(value))
            result[index] = [...prevVal, ...value];
        else
            try {
                result[index] = value;
            } catch (e) {
                console.warn(e);
            }

    } else {
        let obj = result[index] || [];
        if (result[index] && typeof result[index] === 'string') {
            console.warn('conflicting case occured in array creation one or more properties can be replaced');
            obj = [];
        } else if (isPlainObject(result[index])) {
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

import { isPlainObject } from 'es-toolkit';

export interface Options {
    jsonAsString?: boolean;
    convertToJsonTree?: boolean;
    parseNumber?: boolean;
    parseBooleanNullUndefined?: boolean;
}

const defaultValue = <T>(v: T | undefined, d: T): T => (v === undefined ? d : v);

const typesMap = {
    false: false,
    true: true,
    undefined: undefined,
    null: null,
} as const;

type ValueType = string | number | boolean | null | undefined;
type NestableValueType = ValueType | NestableValueType[] | { [key: string]: NestableValueType };
type NestedKeyValType = { [key: string]: NestableValueType };

const defaults: Required<Options> = {
    jsonAsString: false,
    convertToJsonTree: false,
    parseNumber: false,
    parseBooleanNullUndefined: false,
};

function isNumeric(value: string | number): boolean {
    if (value === '') return false;
    const n = Number(value);
    return !isNaN(n) && isFinite(n);
}

const escapeMap: Record<string, string> = {
    t: '\t',
    n: '\n',
    r: '\r',
    f: '\f',
    '\\': '\\',
};

const unescape = (s: string): string =>
    s
        // Unescape Unicode sequences (case-insensitive hex digits)
        .replace(/\\u([0-9A-Fa-f]{4})/g, (_, u) => String.fromCharCode(parseInt(u, 16)))
        // Unescape named sequences (\t, \n, \r, \f, \\) then strip remaining backslashes
        .replace(/\\(.)/g, (_, c) => escapeMap[c] ?? c);

const propertiesToJSON = (str: string, options: Options = defaults): NestedKeyValType | string => {
    if (typeof str !== 'string') {
        throw new TypeError(`propertiesToJSON: expected a string, got ${typeof str}`);
    }

    const parsedOptions = {
        jsonAsString: defaultValue(options.jsonAsString, defaults.jsonAsString),
        convertToJsonTree: defaultValue(options.convertToJsonTree, defaults.convertToJsonTree),
        parseNumber: defaultValue(options.parseNumber, defaults.parseNumber),
        parseBooleanNullUndefined: defaultValue(options.parseBooleanNullUndefined, defaults.parseBooleanNullUndefined),
    };

    const jsonObj = str
        // Normalize line endings (CRLF and CR → LF)
        .replace(/\r\n/g, '\n').replace(/\r/g, '\n')
        // Concat lines that end with '\'
        .replace(/\\\n\s*/g, '')
        // Split by line breaks
        .split('\n')
        // Remove commented lines (starting with # or !) and empty lines
        .filter((line) => line && !/^\s*[#!]/.test(line))
        // Create the JSON
        .reduce((obj: NestedKeyValType, line) => {
            // Find the first unescaped = or : separator
            const sepIndex = line.search(/(?<!\\)[=:]/);
            if (sepIndex === -1) {
                obj[unescape(line.trim())] = '';
                return obj;
            }

            const key = unescape(line.substring(0, sepIndex).trim());
            let value: ValueType = unescape(line.substring(sepIndex + 1).trim());

            if (parsedOptions.parseNumber && isNumeric(value as string)) {
                value = +(value as string);
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

const treeCreationRecursiveFn = function (keys: string[], value: ValueType, result: NestedKeyValType): NestedKeyValType {
    let key = keys[0];

    const indexes = key.match(regexG)?.map((x) => +x.match(regex)![1]);
    if (indexes) key = key.replace(regexG, '');

    if (keys.length === 1) {
        if (indexes) {
            result[key] = arrayRecursiveFn(indexes, value, (result[key] as NestableValueType[]) || []);
        } else if (
            isPlainObject(result[key]) &&
            (typeof value === 'string' || typeof value === 'number')
        ) {
            console.warn(`key missing for value ->`, value);
            console.warn('The value will have empty string as a key');
            (result[key] as NestedKeyValType)[''] = value;
        } else {
            result[key] = value;
        }
    } else {
        let obj: NestedKeyValType = {};

        if (isPlainObject(result[key])) obj = result[key] as NestedKeyValType;
        else if (typeof result[key] === 'string' || typeof result[key] === 'number') {
            // conflicting case: a=b \n a.c=d then o/p will be a: { '': 'b', c: 'd' }
            obj = { '': result[key] as ValueType };
            console.warn(`key missing for value ->`, result[key]);
            console.warn('The value will have empty string as a key');
        }
        if (indexes) {
            const index = indexes[0];
            if (!result[key]) {
                const val = treeCreationRecursiveFn(keys.slice(1), value, obj);
                result[key] = arrayRecursiveFn(indexes, val, (result[key] as NestableValueType[]) || []);
            } else {
                (result[key] as NestedKeyValType[])[index] = treeCreationRecursiveFn(
                    keys.slice(1),
                    value,
                    ((result[key] as NestableValueType[])[index] as NestedKeyValType) || {}
                );
            }
        } else {
            result[key] = treeCreationRecursiveFn(keys.slice(1), value, obj);
        }
    }
    return result;
};

const arrayRecursiveFn = function (indexes: number[], value: NestableValueType, result: NestableValueType[]): NestableValueType[] {
    const index = indexes[0];
    if (indexes.length === 1) {
        const prevVal = result[index];

        if (prevVal !== undefined && !isPlainObject(prevVal)) {
            console.warn('conflicting case occurred in array creation one or more properties can be replaced');
        }
        if (isPlainObject(prevVal) && isPlainObject(value))
            result[index] = { ...prevVal, ...(value as NestedKeyValType) };
        else if (Array.isArray(prevVal) && Array.isArray(value))
            result[index] = [...prevVal, ...value];
        else
            try {
                result[index] = value;
            } catch (e) {
                console.warn(e);
            }
    } else {
        let obj = (result[index] as NestableValueType[]) || [];
        if (result[index] && typeof result[index] === 'string') {
            console.warn('conflicting case occurred in array creation one or more properties can be replaced');
            obj = [];
        } else if (isPlainObject(result[index])) {
            /**
             * o.a[1].b=we
             * o.a[1][2]=True
             */
            console.warn('conflicting case occurred as array is object key will be ""');
            obj = [];
            (result[index] as NestedKeyValType)[''] = arrayRecursiveFn(indexes.slice(1), value, obj);
        } else {
            result[index] = arrayRecursiveFn(indexes.slice(1), value, obj);
        }
    }
    return result;
};

export default propertiesToJSON;

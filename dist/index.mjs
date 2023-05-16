/** Detect free variable `global` from Node.js. */
var freeGlobal = typeof global == 'object' && global && global.Object === Object && global;

var freeGlobal$1 = freeGlobal;

/** Detect free variable `self`. */
var freeSelf = typeof self == 'object' && self && self.Object === Object && self;

/** Used as a reference to the global object. */
var root = freeGlobal$1 || freeSelf || Function('return this')();

var root$1 = root;

/** Built-in value references. */
var Symbol = root$1.Symbol;

var Symbol$1 = Symbol;

/** Used for built-in method references. */
var objectProto$2 = Object.prototype;

/** Used to check objects for own properties. */
var hasOwnProperty$1 = objectProto$2.hasOwnProperty;

/**
 * Used to resolve the
 * [`toStringTag`](http://ecma-international.org/ecma-262/7.0/#sec-object.prototype.tostring)
 * of values.
 */
var nativeObjectToString$1 = objectProto$2.toString;

/** Built-in value references. */
var symToStringTag$1 = Symbol$1 ? Symbol$1.toStringTag : undefined;

/**
 * A specialized version of `baseGetTag` which ignores `Symbol.toStringTag` values.
 *
 * @private
 * @param {*} value The value to query.
 * @returns {string} Returns the raw `toStringTag`.
 */
function getRawTag(value) {
  var isOwn = hasOwnProperty$1.call(value, symToStringTag$1),
      tag = value[symToStringTag$1];

  try {
    value[symToStringTag$1] = undefined;
    var unmasked = true;
  } catch (e) {}

  var result = nativeObjectToString$1.call(value);
  if (unmasked) {
    if (isOwn) {
      value[symToStringTag$1] = tag;
    } else {
      delete value[symToStringTag$1];
    }
  }
  return result;
}

/** Used for built-in method references. */
var objectProto$1 = Object.prototype;

/**
 * Used to resolve the
 * [`toStringTag`](http://ecma-international.org/ecma-262/7.0/#sec-object.prototype.tostring)
 * of values.
 */
var nativeObjectToString = objectProto$1.toString;

/**
 * Converts `value` to a string using `Object.prototype.toString`.
 *
 * @private
 * @param {*} value The value to convert.
 * @returns {string} Returns the converted string.
 */
function objectToString(value) {
  return nativeObjectToString.call(value);
}

/** `Object#toString` result references. */
var nullTag = '[object Null]',
    undefinedTag = '[object Undefined]';

/** Built-in value references. */
var symToStringTag = Symbol$1 ? Symbol$1.toStringTag : undefined;

/**
 * The base implementation of `getTag` without fallbacks for buggy environments.
 *
 * @private
 * @param {*} value The value to query.
 * @returns {string} Returns the `toStringTag`.
 */
function baseGetTag(value) {
  if (value == null) {
    return value === undefined ? undefinedTag : nullTag;
  }
  return (symToStringTag && symToStringTag in Object(value))
    ? getRawTag(value)
    : objectToString(value);
}

/**
 * Creates a unary function that invokes `func` with its argument transformed.
 *
 * @private
 * @param {Function} func The function to wrap.
 * @param {Function} transform The argument transform.
 * @returns {Function} Returns the new function.
 */
function overArg(func, transform) {
  return function(arg) {
    return func(transform(arg));
  };
}

/** Built-in value references. */
var getPrototype = overArg(Object.getPrototypeOf, Object);

var getPrototype$1 = getPrototype;

/**
 * Checks if `value` is object-like. A value is object-like if it's not `null`
 * and has a `typeof` result of "object".
 *
 * @static
 * @memberOf _
 * @since 4.0.0
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is object-like, else `false`.
 * @example
 *
 * _.isObjectLike({});
 * // => true
 *
 * _.isObjectLike([1, 2, 3]);
 * // => true
 *
 * _.isObjectLike(_.noop);
 * // => false
 *
 * _.isObjectLike(null);
 * // => false
 */
function isObjectLike(value) {
  return value != null && typeof value == 'object';
}

/** `Object#toString` result references. */
var objectTag = '[object Object]';

/** Used for built-in method references. */
var funcProto = Function.prototype,
    objectProto = Object.prototype;

/** Used to resolve the decompiled source of functions. */
var funcToString = funcProto.toString;

/** Used to check objects for own properties. */
var hasOwnProperty = objectProto.hasOwnProperty;

/** Used to infer the `Object` constructor. */
var objectCtorString = funcToString.call(Object);

/**
 * Checks if `value` is a plain object, that is, an object created by the
 * `Object` constructor or one with a `[[Prototype]]` of `null`.
 *
 * @static
 * @memberOf _
 * @since 0.8.0
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is a plain object, else `false`.
 * @example
 *
 * function Foo() {
 *   this.a = 1;
 * }
 *
 * _.isPlainObject(new Foo);
 * // => false
 *
 * _.isPlainObject([1, 2, 3]);
 * // => false
 *
 * _.isPlainObject({ 'x': 0, 'y': 0 });
 * // => true
 *
 * _.isPlainObject(Object.create(null));
 * // => true
 */
function isPlainObject(value) {
  if (!isObjectLike(value) || baseGetTag(value) != objectTag) {
    return false;
  }
  var proto = getPrototype$1(value);
  if (proto === null) {
    return true;
  }
  var Ctor = hasOwnProperty.call(proto, 'constructor') && proto.constructor;
  return typeof Ctor == 'function' && Ctor instanceof Ctor &&
    funcToString.call(Ctor) == objectCtorString;
}

/**
 * Checks if `value` is classified as an `Array` object.
 *
 * @static
 * @memberOf _
 * @since 0.1.0
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is an array, else `false`.
 * @example
 *
 * _.isArray([1, 2, 3]);
 * // => true
 *
 * _.isArray(document.body.children);
 * // => false
 *
 * _.isArray('abc');
 * // => false
 *
 * _.isArray(_.noop);
 * // => false
 */
var isArray = Array.isArray;

var isArray$1 = isArray;

// @ts-nocheck
const defaultValue = (v, d) => (v === undefined ? d : v);
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
function isNumeric(value) {
    return value != null && value !== '' && !isNaN(Number(value.toString()));
}
const propertiesToJSON = (str, options = defaults) => {
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
        let value = colonifiedLine.substring(colonifiedLine.search(/(?<!\\):/) + 1).trim();
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
        const keys = key.split('.');
        return treeCreationRecursiveFn(keys, value, obj);
    }, {});
    if (parsedOptions.jsonAsString)
        return JSON.stringify(jsonObj);
    return jsonObj;
};
const regexG = /\[(\d+)\]/g;
const regex = /\[(\d+)\]/;
const treeCreationRecursiveFn = function (keys, value, result) {
    let key = keys[0];
    const indexs = key.match(regexG)?.map((x) => +x.match(regex)[1]);
    if (indexs)
        key = key.replace(regexG, '');
    if (keys.length === 1) {
        if (indexs) {
            result[key] = arrayRecursiveFn(indexs, value, result[key] || []);
        }
        else if (isPlainObject(result[key]) &&
            (typeof value === 'string' || typeof value === 'number')) {
            console.warn(`key missing for value ->`, value);
            console.warn('The value will have empty string as a key');
            result[key][''] = value;
        }
        else {
            result[key] = value;
        }
    }
    else {
        let obj = {};
        if (isPlainObject(result[key]))
            obj = result[key];
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
        }
        else
            result[key] = treeCreationRecursiveFn(keys.slice(1), value, obj);
    }
    return result;
};
const arrayRecursiveFn = function (indexes, value, result) {
    let index = indexes[0];
    if (indexes.length === 1) {
        const prevVal = result[index];
        if (prevVal && !isPlainObject(prevVal)) {
            console.warn('conflicting case occured in array creation one or more properties can be replaced');
        }
        if (isPlainObject(prevVal) && isPlainObject(value))
            result[index] = { ...prevVal, ...value };
        else if (isArray$1(prevVal) && isArray$1(value))
            result[index] = [...prevVal, ...value];
        else
            try {
                result[index] = value;
            }
            catch (e) {
                console.warn(e);
            }
    }
    else {
        let obj = result[index] || [];
        if (result[index] && typeof result[index] === 'string') {
            console.warn('conflicting case occured in array creation one or more properties can be replaced');
            obj = [];
        }
        else if (isPlainObject(result[index])) {
            /**
             * o.a[1].b=we
                o.a[1][2]=True
             */
            console.warn('conflicting case occured as array is object key will be ""');
            obj = [];
            result[index][''] = arrayRecursiveFn(indexes.slice(1), value, obj);
        }
        else
            result[index] = arrayRecursiveFn(indexes.slice(1), value, obj);
    }
    return result;
};

export { propertiesToJSON as default };

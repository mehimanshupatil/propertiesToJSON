import { describe, it, expect } from 'vitest';
import propertiesToJSON, { type Options } from '../src/index';

// Satisfy the compiler that Options is used
const _: Options = {};

describe('basic parsing', () => {
    it('parses simple key=value', () => {
        expect(propertiesToJSON('a=b')).toEqual({ a: 'b' });
    });

    it('parses colon separator', () => {
        expect(propertiesToJSON('a:b')).toEqual({ a: 'b' });
    });

    it('parses colon separator with spaces', () => {
        expect(propertiesToJSON('a : b')).toEqual({ a: 'b' });
    });

    it('parses equals separator with spaces', () => {
        expect(propertiesToJSON('a = b')).toEqual({ a: 'b' });
    });

    it('preserves colons in values', () => {
        expect(propertiesToJSON('url=http://example.com')).toEqual({ url: 'http://example.com' });
    });

    it('preserves colons in values when colon is separator', () => {
        expect(propertiesToJSON('url:http://example.com')).toEqual({ url: 'http://example.com' });
    });

    it('handles empty value', () => {
        expect(propertiesToJSON('a=')).toEqual({ a: '' });
    });

    it('handles key with no separator as key with empty value', () => {
        expect(propertiesToJSON('a')).toEqual({ a: '' });
    });

    it('parses multiple entries', () => {
        expect(propertiesToJSON('a=1\nb=2')).toEqual({ a: '1', b: '2' });
    });
});

describe('comments and empty lines', () => {
    it('ignores # comment lines', () => {
        expect(propertiesToJSON('# comment\na=b')).toEqual({ a: 'b' });
    });

    it('ignores ! comment lines', () => {
        expect(propertiesToJSON('! comment\na=b')).toEqual({ a: 'b' });
    });

    it('ignores indented # comments', () => {
        expect(propertiesToJSON('  # comment\na=b')).toEqual({ a: 'b' });
    });

    it('ignores empty lines', () => {
        expect(propertiesToJSON('\na=b\n\nc=d')).toEqual({ a: 'b', c: 'd' });
    });
});

describe('line continuation', () => {
    it('joins lines ending with backslash', () => {
        expect(propertiesToJSON('a=hel\\\nlo')).toEqual({ a: 'hello' });
    });

    it('strips leading whitespace from continuation line', () => {
        expect(propertiesToJSON('a=hel\\\n   lo')).toEqual({ a: 'hello' });
    });
});

describe('line endings', () => {
    it('handles Windows CRLF', () => {
        expect(propertiesToJSON('a=b\r\nc=d')).toEqual({ a: 'b', c: 'd' });
    });

    it('handles old Mac CR-only', () => {
        expect(propertiesToJSON('a=b\rc=d')).toEqual({ a: 'b', c: 'd' });
    });
});

describe('unicode and escape sequences', () => {
    it('unescapes uppercase unicode (\\uXXXX)', () => {
        expect(propertiesToJSON('a=\\u0041')).toEqual({ a: 'A' });
    });

    it('unescapes lowercase unicode (\\uxxxx)', () => {
        expect(propertiesToJSON('a=\\u00e9')).toEqual({ a: 'é' });
    });

    it('unescapes mixed-case unicode', () => {
        expect(propertiesToJSON('a=\\u00E9')).toEqual({ a: 'é' });
    });

    it('unescapes \\t as tab', () => {
        expect(propertiesToJSON('a=hello\\tworld')).toEqual({ a: 'hello\tworld' });
    });

    it('unescapes \\n as newline', () => {
        expect(propertiesToJSON('a=hello\\nworld')).toEqual({ a: 'hello\nworld' });
    });

    it('unescapes \\r as carriage return', () => {
        expect(propertiesToJSON('a=hello\\rworld')).toEqual({ a: 'hello\rworld' });
    });

    it('unescapes \\f as form feed', () => {
        expect(propertiesToJSON('a=hello\\fworld')).toEqual({ a: 'hello\fworld' });
    });

    it('unescapes \\\\ as single backslash', () => {
        expect(propertiesToJSON('a=hello\\\\world')).toEqual({ a: 'hello\\world' });
    });

    it('unescapes escaped = in key', () => {
        expect(propertiesToJSON('a\\=b=value')).toEqual({ 'a=b': 'value' });
    });

    it('unescapes escaped : in key', () => {
        expect(propertiesToJSON('a\\:b=value')).toEqual({ 'a:b': 'value' });
    });

    it('handles unicode in key', () => {
        // \u006B = k, \u0065 = e, \u0079 = y
        expect(propertiesToJSON('\\u006B\\u0065\\u0079=value')).toEqual({ key: 'value' });
    });
});

describe('options.parseNumber', () => {
    it('converts integer strings to numbers', () => {
        expect(propertiesToJSON('a=42', { parseNumber: true })).toEqual({ a: 42 });
    });

    it('converts float strings to numbers', () => {
        expect(propertiesToJSON('a=3.14', { parseNumber: true })).toEqual({ a: 3.14 });
    });

    it('converts negative numbers', () => {
        expect(propertiesToJSON('a=-7', { parseNumber: true })).toEqual({ a: -7 });
    });

    it('does not convert NaN', () => {
        expect(propertiesToJSON('a=NaN', { parseNumber: true })).toEqual({ a: 'NaN' });
    });

    it('does not convert Infinity', () => {
        expect(propertiesToJSON('a=Infinity', { parseNumber: true })).toEqual({ a: 'Infinity' });
    });

    it('does not convert empty string', () => {
        expect(propertiesToJSON('a=', { parseNumber: true })).toEqual({ a: '' });
    });

    it('does not convert non-numeric strings', () => {
        expect(propertiesToJSON('a=hello', { parseNumber: true })).toEqual({ a: 'hello' });
    });
});

describe('options.parseBooleanNullUndefined', () => {
    it('converts "true" to boolean true', () => {
        expect(propertiesToJSON('a=true', { parseBooleanNullUndefined: true })).toEqual({ a: true });
    });

    it('converts "false" to boolean false', () => {
        expect(propertiesToJSON('a=false', { parseBooleanNullUndefined: true })).toEqual({ a: false });
    });

    it('converts "null" to null', () => {
        expect(propertiesToJSON('a=null', { parseBooleanNullUndefined: true })).toEqual({ a: null });
    });

    it('converts "undefined" to undefined', () => {
        expect(propertiesToJSON('a=undefined', { parseBooleanNullUndefined: true })).toEqual({ a: undefined });
    });

    it('is case-sensitive — "True" stays as string', () => {
        expect(propertiesToJSON('a=True', { parseBooleanNullUndefined: true })).toEqual({ a: 'True' });
    });

    it('is case-sensitive — "NULL" stays as string', () => {
        expect(propertiesToJSON('a=NULL', { parseBooleanNullUndefined: true })).toEqual({ a: 'NULL' });
    });
});

describe('options.jsonAsString', () => {
    it('returns result as a JSON string', () => {
        expect(propertiesToJSON('a=b', { jsonAsString: true })).toBe('{"a":"b"}');
    });
});

describe('options.convertToJsonTree', () => {
    it('converts dot notation to nested object', () => {
        expect(propertiesToJSON('a.b.c=d', { convertToJsonTree: true })).toEqual({
            a: { b: { c: 'd' } },
        });
    });

    it('merges sibling keys under same parent', () => {
        expect(propertiesToJSON('a.b=1\na.c=2', { convertToJsonTree: true })).toEqual({
            a: { b: '1', c: '2' },
        });
    });

    it('converts array notation', () => {
        expect(propertiesToJSON('a[0]=x\na[1]=y', { convertToJsonTree: true })).toEqual({
            a: ['x', 'y'],
        });
    });

    it('converts multi-dimensional arrays', () => {
        expect(propertiesToJSON('a[0][0]=x\na[0][1]=y', { convertToJsonTree: true })).toEqual({
            a: [['x', 'y']],
        });
    });

    it('combines dot and array notation', () => {
        expect(propertiesToJSON('a[0].b=x\na[0].c=y', { convertToJsonTree: true })).toEqual({
            a: [{ b: 'x', c: 'y' }],
        });
    });

    it('creates sparse arrays for non-contiguous indices', () => {
        const result = propertiesToJSON('a[0]=x\na[2]=z', { convertToJsonTree: true }) as Record<string, unknown[]>;
        expect(result.a[0]).toBe('x');
        expect(result.a[2]).toBe('z');
    });

    it('does not throw when array element is later used as an object (bug 1)', () => {
        // test[0]=haha sets an array element, then test[0].ohno=oops tries to nest inside it
        expect(() =>
            propertiesToJSON('test[0]=haha\ntest[0].ohno=oops', { convertToJsonTree: true })
        ).not.toThrow();
    });

    it('converts array element to object preserving primitive under "" when nested key follows (bug 1)', () => {
        const result = propertiesToJSON('test[0]=haha\ntest[0].ohno=oops', { convertToJsonTree: true }) as any;
        expect(result.test[0]['ohno']).toBe('oops');
        expect(result.test[0]['']).toBe('haha');
    });

    it('converts array to object preserving elements under numeric string keys when dot key follows (bug 2)', () => {
        // test[0]=haha sets an array, then test.ohno=oops should merge rather than discard the array
        const result = propertiesToJSON('test[0]=haha\ntest.ohno=oops', { convertToJsonTree: true }) as any;
        expect(result.test['0']).toBe('haha');
        expect(result.test['ohno']).toBe('oops');
    });
});

describe('input validation', () => {
    it('throws TypeError for null input', () => {
        expect(() => propertiesToJSON(null as unknown as string)).toThrow(TypeError);
    });

    it('throws TypeError for number input', () => {
        expect(() => propertiesToJSON(42 as unknown as string)).toThrow(TypeError);
    });

    it('throws TypeError for object input', () => {
        expect(() => propertiesToJSON({} as unknown as string)).toThrow(TypeError);
    });

    it('includes the received type in the error message', () => {
        expect(() => propertiesToJSON(null as unknown as string)).toThrow('got object');
    });
});

// Expected values below are the output of java.util.Properties.load (OpenJDK 17).
// Section numbers refer to docs/java-properties-format.md. Never derive an expected
// value from this parser's current output; run the input through Java instead.
describe('java.util.Properties conformance', () => {
    describe('§1 line terminators', () => {
        it('treats CR, LF and CRLF as line terminators', () => {
            expect(propertiesToJSON('a=1\r\nb=2\rc=3\n')).toEqual({ a: '1', b: '2', c: '3' });
        });
    });

    describe('§2 blank lines', () => {
        it('ignores whitespace-only lines', () => {
            expect(propertiesToJSON('a=1\n   \nb=2\n')).toEqual({ a: '1', b: '2' });
        });

        it('ignores lines of tabs and form feeds', () => {
            expect(propertiesToJSON('a=1\n\t\f \nb=2')).toEqual({ a: '1', b: '2' });
        });
    });

    describe('§3 comment lines', () => {
        it('does not continue a comment ending in backslash', () => {
            expect(propertiesToJSON('# see \\\nkey=value\n')).toEqual({ key: 'value' });
        });

        it('does not continue a ! comment ending in backslash', () => {
            expect(propertiesToJSON('! see \\\nkey=value')).toEqual({ key: 'value' });
        });

        it('keeps # inside a value', () => {
            expect(propertiesToJSON('k=a # b')).toEqual({ k: 'a # b' });
        });

        it('treats # on a continuation line as value text', () => {
            expect(propertiesToJSON('k=a\\\n# not comment')).toEqual({ k: 'a# not comment' });
        });
    });

    describe('§4 line continuation', () => {
        it('does not continue after an even number of backslashes', () => {
            expect(propertiesToJSON('dir=C:\\\\\nport=8080\n')).toEqual({ dir: 'C:\\', port: '8080' });
        });

        it('continues after an odd number of backslashes', () => {
            expect(propertiesToJSON('a=1\\\\\\\nb')).toEqual({ a: '1\\b' });
        });

        it('ends the logical line at an empty continuation line', () => {
            expect(propertiesToJSON('a=1\\\n\nb=2\n')).toEqual({ a: '1', b: '2' });
        });

        it('drops a backslash at end of input', () => {
            expect(propertiesToJSON('k=x\\')).toEqual({ k: 'x' });
        });

        it('joins the javadoc fruits example', () => {
            expect(propertiesToJSON('fruits                           apple, banana, pear, \\\n                                 cantaloupe, watermelon, \\\n                                 kiwi, mango')).toEqual({ fruits: 'apple, banana, pear, cantaloupe, watermelon, kiwi, mango' });
        });

        it('continues a key across lines', () => {
            expect(propertiesToJSON('ke\\\n  y=v')).toEqual({ key: 'v' });
        });

        it('treats # as a comment after a continuation that added nothing (JDK LineReader)', () => {
            expect(propertiesToJSON('\\\n# x\na=1')).toEqual({ a: '1' });
        });

        it('yields an empty key for a lone backslash line at end of input (JDK LineReader)', () => {
            expect(propertiesToJSON('a=1\n\\\n')).toEqual({ a: '1', '': '' });
        });
    });

    describe('§5 key', () => {
        it('treats \\\\ before = as an escaped backslash, not an escaped =', () => {
            expect(propertiesToJSON('dir\\\\=x\n')).toEqual({ 'dir\\': 'x' });
        });

        it('allows escaped : and = in a key', () => {
            expect(propertiesToJSON('\\:\\==x')).toEqual({ ':=': 'x' });
        });

        it('allows escaped spaces in a key', () => {
            expect(propertiesToJSON('key\\ with\\ space=v')).toEqual({ 'key with space': 'v' });
        });

        it('ignores trailing white space after a lone key', () => {
            expect(propertiesToJSON('cheeses   ')).toEqual({ cheeses: '' });
        });

        it('ignores leading tabs and form feeds before a key', () => {
            expect(propertiesToJSON('\t\f a=1')).toEqual({ a: '1' });
        });
    });

    describe('§6 separator', () => {
        it('uses a single space as separator', () => {
            expect(propertiesToJSON('fruits apple')).toEqual({ fruits: 'apple' });
        });

        it('uses runs of spaces as separator', () => {
            expect(propertiesToJSON('fruits   apple banana')).toEqual({ fruits: 'apple banana' });
        });

        it('uses a tab as separator', () => {
            expect(propertiesToJSON('fruits\tapple')).toEqual({ fruits: 'apple' });
        });

        it('skips spaces around =', () => {
            expect(propertiesToJSON('Truth = Beauty')).toEqual({ Truth: 'Beauty' });
        });

        it('skips spaces before :', () => {
            expect(propertiesToJSON('Truth                    :Beauty')).toEqual({ Truth: 'Beauty' });
        });

        it('consumes only one separator character', () => {
            expect(propertiesToJSON('k==v')).toEqual({ k: '=v' });
        });

        it('consumes only one separator character after spaces', () => {
            expect(propertiesToJSON('k = = v')).toEqual({ k: '= v' });
        });

        it('consumes only one separator character with mixed separators', () => {
            expect(propertiesToJSON('k :  = v')).toEqual({ k: '= v' });
        });
    });

    describe('§7 value', () => {
        it('keeps trailing spaces in a value', () => {
            expect(propertiesToJSON('greeting=hello   \n')).toEqual({ greeting: 'hello   ' });
        });

        it('keeps an escaped leading space in a value', () => {
            expect(propertiesToJSON('k=\\ lead')).toEqual({ k: ' lead' });
        });

        it('keeps = and : inside a value', () => {
            expect(propertiesToJSON('k=a=b:c')).toEqual({ k: 'a=b:c' });
        });
    });

    describe('§8 escape sequences', () => {
        it('drops the backslash before an unknown escape', () => {
            expect(propertiesToJSON('k=\\b\\z\\"')).toEqual({ k: 'bz"' });
        });

        it('does not read an escaped backslash as the start of a unicode escape', () => {
            expect(propertiesToJSON('k=\\\\u0041')).toEqual({ k: '\\u0041' });
        });

        // Java throws IllegalArgumentException for a malformed \uXXXX escape; we have not decided whether to match it.
        it.todo('handles a malformed \\u escape such as \\u00G1');
    });
});

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

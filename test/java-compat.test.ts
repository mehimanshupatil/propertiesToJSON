import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { spawnSync } from 'child_process';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { isDeepStrictEqual } from 'util';
import propertiesToJSON from '../src/index';

// Runs real java.util.Properties.load (via test/java/PropertiesToJson.java) on the same input
// and expects our output, with all options off, to be identical.
// Skipped when Java is not installed, unless REQUIRE_JAVA is set (as it is in CI).

const root = path.join(__dirname, '..');
const javaHelper = path.join(__dirname, 'java', 'PropertiesToJson.java');
const fixturesDir = path.join(__dirname, 'fixtures');

const hasJava = spawnSync('java', ['-version']).status === 0;
if (!hasJava && process.env.REQUIRE_JAVA) {
    throw new Error('REQUIRE_JAVA is set but `java` is not on the PATH');
}

type JavaOutput = { file: string; result?: Record<string, string>; error?: string };

const runJava = (...targets: string[]): JavaOutput[] => {
    const { status, stdout, stderr } = spawnSync('java', [javaHelper, ...targets], {
        encoding: 'utf-8',
        maxBuffer: 64 * 1024 * 1024,
    });
    if (status !== 0) throw new Error(`java exited with ${status}: ${stderr}`);
    return JSON.parse(stdout);
};

const readFile = (file: string) => fs.readFileSync(file, 'utf-8');

// Small seeded PRNG so a failing fuzz case can be reproduced
const mulberry32 = (seed: number) => () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};

// Tokens that exercise separators, white space, line terminators, comments and escapes.
// Only complete \uXXXX sequences are generated: Java throws on malformed ones (see the todo in index.test.ts).
const fuzzTokens = ['a', 'b', '=', ':', '\\', '\\', '\\', ' ', ' ', '\t', '\f', '\n', '\n', '\r', '\r\n', '#', '!', 't', 'n', 'u0041', 'é'];
const FUZZ_SEED = 17;
const FUZZ_CASES = 2000;

describe.skipIf(!hasJava)('matches java.util.Properties.load', () => {
    const fixtures = [
        path.join(root, 'sample.properties'),
        ...fs
            .readdirSync(fixturesDir)
            .filter((f) => f.endsWith('.properties'))
            .sort()
            .map((f) => path.join(fixturesDir, f)),
    ];

    describe('fixture files', () => {
        let javaResults: JavaOutput[];
        beforeAll(() => {
            javaResults = runJava(...fixtures);
        }, 30_000);

        it.each(fixtures.map((f) => [path.relative(root, f), f]))('%s', (_, file) => {
            const java = javaResults.find((r) => r.file === file)!;
            expect(java.error).toBeUndefined();
            expect(propertiesToJSON(readFile(file))).toEqual(java.result);
        });
    });

    describe(`${FUZZ_CASES} random inputs (seed ${FUZZ_SEED})`, () => {
        let dir: string;
        let inputs: string[];
        let javaResults: JavaOutput[];

        beforeAll(() => {
            const random = mulberry32(FUZZ_SEED);
            inputs = Array.from({ length: FUZZ_CASES }, () => {
                const length = 1 + Math.floor(random() * 24);
                return Array.from({ length }, () => fuzzTokens[Math.floor(random() * fuzzTokens.length)]).join('');
            });
            dir = fs.mkdtempSync(path.join(os.tmpdir(), 'properties-fuzz-'));
            inputs.forEach((input, i) => fs.writeFileSync(path.join(dir, `${String(i).padStart(5, '0')}.properties`), input));
            javaResults = runJava(dir);
        }, 60_000);

        afterAll(() => {
            if (dir) fs.rmSync(dir, { recursive: true, force: true });
        });

        it('produces the same object as Java for every input', () => {
            const mismatches = inputs
                .map((input, i) => ({ input, java: javaResults[i].result, ours: propertiesToJSON(input) }))
                .filter(({ java, ours }) => !isDeepStrictEqual(java, ours));
            expect(mismatches.slice(0, 5)).toEqual([]);
        });
    });
});

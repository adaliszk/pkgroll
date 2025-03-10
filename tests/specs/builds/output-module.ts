import { testSuite, expect } from 'manten';
import { createFixture } from 'fs-fixture';
import { pkgroll } from '../../utils';

export default testSuite(({ describe }, nodePath: string) => {
	describe('output: module', ({ test }) => {
		test('{ type: module, field: main, srcExt: js, distExt: js }', async () => {
			const fixture = await createFixture('./tests/fixture-package');

			await fixture.writeJson('package.json', {
				type: 'module',
				main: './dist/index.js',
			});

			const pkgrollProcess = await pkgroll([], { cwd: fixture.path, nodePath });

			expect(pkgrollProcess.exitCode).toBe(0);
			expect(pkgrollProcess.stderr).toBe('');

			const content = await fixture.readFile('dist/index.js', 'utf8');
			expect(content).toMatch('export { index as default }');

			await fixture.rm();
		});

		test('{ type: commonjs, field: main, srcExt: js, distExt: mjs }', async () => {
			const fixture = await createFixture('./tests/fixture-package');

			await fixture.writeJson('package.json', {
				main: './dist/index.mjs',
			});

			const pkgrollProcess = await pkgroll([], { cwd: fixture.path, nodePath });

			expect(pkgrollProcess.exitCode).toBe(0);
			expect(pkgrollProcess.stderr).toBe('');

			const content = await fixture.readFile('dist/index.mjs', 'utf8');
			expect(content).toMatch('export { index as default }');

			await fixture.rm();
		});

		test('{ type: commonjs, field: module, srcExt: js, distExt: js }', async () => {
			const fixture = await createFixture('./tests/fixture-package');

			await fixture.writeJson('package.json', {
				module: './dist/index.js',
			});

			const pkgrollProcess = await pkgroll([], { cwd: fixture.path, nodePath });

			expect(pkgrollProcess.exitCode).toBe(0);
			expect(pkgrollProcess.stderr).toBe('');

			const content = await fixture.readFile('dist/index.js', 'utf8');
			expect(content).toMatch('export { index as default }');

			await fixture.rm();
		});

		test('{ type: commonjs, field: main, srcExt: cjs, distExt: mjs }', async () => {
			const fixture = await createFixture('./tests/fixture-package');

			await fixture.writeJson('package.json', {
				main: './dist/cjs.mjs',
			});

			const pkgrollProcess = await pkgroll([], { cwd: fixture.path, nodePath });

			expect(pkgrollProcess.exitCode).toBe(0);
			expect(pkgrollProcess.stderr).toBe('');

			const content = await fixture.readFile('dist/cjs.mjs', 'utf8');
			expect(content).toMatch('export { cjs as default }');

			await fixture.rm();
		});

		test('{ type: commonjs, field: main, srcExt: mts, distExt: mjs }', async () => {
			const fixture = await createFixture('./tests/fixture-package');

			await fixture.writeJson('package.json', {
				main: './dist/mts.mjs',
			});

			const pkgrollProcess = await pkgroll([], { cwd: fixture.path, nodePath });

			expect(pkgrollProcess.exitCode).toBe(0);
			expect(pkgrollProcess.stderr).toBe('');

			const content = await fixture.readFile('dist/mts.mjs', 'utf8');
			expect(content).toMatch('export { foo, sayGoodbye, sayHello, sayHello$1 as sayHello2 }');

			await fixture.rm();
		});

		test('{ type: commonjs, field: main, srcExt: cts, distExt: mjs }', async () => {
			const fixture = await createFixture('./tests/fixture-package');

			await fixture.writeJson('package.json', {
				main: './dist/cts.mjs',
			});

			const pkgrollProcess = await pkgroll([], { cwd: fixture.path, nodePath });

			expect(pkgrollProcess.exitCode).toBe(0);
			expect(pkgrollProcess.stderr).toBe('');

			const content = await fixture.readFile('dist/cts.mjs', 'utf8');
			expect(content).toMatch('export { sayHello }');

			await fixture.rm();
		});

		test('{ type: module, field: main, srcExt: cts, distExt: js }', async () => {
			const fixture = await createFixture('./tests/fixture-package');

			await fixture.writeJson('package.json', {
				type: 'module',
				main: './dist/cts.js',
			});

			const pkgrollProcess = await pkgroll([], { cwd: fixture.path, nodePath });

			expect(pkgrollProcess.exitCode).toBe(0);
			expect(pkgrollProcess.stderr).toBe('');

			const content = await fixture.readFile('dist/cts.js', 'utf8');
			expect(content).toMatch('export { sayHello }');

			await fixture.rm();
		});

		test('require() works in esm', async () => {
			const fixture = await createFixture('./tests/fixture-package');

			await fixture.writeJson('package.json', {
				main: './dist/require.js',
				module: './dist/require.mjs',
			});

			const pkgrollProcess = await pkgroll(['--minify'], { cwd: fixture.path, nodePath });

			expect(pkgrollProcess.exitCode).toBe(0);
			expect(pkgrollProcess.stderr).toBe('');

			const js = await fixture.readFile('dist/require.js', 'utf8');
			expect(js).not.toMatch('createRequire');

			const mjs = await fixture.readFile('dist/require.mjs', 'utf8');
			expect(mjs).toMatch('createRequire');

			await fixture.rm();
		});

		test('conditional require() no side-effects', async () => {
			const fixture = await createFixture('./tests/fixture-package');

			await fixture.writeJson('package.json', {
				main: './dist/conditional-require.mjs',
			});

			const pkgrollProcess = await pkgroll([], { cwd: fixture.path, nodePath });

			expect(pkgrollProcess.exitCode).toBe(0);
			expect(pkgrollProcess.stderr).toBe('');

			const content = await fixture.readFile('dist/conditional-require.mjs', 'utf8');
			expect(content).toMatch('\tconsole.log(\'side effect\');');

			await fixture.rm();
		});

		test('require() & createRequire gets completely removed on conditional', async () => {
			const fixture = await createFixture('./tests/fixture-package');

			await fixture.writeJson('package.json', {
				main: './dist/conditional-require.mjs',
			});

			const pkgrollProcess = await pkgroll(['--env.NODE_ENV=development', '--minify'], { cwd: fixture.path, nodePath });

			expect(pkgrollProcess.exitCode).toBe(0);
			expect(pkgrollProcess.stderr).toBe('');

			const content = await fixture.readFile('dist/conditional-require.mjs', 'utf8');
			expect(content).not.toMatch('\tconsole.log(\'side effect\');');

			const [, createRequireMangledVariable] = content.toString().match(/createRequire as (\w+)/)!;
			expect(content).not.toMatch(`${createRequireMangledVariable}(`);

			await fixture.rm();
		});
	});
});

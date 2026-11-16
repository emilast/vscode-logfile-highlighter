// Bundles the extension into dist/extension.js. Type checking is done separately by `tsc --noEmit`.
//   node esbuild.js               development build, with source maps
//   node esbuild.js --production  minified build, with source maps not referenced from the bundle
//   node esbuild.js --watch       rebuilds on changes (see the problem matcher in .vscode/tasks.json)
const esbuild = require('esbuild');

const production = process.argv.includes('--production');
const watch = process.argv.includes('--watch');

/** Prints the start, end and errors of each build in a format the VS Code task problem matcher understands. */
const problemMatcherPlugin = {
    name: 'problem-matcher',
    setup(build) {
        build.onStart(() => {
            if (watch) {
                console.log('[watch] build started');
            }
        });
        build.onEnd(result => {
            for (const { text, location } of result.errors) {
                console.error(`✘ [ERROR] ${text}`);
                if (location) {
                    console.error(`    ${location.file}:${location.line}:${location.column}:`);
                }
            }
            if (watch) {
                console.log('[watch] build finished');
            }
        });
    }
};

async function main() {
    const ctx = await esbuild.context({
        entryPoints: ['src/extension.ts'],
        bundle: true,
        outfile: 'dist/extension.js',
        format: 'cjs',
        platform: 'node', // VS Code extensions run in a Node.js context
        target: 'node22',
        external: ['vscode'], // provided by VS Code at runtime
        minify: production,
        sourcemap: production ? 'external' : 'linked',
        sourcesContent: false,
        logLevel: 'silent',
        plugins: [problemMatcherPlugin]
    });

    if (watch) {
        await ctx.watch();
    } else {
        const result = await ctx.rebuild();
        await ctx.dispose();
        if (result.errors.length > 0) {
            process.exit(1);
        }
    }
}

main().catch(e => {
    // Build errors have already been printed by the problem matcher plugin
    if (!e.errors) {
        console.error(e);
    }
    process.exit(1);
});

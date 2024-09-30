import path from 'path';
import sourcemaps from 'rollup-plugin-sourcemaps';
import resolve from 'rollup-plugin-node-resolve';
import commonjs from 'rollup-plugin-commonjs';
import typescript from 'rollup-plugin-typescript';
import jscc from 'rollup-plugin-jscc';

export default function () {
    const plugins = [
        sourcemaps(),
        typescript(),
        resolve({
            browser: true,
            preferBuiltins: false,
        }),
        commonjs({ extensions: ['.js', '.ts'] }),
    ];
    return [{
        input: path.join(__dirname, 'src/index.ts'),
        output: {
            file: path.join(__dirname, "dist/particle-emitter.js"),
            format: 'iife',
            freeze: false,
            name: 'PIXI.particles',
            sourcemap: true,
            extend: true,
            globals: {
                '@pixi/core': 'PIXI',
                '@pixi/constants': 'PIXI',
                '@pixi/math': 'PIXI',
                '@pixi/sprite': 'PIXI',
                '@pixi/settings': 'PIXI',
                '@pixi/ticker': 'PIXI',
                '@pixi/display': 'PIXI',
            },
        },
        treeshake: false,
        external: [/@pixi\/.*/],
        plugins: [jscc({ values: { _IIFE: true } })].concat(plugins),
    }];
}

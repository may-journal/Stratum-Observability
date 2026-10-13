import { readdirSync, statSync } from 'node:fs';
import replace from '@rollup/plugin-replace';
import esbuild from 'rollup-plugin-esbuild';
import pkg from './package.json' with { type: 'json' };

const pluginPath = 'src/plugins';
const getPlugins = () => readdirSync(pluginPath).filter((f) => statSync(`${pluginPath}/${f}`).isDirectory());

export default {
  input: ['src/index.ts', ...getPlugins().map((p) => `${pluginPath}/${p}/index.ts`)],
  output: [
    {
      dir: `dist/cjs`,
      format: 'cjs',
      exports: 'auto',
      preserveModules: true,
      preserveModulesRoot: 'src'
    },
    {
      dir: `dist/esm`,
      format: 'es',
      preserveModules: true,
      preserveModulesRoot: 'src'
    }
  ],
  plugins: [
    replace({
      preventAssignment: true,
      __stratumLibraryVersion__: pkg.version
    }),
    esbuild({ target: 'esnext' })
  ]
};

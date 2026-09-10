import { cp, mkdir, rm, writeFile, chmod, realpath } from 'node:fs/promises';
import path from 'node:path';
const root = process.cwd();
const output = path.join(root, 'artifacts/deploy');
await rm(output, { recursive: true, force: true });
await mkdir(path.join(output, 'web'), { recursive: true });
await mkdir(path.join(output, 'assets/_next'), { recursive: true });
// Keep pnpm's relative links: Next resolves its traced dependencies from the
// package's real path inside node_modules/.pnpm. Dereferencing only the `next`
// link moves that package away from @swc/helpers and breaks Lambda startup.
await cp(path.join(root, 'apps/web/.next/standalone'), path.join(output, 'web'), { recursive: true, verbatimSymlinks: true, filter: source => !/(?:^|\/)\.env|(?:^|\/)\.data(?:\/|$)/.test(source) });

// CDK's asset bundler dereferences the standalone `next` link without carrying
// over pnpm's sibling dependency graph. Materialize Next's direct runtime
// dependencies inside the app so the Lambda zip is self-contained.
const runtimeDependencies = [
  '@next/env',
  '@swc/helpers',
  'baseline-browser-mapping',
  'caniuse-lite',
  'client-only',
  'postcss',
  'react',
  'react-dom',
  'scheduler',
  'styled-jsx',
];
const appNodeModules = path.join(root, 'apps/web/node_modules');
const packagedNodeModules = path.join(output, 'web/apps/web/node_modules');
for (const dependency of runtimeDependencies) {
  const source = await realpath(path.join(appNodeModules, dependency));
  const target = path.join(packagedNodeModules, dependency);
  await mkdir(path.dirname(target), { recursive: true });
  await rm(target, { recursive: true, force: true });
  await cp(source, target, { recursive: true, dereference: true });
}
await cp(path.join(root, 'apps/web/.next/static'), path.join(output, 'assets/_next/static'), { recursive: true });
await cp(path.join(root, 'apps/web/.next/static'), path.join(output, 'web/apps/web/.next/static'), { recursive: true });
await cp(path.join(root, 'apps/web/public'), path.join(output, 'assets'), { recursive: true });
await cp(path.join(root, 'apps/web/public'), path.join(output, 'web/apps/web/public'), { recursive: true });
await writeFile(path.join(output, 'web/run.sh'), '#!/bin/bash\nset -euo pipefail\ncd /var/task/apps/web\nexport HOSTNAME=0.0.0.0\nexec node server.js\n');
await chmod(path.join(output, 'web/run.sh'), 0o755);
console.log('Packaged standalone web server and immutable static assets.');

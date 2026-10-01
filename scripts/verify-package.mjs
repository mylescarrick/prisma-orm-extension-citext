// Checks the packed tarball, not the source tree: an exports-map mistake is invisible until someone
// installs the package. Run after `bun run build`.
import { execFileSync } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const pkg = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'));
const dir = mkdtempSync(join(tmpdir(), 'citext-pack-'));
const tarball = join(dir, 'package.tgz');

try {
  execFileSync('bun', ['pm', 'pack', '--quiet', '--filename', tarball], { stdio: 'ignore' });
  const files = new Set(
    execFileSync('tar', ['-tzf', tarball], { encoding: 'utf8' })
      .split('\n')
      .filter(Boolean)
      .map((f) => f.replace(/^package\//, '')),
  );

  const missing = [];
  for (const [subpath, target] of Object.entries(pkg.exports)) {
    const paths = typeof target === 'string' ? [target] : Object.values(target);
    for (const path of paths) {
      if (!files.has(path.replace(/^\.\//, ''))) missing.push(`${subpath} -> ${path}`);
    }
  }

  if (missing.length > 0) {
    console.error(`Export targets missing from the tarball:\n  ${missing.join('\n  ')}`);
    process.exit(1);
  }
  console.log(
    `ok: ${Object.keys(pkg.exports).length} exports resolve in ${files.size} packed files`,
  );
} finally {
  rmSync(dir, { recursive: true, force: true });
}

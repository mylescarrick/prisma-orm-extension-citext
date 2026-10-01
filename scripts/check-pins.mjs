// Prisma 8 extensions pin every @prisma/orm-* SPI package (all but @prisma/orm-extension-*) to one
// exact, shared version. A range lets an app resolve a different SPI version than this package was
// built against, and the SPI breaks between release candidates. Rule from the prisma-8 skill,
// references/upgrade-extension.md.
import { readFileSync } from 'node:fs';

const pkg = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'));
const pins = [];
for (const field of ['dependencies', 'peerDependencies', 'devDependencies', 'optionalDependencies']) {
  for (const [name, spec] of Object.entries(pkg[field] ?? {})) {
    if (name.startsWith('@prisma/orm-') && !name.startsWith('@prisma/orm-extension-')) {
      pins.push({ field, name, spec });
    }
  }
}

const versions = new Set(pins.map((p) => p.spec));
const inexact = pins.filter((p) => !/^\d+\.\d+\.\d+(-[\w.]+)?$/.test(p.spec));

if (inexact.length > 0 || versions.size !== 1) {
  for (const p of pins) console.error(`${p.field}: ${p.name}@${p.spec}`);
  console.error('\nEvery @prisma/orm-* SPI dependency must be the same exact version.');
  process.exit(1);
}
console.log(`ok: ${pins.length} SPI pins at ${[...versions][0]}`);

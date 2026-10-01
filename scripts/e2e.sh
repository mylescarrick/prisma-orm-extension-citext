#!/usr/bin/env bash
# End to end against a real, empty Postgres: build, pack, install the tarball into the fixture app,
# emit both contract doors, typecheck, migrate, and run the live round-trip.
#
# DATABASE_URL must point at an empty database created with C collation (initdb --locale=C), so
# plain text compares case-sensitively and only citext can make the checks pass.
set -euo pipefail

: "${DATABASE_URL:?set DATABASE_URL to an empty Postgres database}"
root="$(cd "$(dirname "$0")/.." && pwd)"

cd "$root"
bun run build
rm -f prisma-orm-extension-citext.tgz
bun pm pack --quiet --filename prisma-orm-extension-citext.tgz

cd "$root/e2e/fixture"
# No lockfile: it would pin a checksum for the tarball, which changes on every build.
rm -rf node_modules migrations migrations-ts bun.lock
bun install
bun run emit
bun run emit:ts
bun run typecheck
bun run plan
bun run migrate
bun run check

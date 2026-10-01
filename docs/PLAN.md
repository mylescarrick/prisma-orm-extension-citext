# Plan: Prisma 8 citext extension

Status: draft, 2026-10-01. Targets the Prisma 8 SPI at `8.0.0-rc.14`.

## Why

Prisma 8 has no `citext` support. The core Postgres target ships no `citext` codec, a contract
cannot declare a `citext` column, and the Prisma 7 bridge (`prisma7Schema`) rejects
`@db.Citext` with `PSL.PRISMA7_NATIVE_TYPE_UNSUPPORTED`. Prisma's own test ports record the gap
(`test/integration/test/ports/prisma/non-ported/functional/issues-21807-citext-neon`). Nobody has
published a Prisma 8 citext extension on npm yet.

## What it ships

Three of the four extension layers from the
[call for extension authors](https://www.prisma.io/blog/prisma-next-call-for-extension-authors):

| Layer | What |
| --- | --- |
| Contract | `citext()` column helper (TS builder) and a `citext.Citext()` PSL type constructor |
| Runtime | `citext/citext@1` codec: `string` in, `string` out, traits `equality`, `order`, `textual` |
| Migration | Contract space with a baseline migration running `CREATE EXTENSION IF NOT EXISTS citext` |

No query layer. Case-insensitivity is a property of the type, so the existing operators already do
the right thing, and the `textual` trait brings `ilike` and the full-text operations for free.

## Design decisions

1. **Package name `prisma-orm-extension-citext`**, unscoped, matching the community convention
   (`prisma-orm-extension-typed-json`, `prisma-orm-extension-zod-json`). The name is baked into
   every consumer's emitted `contract.d.ts` through the codec-types import, so renaming later
   breaks users.
2. **Codec id `citext/citext@1`, namespace `citext`, space id `citext`.** The `pg/` prefix belongs to
   the core target.
3. **Data type `citext/citext` castable from `pg/text`** (same shape as core `pg/varchar`), so a
   string `@default("...")` works. `renderValueLiteral` renders literals like `pg/text@1`.
4. **Parameters are cast to `::citext`.** The Postgres adapter casts params from the descriptor's
   native type (adapter test `postgres-codec-registry-composition.test.ts` renders
   `= $1::citext`). This is what keeps comparisons case-insensitive. A `::text` cast would silently
   make them case-sensitive, so the e2e suite must prove it for every operator.
5. **Exports** `./control`, `./runtime`, `./pack`, `./column-types`, `./codec-types`, each with
   `types` + `default` conditions (typed-json's export map, which ships `.d.mts`).
6. **SPI dependencies, all exact-pinned to the same version** (the exact-pin rule in the `prisma-8`
   skill, `references/upgrade-extension.md`):
   - `dependencies`: `@prisma/orm-framework`, `@prisma/orm-family-sql`, `@prisma/orm-toolchain`
     (for `contractSpaceFromJson`)
   - `peerDependencies`: `@prisma/orm-target-postgres`
7. **Tooling**: Bun for install and unit tests (`bun test`), tsdown for the build, Node 24 for the
   Prisma CLI and e2e (the Prisma packages declare `engines.node >=24`).

## Import map (in-repo `@internal/*` to published)

Prisma's reference extensions import `@internal/*` workspace packages. The published equivalents:

| In-repo | Published |
| --- | --- |
| `@internal/framework-components/codec` | `@prisma/orm-framework/components/codec` |
| `@internal/utils/structured-error` | `@prisma/orm-framework/utils/structured-error` |
| `@internal/contract/types` | `@prisma/orm-framework/contract/types` |
| `@internal/family-sql/control` | `@prisma/orm-family-sql/family/control` |
| `@internal/sql-runtime` | `@prisma/orm-family-sql/runtime` |
| `@internal/sql-relational-core/*` | `@prisma/orm-family-sql/relational-core/*` |
| `@internal/target-postgres/codec-descriptor` | `@prisma/orm-target-postgres/target/codec-descriptor` |
| `@internal/target-postgres/data-types` | `@prisma/orm-target-postgres/target/data-types` |
| `@internal/target-postgres/migration` | `@prisma/orm-target-postgres/target/migration` |
| `@internal/migration-tools/spaces` | `@prisma/orm-toolchain/migration-tools/spaces` |

## Layout

```text
src/
  contract.ts                 # contract space: registers the citext storage type, no tables
  contract.json / .d.ts       # emitted by `prisma contract emit`, committed
  core/
    constants.ts              # codec id, native type, space id, invariant ids
    data-types.ts             # citext/citext data type
    codecs.ts                 # CitextCodec, CitextDescriptor, citext() helper
    registry.ts
    authoring.ts              # PSL `citext.Citext` constructor
    pack-meta.ts
  exports/{control,runtime,pack,column-types,codec-types}.ts
migrations/
  20261001T0000_install_citext_extension/{migration.ts,migration.json,ops.json}
  refs/head.json
  snapshots/<hash>/contract.{json,d.ts}
prisma.config.ts              # package's own contract space config
test/                         # bun unit tests
e2e/fixture/                  # real Prisma 8 app linked to the package, PSL and TS doors
```

## Milestones

**M0, spike (half a day).** Install the rc.14 SPI, write codec + pack + control + runtime with no
contract space (typed-json's shape), emit a fixture contract through both PSL and TS.

Done. Findings:
- PSL needs the parentheses: `citext.Citext()`. Bare `citext.Citext` fails with
  `PSL_UNSUPPORTED_FIELD_TYPE`.
- The emitted contract is right: codec id, `citext` native type, a string `@default` through the
  `pg/text` cast, and `CitextTypes` imported into `contract.d.ts`.
- `prisma db init` fails without M1, because the `citext` type does not exist yet.
- The `prisma` CLI nests its own older `@prisma/orm-toolchain` (rc.10 inside `prisma@8.0.0-rc.14`,
  rc.13 inside rc.19), which rejects the rc.14 Postgres target with
  `CONTRACT.PACK_CONTRIBUTION_INVALID` before any extension loads. The fixture forces a single
  version with `overrides`. Worth reporting to Prisma.

**M1, contract space.** Package `contract.ts`, hand-authored baseline migration using
`this.installExtension({ extensionName: 'citext', invariantId: 'citext:install-citext-v1' })`,
regenerated with `node migration.ts`. Postgis does exactly this; the CLI refuses to plan it because
the contract has no tables. Proof: `prisma db init` on a fresh Postgres 17 creates the extension
and a table with a `citext` column.

Done. Findings:
- In the app, `prisma migration plan` copies the space into `migrations/citext/`, and
  `prisma db migrate` applies it before the app's tables. `db verify` is clean.
- bun installs a separate `arktype` copy per `@prisma/*` package. Prisma composes arktype schemas
  across packages, and mixed copies produce nonsense validation errors
  (`storage.types.citext.mutations must be an object`). Fix: `overrides: { "arktype": "2.2.6" }`.
  The README must tell bun users.
- Without an explicit `migrations.dir`, the fixture resolved `migrations/` to the outer repo root.
- `prisma migration ref set` only works in the app layout, so `migrations/refs/head.json` is written
  by hand in pgvector's format. The snapshot is a copy of `src/contract.{json,d.ts}`.
- The CLI's TS loader does not map `.js` imports to `.ts`, so `src/contract.ts` and
  `migration.ts` import `constants.ts` directly.

**M2, behaviour e2e.** Against Docker Postgres, through `db.orm` and `db.sql`:
- write `Foo@Example.com`, find it by `foo@example.com` (equality, `in`, `not`)
- `@unique` rejects a case-variant duplicate
- `contains` / `startsWith` / `endsWith` / `ilike` stay case-insensitive
- `orderBy` sorts case-insensitively
- `include` across a citext foreign key (Prisma 7 bug #14935)
- `distinct` collapses case variants (Prisma 7 bug #22342)
- `@default("...")` emits valid DDL

**M3, hardening.** Unit tests (codec round-trip, pack meta, helper output), a type test on the
emitted `contract.d.ts`, the pin check from the skill wired into CI, a tarball smoke test of every
export, GitHub Actions with a Postgres service.

**M4, release.** README, LICENSE, npm publish with provenance, submit to
https://www.prisma.io/extensions/submit, post in `#prisma-next` on Discord.

## Risks and open questions

- **The SPI is a release candidate.** Expect breaking changes on each rc bump; follow
  `references/upgrade-extension.md` one step per commit.
- **`citext[]` arrays are out of scope for v1.** citext has no fixed OID, so node-postgres returns
  arrays as raw `{a,b}` text (the same root cause as Prisma 7 bug #28349). Needs a list decoder.
- **`contract infer` probably will not map existing `citext` columns to this codec.** Unverified
  whether a pack can claim a native type during inference. Check in M2, file feedback if not.
- **`prisma7Schema` cannot be fixed from an extension.** The `@db.Citext` rejection lives in the
  core target's Prisma 7 type map. File a feature request.
- **Hosting.** citext is a trusted extension since PostgreSQL 13, so a non-superuser with `CREATE`
  on the database can install it. Confirm on Prisma Postgres, Neon, and Supabase before claiming
  support.
- **Schema placement.** `CREATE EXTENSION` installs into the first schema on `search_path`. Apps
  using non-`public` namespaces may not see the type (Prisma 7 bug #6944). Document it.

## Sources

- https://www.prisma.io/docs/orm/extensions
- https://www.prisma.io/blog/prisma-next-call-for-extension-authors
- `prisma-8` skill: `references/contract.md`, `references/upgrade-extension.md`
- prisma/orm @ `cd41f44`: `packages/3-extensions/{pgvector,postgis}`, `docs/reference/codec-authoring-guide.md`,
  ADR 153, ADR 208, ADR 212 (Contract spaces), ADR 254
- https://github.com/omar-dulaimi/prisma-orm-extension-typed-json (external packaging template)

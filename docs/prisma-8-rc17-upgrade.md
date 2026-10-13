# Upgrade from Prisma rc.14 to rc.17

Extension release `0.2.0` is for `@prisma/orm-*` `8.0.0-rc.17`. Its maintainers and packed consumer fixture use Prisma CLI `8.0.0-rc.22`. Release `0.1.0` remains the rc.14 line. Upgrade the runtime and extension together; do not mix their SPI versions or bypass the pin check.

The codec id `citext/citext@1`, data type id `citext/citext`, contract-space id `citext`, and install invariant are unchanged. Parameter casts still use `::citext`. This release registers SQL type names through `sqlDataType`, as required by the new framework.

## Fresh databases

Install the compatible package set and use the normal contract emit, migration plan and migration apply flow. The extension still installs PostgreSQL citext before a consuming table uses it. No special upgrade signing is needed for an empty database.

## Existing databases and migration histories

The framework changed the contract representation from `nativeType` to `dataType` and changed list cardinality metadata. This changes storage hashes even where PostgreSQL's columns are unchanged. Updating the package and re-emitting is not enough: old-format snapshots and refs must be translated, and database markers must be signed against a verified schema.

1. Commit or back up the application, snapshots, migration packages and refs. Check symlinks too: Prisma's translator follows them. Keep a database recovery point. Do not run this against production merely to test compatibility.
2. Install the matching extension/runtime/CLI versions and synchronise Prisma's bundled guidance:

   ```bash
   bunx prisma skills sync
   ```

3. Before re-emitting, run the upstream contract-format translator from the consuming application's root. The custom codec mapping is required:

   ```bash
   bun .agents/skills/prisma-8/upgrading/app/upgrades/8.0.0-rc.14-to-8.0.0-rc.15/scripts/data-type-in-contract/data-type-in-contract.ts \
     . --data-type citext/citext@1=citext/citext
   ```

   Review every file and hash change. The translator rewrites historical snapshot/ref/migration hash references as well as the emitted contract; it does not execute SQL. Do not hand-edit generated hashes or invent a new baseline over existing data.

4. With the application's explicitly owned database connection configured, run `bunx prisma db sign` **before** the next emit. Signing verifies the schema and updates all verified contract-space markers, including citext. If verification reports differences, stop: do not force a marker or assume the issue is only metadata. Checkmate uses `CHECKMATE_MIGRATION_DATABASE_URL`; other apps may use another variable.
5. Run `bunx prisma contract emit`. Review a formal migration plan from the translated graph tip. rc.16+ also adds foreign-key backing-index metadata, so an empty metadata migration can be necessary even when there is no DDL. Follow the planner's exact `migration new` next action in that case. Actual constraint/index changes need a reviewed migration, not signing over the differences.
6. Apply the reviewed migration, verify the database, and run the application's relevant integration/build checks. A successful emit proves the extension can be loaded; it does not prove an existing database has been upgraded.

Upstream transition instructions live in the synced Prisma skill, especially `contract-stores-data-type`, `foreign-keys-name-their-backing-index` and the migration-origin guidance. This procedure is not approval to modify a production database.

## Package verification

```bash
bun run check:pins
bun run format:check
bun run lint
bun run typecheck
bun run test
bun run build:contract-space
bun run build
bun run verify:package
```

The packed consumer fixture covers both PSL and TypeScript contract authoring and real PostgreSQL case-insensitive comparisons, unique constraints, foreign keys, joins, ordering and distinct-on. Run `DATABASE_URL=<owned empty C-collation database> bun run e2e`. Never point it at an application database containing data.

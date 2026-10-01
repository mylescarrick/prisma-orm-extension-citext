# prisma-orm-extension-citext

Case-insensitive text columns for [Prisma ORM 8](https://www.prisma.io/docs/orm), stored as
PostgreSQL [`citext`](https://www.postgresql.org/docs/current/citext.html).

`Alice@Example.com` and `alice@example.com` are the same value: equality, `in`, `like`, unique
constraints, foreign keys, ordering, `include` and `distinctOn` all ignore case, and every value
reads back exactly as it was written. The extension's migration runs
`CREATE EXTENSION IF NOT EXISTS citext` for you.

Prisma 8 has no citext support of its own. Built against Prisma `8.0.0-rc.14`.

## Install

```bash
npm install prisma-orm-extension-citext
```

### bun users: force a single arktype

bun installs a separate copy of `arktype` for each `@prisma/*` package, and Prisma's schema
validation breaks when copies mix, with errors such as
`storage.types.citext.mutations must be an object`. Add this to your `package.json`, then reinstall:

```json
{
  "overrides": { "arktype": "2.2.6" }
}
```

## Set up

Register the extension in two places.

`prisma.config.ts`:

```ts
import 'dotenv/config';
import { definePrismaConfig } from '@prisma/cli-engine';
import { defineConfig as ormConfig } from '@prisma/orm-postgres/config';
import citext from 'prisma-orm-extension-citext/control';

export default definePrismaConfig({
  orm: ormConfig({
    contract: './src/prisma/contract.prisma',
    extensions: [citext],
    migrations: { dir: './migrations' },
    db: { connection: process.env['DATABASE_URL']! },
  }),
});
```

`src/prisma/db.ts`:

```ts
import postgres from '@prisma/orm-postgres/runtime';
import citext from 'prisma-orm-extension-citext/runtime';
import type { Contract } from './contract.d';
import contractJson from './contract.json' with { type: 'json' };

export const db = postgres<Contract>({
  contractJson,
  url: process.env['DATABASE_URL']!,
  extensions: [citext],
});
```

## Declare citext columns

In PSL, use `citext.Citext()`. The parentheses are required.

```prisma
// use prisma-8

model User {
  id    Int             @id @default(autoincrement())
  email citext.Citext() @unique
  name  citext.Citext() @default("anonymous")
}
```

With the TypeScript contract builder, use the `citext()` column helper and register the pack:

```ts
import { defineContract } from '@prisma/orm-postgres/contract-builder';
import { citext } from 'prisma-orm-extension-citext/column-types';
import citextPack from 'prisma-orm-extension-citext/pack';

export const contract = defineContract(
  { extensions: { citext: citextPack } },
  ({ field, model }) => ({
    models: {
      User: model('User', {
        fields: {
          id: field.id.uuidv7String(),
          email: field.column(citext()).unique(),
        },
      }),
    },
  }),
);
```

## Apply

```bash
npx prisma contract emit
npx prisma migration plan --name add-citext   # copies this extension's migration into migrations/citext/
npx prisma db migrate                          # or db init on a new database
```

Commit `migrations/citext/` with your other migrations. Skip `migration plan` and the next command
stops with `MIGRATION.CONTRACT_SPACE_LAYOUT_VIOLATION`.

## Query

Citext columns are `string` in TypeScript and take every string operator:

```ts
await db.orm.public.User.create({ email: 'Alice@Example.com' });

const user = await db.orm.public.User.where({ email: 'alice@example.com' }).first();
user?.email; // 'Alice@Example.com', as written

await db.orm.public.User.where((u) => u.email.like('ALICE%')).all(); // case-insensitive
await db.orm.public.User.create({ email: 'ALICE@EXAMPLE.COM' }); // rejected by @unique
```

Every query parameter compared with a citext column is cast to `::citext`, which is what keeps the
comparison case-insensitive.

## Limits

- **Arrays (`citext[]`) are not supported yet.**
- **`prisma contract infer` writes existing citext columns as `Unsupported("citext")`**, even with
  the extension registered. Replace each one with `citext.Citext()` by hand.
- **`prisma7Schema` rejects `@db.Citext`** with `PSL.PRISMA7_NATIVE_TYPE_UNSUPPORTED`. That check
  lives in Prisma's Postgres target, so this extension cannot change it. Write a Prisma 8 contract.
- **The database role needs permission to create the extension.** citext is a trusted extension
  since PostgreSQL 13, so a role with `CREATE` on the database can install it without being a
  superuser.
- **`CREATE EXTENSION` installs into the first schema on `search_path`**, normally `public`. If your
  role's `search_path` does not include that schema, the `citext` type is not found.

## Development

```bash
bun install
bun run check:pins     # every @prisma/orm-* SPI package pinned to one exact version
bun run lint           # oxlint
bun run format:check   # oxfmt (bun run format to fix)
bun run typecheck
bun run test
bun run build && bun run verify:package
DATABASE_URL=postgresql://postgres:pg@localhost:5432/citext bun run e2e
```

The e2e needs an empty database created with C collation, so plain text compares case-sensitively
and only citext can pass:

```bash
docker run -d --name citext-pg -e POSTGRES_PASSWORD=pg -e POSTGRES_DB=citext \
  -e POSTGRES_INITDB_ARGS="--locale=C --encoding=UTF8" -p 5432:5432 postgres:17-alpine
```

### Changing the contract space

`src/contract.ts` registers the `citext` storage type for this package's own contract space. If it
changes:

1. `bun run build:contract-space` to re-emit `src/contract.{json,d.ts}`.
2. Update `to` in `migrations/<baseline>/migration.ts` and `hash` in `migrations/refs/head.json` to
   the new `storageHash`, copy the contract into `migrations/snapshots/<hash>/`, and run
   `node migrations/<baseline>/migration.ts`.
3. `bun run test`. The contract-space tests fail if any of these hashes disagree.

Never change the codec id, data type id, space id or invariant id after publishing. They are
recorded in every consumer's contract and migration history.

## License

MIT

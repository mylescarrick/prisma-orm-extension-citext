#!/usr/bin/env -S node
/**
 * Baseline migration for the citext contract space: installs the `citext` Postgres extension.
 *
 * Hand-authored. `prisma migration plan` refuses to scaffold it, because this space's contract has
 * no tables, only the `citext` storage type, which the planner does not turn into DDL. Running
 * `node migration.ts` re-emits `ops.json` and `migration.json` deterministically.
 *
 * `to` is the `storageHash` in `src/contract.json`. Re-emit the contract and update it if the
 * contract source ever changes. The invariant id is published and must never change.
 */
import { Migration, MigrationCLI } from '@prisma/orm-target-postgres/target/migration';
import { CITEXT_INVARIANTS } from '../../src/core/constants.ts';

export default class M extends Migration {
  override describe() {
    return {
      from: null,
      to: '69158a4e73384e0f0d3136de76d622629bd394a957da476646846811180fb094',
    };
  }

  override get operations() {
    return [
      this.installExtension({
        id: 'citext.install-citext-extension',
        extensionName: 'citext',
        invariantId: CITEXT_INVARIANTS.installCitext,
      }),
    ];
  }
}

MigrationCLI.run(import.meta.url, M);

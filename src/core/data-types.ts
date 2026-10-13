/**
 * The data type this extension owns.
 *
 * citext stores the same text Postgres `text` does, so it takes a `pg/text` value unchanged. That
 * cast is what lets a plain string default (`@default("x")`) reach a citext column, the same way the
 * core target lets one reach `varchar`. ADR 254.
 */

import type { JsonValue } from '@prisma/orm-framework/contract/types';
import { type SqlDataType, sqlDataType } from '@prisma/orm-family-sql/contract/data-type';
import { pgText } from '@prisma/orm-target-postgres/target/data-types';
import { CITEXT_DATA_TYPE_ID } from './constants.ts';

const unchanged = (value: JsonValue): JsonValue => value;

export const citextDataType = sqlDataType(CITEXT_DATA_TYPE_ID, {
  texts: [{ text: 'citext', written: true, catalog: true }],
  casts: { [pgText.id]: unchanged },
});

export const citextDataTypes: readonly SqlDataType[] = [citextDataType];

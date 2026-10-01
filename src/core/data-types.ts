/**
 * The data type this extension owns.
 *
 * citext stores the same text Postgres `text` does, so it takes a `pg/text` value unchanged. That
 * cast is what lets a plain string default (`@default("x")`) reach a citext column, the same way the
 * core target lets one reach `varchar`. ADR 254.
 */

import type { JsonValue } from '@prisma/orm-framework/contract/types';
import { type DataType, dataType } from '@prisma/orm-framework/components/codec';
import { pgText } from '@prisma/orm-target-postgres/target/data-types';
import { CITEXT_DATA_TYPE_ID } from './constants.js';

const unchanged = (value: JsonValue): JsonValue => value;

export const citextDataType: DataType = dataType(CITEXT_DATA_TYPE_ID, {
  casts: { [pgText.id]: unchanged },
});

export const citextDataTypes: readonly DataType[] = [citextDataType];

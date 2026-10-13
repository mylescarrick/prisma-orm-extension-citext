/**
 * The `citext/citext@1` codec.
 *
 * Values are strings in both directions and pass through untouched. Case-insensitivity is the
 * database's job, and it only does it when both sides of a comparison are citext. The descriptor's
 * SQL data type makes the Postgres adapter cast every parameter to `::citext`; a parameter
 * cast to `::text` would resolve to text equality and silently compare case-sensitively.
 *
 * The traits match core `pg/text@1`, so every string operation (`contains`, `startsWith`, `ilike`,
 * full-text search, ordering) works on a citext column.
 */

import type { JsonValue } from '@prisma/orm-framework/contract/types';
import type { ProjectionExpr } from '@prisma/orm-family-sql/relational-core/ast';
import {
  type CodecCallContext,
  CodecImpl,
  type CodecInstanceContext,
  type ColumnHelperFor,
  type ColumnHelperForStrict,
  column,
  decodeJsonString,
  renderTsLiteral,
} from '@prisma/orm-framework/components/codec';
import {
  PostgresCodecDescriptor,
  definePostgresCodecs,
} from '@prisma/orm-target-postgres/target/codec-descriptor';
import { CITEXT_CODEC_ID } from './constants.ts';
import { citextDataType } from './data-types.ts';

export class CitextCodec extends CodecImpl<
  typeof CITEXT_CODEC_ID,
  readonly ['equality', 'order', 'textual'],
  string,
  string
> {
  async encode(value: string, _ctx: CodecCallContext): Promise<string> {
    return value;
  }

  async decode(wire: string, _ctx: CodecCallContext): Promise<string> {
    return wire;
  }

  encodeJson(value: string): JsonValue {
    return value;
  }

  decodeJson(json: JsonValue): string {
    return decodeJsonString(CITEXT_CODEC_ID, json);
  }
}

export class CitextDescriptor extends PostgresCodecDescriptor<void> {
  /** A citext value inside a JSON constructor becomes a JSON string, which is what decodeJson reads. */
  protected override jsonProjection(expression: ProjectionExpr): ProjectionExpr {
    return expression;
  }

  override readonly dataType = citextDataType.id;
  override readonly codecId = CITEXT_CODEC_ID;
  override readonly traits = ['equality', 'order', 'textual'] as const;
  override readonly paramsSchema = undefined;

  override renderValueLiteral(value: JsonValue): string | undefined {
    return renderTsLiteral(value);
  }

  override factory(): (ctx: CodecInstanceContext) => CitextCodec {
    return () => new CitextCodec(this);
  }
}

export const citextDescriptor = new CitextDescriptor();

/** A case-insensitive text column. Stored as Postgres `citext`, read and written as `string`. */
export const citext = () => column(citextDescriptor.factory(), citextDescriptor.codecId, undefined);

citext satisfies ColumnHelperFor<CitextDescriptor>;
citext satisfies ColumnHelperForStrict<CitextDescriptor>;

export const codecDescriptors = definePostgresCodecs([citextDescriptor]);

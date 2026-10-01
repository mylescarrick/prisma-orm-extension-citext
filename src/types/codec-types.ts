/**
 * Type-only codec map. Consumers' emitted `contract.d.ts` imports it from
 * `prisma-orm-extension-citext/codec-types` to type citext columns as `string`.
 */

export type CodecTypes = {
  readonly 'citext/citext@1': {
    readonly input: string;
    readonly output: string;
    readonly traits: 'equality' | 'order' | 'textual';
  };
};

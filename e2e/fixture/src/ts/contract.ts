import { defineContract } from '@prisma/orm-postgres/contract-builder';
import { citext } from 'prisma-orm-extension-citext/column-types';
import citextPack from 'prisma-orm-extension-citext/pack';

export const contract = defineContract(
  { extensions: { citext: citextPack } },
  ({ field, model }) => ({
    models: {
      Account: model('Account', {
        fields: {
          id: field.id.uuidv7String(),
          email: field.column(citext()).unique(),
          handle: field.column(citext()).default('anonymous'),
        },
      }),
    },
  }),
);

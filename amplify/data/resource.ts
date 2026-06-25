import { type ClientSchema, a, defineData } from '@aws-amplify/backend';

/**
 * Integrantes del equipo Gallitos + GHIN (USGA).
 * Solo usuarios autenticados (Cognito) pueden leer y editar.
 */
const schema = a.schema({
  Member: a
    .model({
      firstName: a.string().required(),
      lastName: a.string().required(),
      email: a.email(),
      phone: a.string(),
      /** Número GHIN (Golf Handicap Information Network) */
      ghin: a.string().required(),
      notes: a.string(),
      isActive: a.boolean().default(true),
      isApproved: a.boolean().default(false),
      role: a.string().default('PLAYER'), // 'ADMIN' or 'PLAYER'
    })
    .authorization((allow) => [allow.authenticated()]),

  /** Registro público de integrantes (formulario móvil). */
  Participant: a
    .model({
      firstName: a.string().required(),
      paternalLastName: a.string().required(),
      maternalLastName: a.string().required(),
      /** Número GHIN (Golf Handicap Information Network), 7 dígitos */
      ghin: a.string().required(),
      /** Handicap Index USGA (ej. 12.4 o +1.3 para plus-handicap) */
      handicapIndex: a.string().required(),
      phone: a.string().required(),
      email: a.email().required(),
    })
    .authorization((allow) => [
      allow.publicApiKey().to(['create']),
      allow.authenticated().to(['read', 'create', 'update', 'delete']),
    ]),
});

export type Schema = ClientSchema<typeof schema>;

export const data = defineData({
  schema,
  authorizationModes: {
    defaultAuthorizationMode: 'userPool',
    apiKeyAuthorizationMode: { expiresInDays: 365 },
  },
});

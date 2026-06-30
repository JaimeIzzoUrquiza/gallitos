import { type ClientSchema, a, defineData, defineFunction } from '@aws-amplify/backend';

const registerParticipantHandler = defineFunction({
  name: 'register-participant',
  entry: './register-participant/handler.ts',
  resourceGroupName: 'data',
  timeoutSeconds: 30,
  environment: {
    FROM_EMAIL: 'gallitos@jidevs.com',
    FROM_NAME: 'Gallitos',
    PARTICIPANT_TABLE_NAME: '',
    LOGO_URL: '',
  },
});

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
    .authorization((allow) => [allow.authenticated().to(['read', 'create', 'update', 'delete'])]),

  /** Registro público con confirmación por correo. */
  registerParticipant: a
    .mutation()
    .arguments({
      firstName: a.string().required(),
      paternalLastName: a.string().required(),
      maternalLastName: a.string().required(),
      ghin: a.string().required(),
      handicapIndex: a.string().required(),
      phone: a.string().required(),
      email: a.email().required(),
    })
    .returns(a.ref('Participant'))
    .authorization((allow) => [allow.publicApiKey()])
    .handler(a.handler.function(registerParticipantHandler)),
});

export type Schema = ClientSchema<typeof schema>;

export const data = defineData({
  schema,
  authorizationModes: {
    defaultAuthorizationMode: 'userPool',
    apiKeyAuthorizationMode: { expiresInDays: 365 },
  },
});

export { registerParticipantHandler };

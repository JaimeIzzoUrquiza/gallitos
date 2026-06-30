import { defineBackend } from '@aws-amplify/backend';
import { PolicyStatement } from 'aws-cdk-lib/aws-iam';
import { Function as LambdaFunction } from 'aws-cdk-lib/aws-lambda';
import { auth } from './auth/resource';
import { data, registerParticipantHandler } from './data/resource';

/**
 * URL pública del frontend (sin barra final). Se usa para mostrar logo.png en correos.
 * Actualiza este valor con tu dominio de Amplify Hosting en producción.
 */
const APP_BASE_URL = process.env.GALLITOS_APP_URL ?? '';

const backend = defineBackend({
  auth,
  data,
  registerParticipantHandler,
});

// Cognito validates the exact SES identity ARN it sends from. We verified the
// DOMAIN (jidevs.com) via DKIM, not the individual address, so we point the
// SourceArn at the domain identity. Without this, Cognito fails with
// "Email address is not verified" (see amplify-backend issue #3134).
const { cfnUserPool } = backend.auth.resources.cfnResources;
cfnUserPool.addPropertyOverride(
  'EmailConfiguration.SourceArn',
  'arn:aws:ses:us-east-1:794098635886:identity/jidevs.com',
);

const participantTable = backend.data.resources.tables['Participant'];
const registerFn = backend.registerParticipantHandler.resources.lambda as LambdaFunction;

participantTable.grantWriteData(registerFn);
registerFn.addEnvironment('PARTICIPANT_TABLE_NAME', participantTable.tableName);
registerFn.addEnvironment('LOGO_URL', APP_BASE_URL ? `${APP_BASE_URL.replace(/\/$/, '')}/logo.png` : '');

registerFn.addToRolePolicy(
  new PolicyStatement({
    actions: ['ses:SendEmail', 'ses:SendRawEmail'],
    resources: ['*'],
  }),
);

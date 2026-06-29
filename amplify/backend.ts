import { defineBackend } from '@aws-amplify/backend';
import { auth } from './auth/resource';
import { data } from './data/resource';

/**
 * @see https://docs.amplify.aws/react/build-a-backend/ to add storage, functions, and more
 */
const backend = defineBackend({
  auth,
  data,
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

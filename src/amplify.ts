import { Amplify } from 'aws-amplify';
import outputs from '../amplify_outputs.json';

function hasValidOutputs(value: unknown): boolean {
  if (!value || typeof value !== 'object') return false;
  const auth = (value as { auth?: Record<string, unknown> }).auth;
  if (!auth || typeof auth !== 'object') return false;
  const pool = auth.user_pool_id;
  const region = auth.aws_region;
  return (
    typeof pool === 'string' &&
    pool.length > 0 &&
    typeof region === 'string' &&
    region.length > 0
  );
}

export const amplifyReady = hasValidOutputs(outputs);

if (amplifyReady) {
  Amplify.configure(outputs);
}

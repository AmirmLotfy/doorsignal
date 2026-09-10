import { SecretsManagerClient, GetSecretValueCommand, PutSecretValueCommand } from '@aws-sdk/client-secrets-manager';
import { randomBytes } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

export type Configuration = {
  signingKey: string; ringAccessToken?: string; ringExpiresAt?: number; ringAccountId?: string;
  ringWebhookSecret?: string; integrationKeyHash?: string; notificationEmail?: string;
};
const client = new SecretsManagerClient({ region: process.env.AWS_REGION || 'us-east-1', maxAttempts: 2 });
let cached: { value: Configuration; until: number } | undefined;
function localPath() { return path.resolve(process.env.DOORSIGNAL_CONFIG_FILE || '.data/config.json'); }
export async function config(): Promise<Configuration> {
  if (cached && cached.until > Date.now()) return cached.value;
  let value: Configuration;
  if (process.env.DOORSIGNAL_SECRET_ARN) {
    const result = await client.send(new GetSecretValueCommand({ SecretId: process.env.DOORSIGNAL_SECRET_ARN }));
    value = JSON.parse(result.SecretString || '{}');
  } else {
    if (process.env.AWS_LAMBDA_FUNCTION_NAME) throw new Error('Secret configuration is required.');
    const filename = localPath();
    await mkdir(path.dirname(filename), { recursive: true });
    try { value = JSON.parse(await readFile(filename, 'utf8')); }
    catch (error) {
      if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error;
      value = { signingKey: randomBytes(32).toString('hex') };
      try { await writeFile(filename, JSON.stringify(value), { flag: 'wx', mode: 0o600 }); }
      catch (error) { if ((error as NodeJS.ErrnoException).code !== 'EEXIST') throw error; value = JSON.parse(await readFile(filename, 'utf8')); }
    }
  }
  if (!value.signingKey || value.signingKey.length < 32) throw new Error('A strong signing key is required.');
  cached = { value, until: Date.now() + 15000 };
  return value;
}
export async function saveConfiguration(patch: Partial<Configuration>) {
  const value = { ...await config(), ...patch };
  if (process.env.DOORSIGNAL_SECRET_ARN) await client.send(new PutSecretValueCommand({ SecretId: process.env.DOORSIGNAL_SECRET_ARN, SecretString: JSON.stringify(value) }));
  else await writeFile(localPath(), JSON.stringify(value), { mode: 0o600 });
  cached = undefined;
}

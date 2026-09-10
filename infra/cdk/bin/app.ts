import { App } from 'aws-cdk-lib';
import { DoorSignalStack } from '../lib/doorsignal-stack';
const app = new App();
new DoorSignalStack(app, 'DoorSignalStack', {
  description: 'Isolated DoorSignal Ring hackathon application',
  env: { account: process.env.CDK_DEFAULT_ACCOUNT, region: 'us-east-1' },
  terminationProtection: true,
});

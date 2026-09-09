#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { DoorSignalStack } from '../lib/doorsignal-stack';

const app = new cdk.App();
new DoorSignalStack(app, 'DoorSignalStack', {
  description: 'DoorSignal AWS Infrastructure: EventBridge, Lambda, DynamoDB, and API Gateway',
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION || 'us-east-1'
  }
});

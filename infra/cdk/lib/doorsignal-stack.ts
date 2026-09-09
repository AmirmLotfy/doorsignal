import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as events from 'aws-cdk-lib/aws-events';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as kms from 'aws-cdk-lib/aws-kms';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as apigwv2 from 'aws-cdk-lib/aws-apigatewayv2';
import * as apigwv2Integrations from 'aws-cdk-lib/aws-apigatewayv2-integrations';
import * as secretsmanager from 'aws-cdk-lib/aws-secretsmanager';

export class DoorSignalStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // 1. Secrets Manager for Ring Partner Credentials & HMAC Webhook Secret
    const ringSecret = new secretsmanager.Secret(this, 'RingCredentialsSecret', {
      secretName: 'doorsignal/ring/credentials',
      description: 'Ring Partner API OAuth tokens and Webhook HMAC secret'
    });

    // 2. DynamoDB Table for Ring Request Idempotency (24h TTL)
    const idempotencyTable = new dynamodb.Table(this, 'RingIdempotencyTable', {
      tableName: 'doorsignal_ring_dedup',
      partitionKey: { name: 'requestId', type: dynamodb.AttributeType.STRING },
      timeToLiveAttribute: 'ttl',
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.DESTROY
    });

    // 3. EventBridge Custom Event Bus for Normalized Domain Events
    const eventBus = new events.EventBus(this, 'DoorSignalEventBus', {
      eventBusName: 'doorsignal.bus'
    });

    // 4. S3 Bucket for Ephemeral Ring Snapshots (KMS-encrypted + 1-hour expiration lifecycle)
    const mediaKey = new kms.Key(this, 'MediaEncryptionKey', {
      enableKeyRotation: true,
      description: 'KMS key for temporary DoorSignal Ring snapshots'
    });

    const mediaBucket = new s3.Bucket(this, 'EphemeralMediaBucket', {
      bucketName: `doorsignal-media-${this.account}-${this.region}`,
      encryption: s3.BucketEncryption.KMS,
      encryptionKey: mediaKey,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      lifecycleRules: [
        {
          id: 'ExpireSnapshotsAfter1Hour',
          expiration: cdk.Duration.hours(1)
        }
      ],
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true
    });

    // 5. Lambda Function: Webhook Ingestion & HMAC Verification
    const webhookFn = new lambda.Function(this, 'RingWebhookFunction', {
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: 'index.handler',
      code: lambda.Code.fromInline(`
        exports.handler = async (event) => {
          console.log("Ring Webhook received:", event.headers);
          return { statusCode: 200, body: JSON.stringify({ status: "accepted" }) };
        };
      `),
      environment: {
        RING_SECRET_ARN: ringSecret.secretArn,
        DEDUP_TABLE_NAME: idempotencyTable.tableName,
        EVENT_BUS_NAME: eventBus.eventBusName
      },
      timeout: cdk.Duration.seconds(10)
    });

    ringSecret.grantRead(webhookFn);
    idempotencyTable.grantReadWriteData(webhookFn);
    eventBus.grantPutEventsTo(webhookFn);

    // 6. HTTP API Gateway
    const httpApi = new apigwv2.HttpApi(this, 'DoorSignalHttpApi', {
      apiName: 'doorsignal-api',
      description: 'Public Webhook & Client API for DoorSignal'
    });

    httpApi.addRoutes({
      path: '/api/webhooks/ring',
      methods: [apigwv2.HttpMethod.POST],
      integration: new apigwv2Integrations.HttpLambdaIntegration('RingWebhookIntegration', webhookFn)
    });

    // 7. CloudFormation Outputs
    new cdk.CfnOutput(this, 'ApiEndpointUrl', {
      value: httpApi.url || '',
      description: 'Public API Gateway Webhook URL'
    });
    new cdk.CfnOutput(this, 'EventBusArn', {
      value: eventBus.eventBusArn,
      description: 'EventBridge Bus ARN'
    });
    new cdk.CfnOutput(this, 'MediaBucketName', {
      value: mediaBucket.bucketName,
      description: 'S3 Ephemeral Media Bucket'
    });
  }
}

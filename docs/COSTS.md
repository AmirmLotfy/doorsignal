# AWS cost envelope

Estimate prepared before the first deployment on September 10, 2026. Region: `us-east-1`. Review end: November 20, 2026.

The active deployment uses Lambda, HTTP API Gateway, DynamoDB on-demand, EventBridge, SQS, Cognito, Secrets Manager, CloudWatch, SES, and Bedrock Nova 2 Lite. It creates no VPC, NAT gateway, database server, provisioned capacity, or always-on compute. The optional CloudFront/private-S3 mode is disabled in the submitted account.

## Bounded demo assumption

- 5,000 application API requests per day, with API Gateway throttled to 5 requests per second and burst 10.
- At most 200 accepted door events per site per day.
- At most 20 Bedrock calls per day and 200 total for this submission. Each request explicitly limits output to 128 tokens.
- At most 30 email attempts per day. The public judge demo sends no external email.
- The account's verified regional Lambda quota is 10 concurrent executions. API and application limits keep this demo well below it; per-function reservations are omitted because AWS requires the entire quota to remain in the unreserved pool at this account size.
- Operational records and logs expire after seven days; isolated judge records expire after one day.

At these limits, expected incremental spend is below **USD 5 through November 20**. Secrets Manager and low-volume CloudWatch storage are the most predictable non-zero items; Lambda, API Gateway, DynamoDB, SQS, EventBridge, Cognito, SES, and Bedrock remain low at demo volume and may fall within account free allowances. The estimate excludes unrelated AWS projects in the account.

This is an estimate rather than a hard cap. AWS billing data and budget notifications can lag. Application limits, the regional Lambda quota, DynamoDB maximum request units, API throttling, seven-day retention, and the absence of always-on infrastructure constrain exposure.

## Controls

- Cost allocation tag `Project=DoorSignal` was activated before deployment.
- A custom gross-cost budget covers September 10 through November 20, 2026. Credits and refunds are excluded from the calculation so consumed credits do not hide usage.
- Actual-spend alerts fire at USD 25 and USD 40 through SNS and remain visible in the dedicated alert queue. A user email subscription is added only to an address the submitter explicitly approves.
- The USD 50 ceiling preserves headroom above application estimates; it is not represented as an AWS-enforced shutdown.

## Live spend snapshot

At September 10, 2026 14:08 EEST, the dedicated AWS Budget reported **USD 0.022** actual gross spend against the USD 50 limit, with no forecast available yet. Both DoorSignal CloudWatch alarms were `OK`, and the processing dead-letter and alert queues were empty. AWS billing and budget data can lag.

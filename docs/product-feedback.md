# Developer tools feedback

This document supplies evidence-based draft answers for the five required Devpost feedback questions. Final wording will include live Ring playground and deployed endpoint evidence collected before submission.

## 1. Which tools, APIs, and SDKs did you use, and for what?

- Ring API at `api.amazonvision.com`: account and device discovery, event history import, raw-byte signed webhooks, image retrieval for transient analysis, and receive-only WHEP session lifecycle.
- AWS SDK for JavaScript v3: DynamoDB, Secrets Manager, Bedrock Runtime Converse, SES v2, and EventBridge operations.
- Amazon Nova 2 Lite through Bedrock Converse: bounded coarse scene booleans only.
- DynamoDB and DynamoDB Streams: durable records, optimistic transitions, deduplication, TTL, and the processing handoff.
- EventBridge, Lambda, and SQS: worker routing, retries, batch failure handling, and dead letters.
- SES: host email attempts to an explicitly configured recipient.
- Cognito: operator authentication and group authorization.
- API Gateway and Lambda Web Adapter: hosting the standalone Next.js application and its packaged static assets at the custom domain.
- CDK for TypeScript: reproducible infrastructure, IAM, logging, alarms, tags, throttles, and the submission budget.
- Next.js 16, React 19, TypeScript, Zod, Vitest, and `qrcode`: the web product, validation, contract tests, and printable visitor check-in.

## 2. What worked well?

Ring's server-side API separates device discovery, history, webhooks, images, and WHEP cleanly enough to build a least-privilege adapter. The official playground makes it possible to demonstrate the path without exposing a household account. DynamoDB transactions and Streams fit the accept-before-acknowledge requirement well. EventBridge and Lambda provide a compact retryable pipeline without always-on infrastructure. Bedrock Converse gives one consistent request shape and returns token usage, which helps enforce a small demo budget. CDK makes IAM and cost controls reviewable in the same repository as the application.

## 3. What needs work?

Ring would benefit from an official TypeScript SDK, raw-body webhook verifier, fuller JSON:API relationship examples, explicit playground token expiry metadata, and structured WHEP cleanup identifiers. AWS should align the CDK/CloudFormation type for Budget custom dates with the epoch format accepted at deployment. SES could expose sandbox, identity, recipient, and production-access readiness as one guided status. See the [observed friction log](friction-log.md) for reproduction steps and workarounds.

## 4. How was onboarding from zero to hello world?

Local Next.js and AWS SDK setup was straightforward. The first end-to-end Ring-shaped event required more care: the receiver must preserve exact bytes, verify the header before JSON parsing, and then map v1.1 fields into application records. AWS infrastructure synthesized quickly, while the first deployment exposed a Budget date-format mismatch that was not apparent at type-check time. The project therefore separates implemented, locally verified, deployed, and live-provider evidence instead of treating compilation as integration success.

## 5. Would you build with these devices and services again?

Yes. Ring provides a useful real-world event source, and AWS serverless services map naturally to a low-volume arrival workflow with durable processing and tight cost controls. For a production product, we would require stable partner credentials, provider monitoring, privacy review, operational testing at real sites, SES production access, and clearer SDK support before broad rollout.

# Architecture and trust boundaries

DoorSignal is a single-site hackathon application with a public introduction, an isolated judge replay, an authenticated operator workspace, and narrowly scoped visitor and integration endpoints. The AWS deployment runs in `us-east-1` and uses no VPC or always-on compute.

## Request paths

1. Namecheap DNS points `doorsignal.site` and `www` to API Gateway custom domains protected by an ACM certificate.
2. API Gateway invokes the standalone Next.js server through Lambda Web Adapter. The Lambda package contains the Next.js static assets, so deep links and browser chunks use the same origin.
3. A Ring webhook receiver reads the original request bytes, verifies `X-Signature: sha256=...` in constant time, validates the v1.1 payload, and writes a deduplicated event record to DynamoDB before returning success.
4. DynamoDB Streams invokes a small forwarder. It publishes accepted Ring events and queued email work to a dedicated EventBridge bus.
5. EventBridge invokes a bounded worker with retries and an SQS dead-letter queue. The worker updates cases, optionally calls Bedrock, and attempts approved SES mail.

## Ring boundary

DoorSignal makes Ring calls only from server-side code and restricts URLs to `https://api.amazonvision.com/v1/`. A short-lived playground token and the Ring webhook secret live in Secrets Manager. Device discovery associates every saved device with its Ring account. Webhooks for a different account or an unconnected device are rejected during processing.

Recent event import uses Ring's device history endpoint. WHEP streaming sends a receive-only SDP offer, validates the answer, accepts only a same-origin session location beneath that device's session path, and provides an explicit DELETE endpoint. Stream tokens expire after two minutes and cannot be used for a different site or device.

Camera image bytes have a two-megabyte limit, remain in memory, and are not written to DynamoDB, S3, logs, or the response. Redirects remain disabled until an explicit Ring media-host allowlist can be verified.

## Identity and authorization

- **Public:** introduction, privacy, health, and a visitor form reached through a signed check-in link.
- **Judge:** a random `judge:<uuid>` partition with a signed HTTP-only cookie. It can replay fictional events and use host actions in its partition. It cannot reach Ring configuration, Bedrock, SES, or live records.
- **Visitor:** a signed token grants a single check-in submission; the returned status token grants read-only access to that check-in's response state.
- **Integration:** a random key is stored only as a SHA-256 digest and can access expected-arrival endpoints only.
- **Operator:** Cognito validates an access token for the deployed user pool and requires membership in the `operators` group. Browser mutations also require a same-origin request.

All input is length-bounded and validated with Zod. Case mutations use optimistic versions in DynamoDB transactions, so concurrent or stale actions fail instead of silently overwriting state.

## Intelligence boundary

The deterministic workflow first uses event type, schedule window, site, visit kind, and voluntary check-in evidence. Nova 2 Lite receives only an authorized JPEG plus a fixed prompt for three coarse booleans: person, package, and vehicle present. Bedrock output is JSON-validated. A failure, refusal, malformed response, or exhausted retry becomes `unknown`.

The model does not receive names, select a person's identity, change a case, send a notification, or unlock anything. Application code defines every available action and authorization check.

## Persistence and failure handling

DynamoDB uses a site partition key, typed sort keys, encryption at rest, TTL, request-unit caps, and deletion protection. The receiver records webhook acceptance before acknowledgment. Stream processing reports individual batch failures, EventBridge retries delivery, Lambda retries worker failures, and exhausted work reaches SQS.

Notifications record `queued`, `sending`, `sent`, or `failed`. A `sent` email means SES accepted the request; DoorSignal does not claim inbox delivery. Judge sessions never enqueue external mail.

Operational records expire after seven days; judge records expire after one day. Expired records are filtered immediately and DynamoDB TTL removes them asynchronously. Operators can delete active site records from Settings. Lambda logs use seven-day retention. Retained infrastructure such as the DynamoDB table, secret, and Cognito pool requires an administrator to remove it deliberately.

The CDK stack also contains an optional CloudFront/private-S3 hosting mode behind `--context cloudFrontEnabled=true`. It is not enabled in the submitted deployment because the AWS account currently cannot create a new CloudFront distribution.

## Cost and operations

The account's regional Lambda quota, API Gateway throttles, DynamoDB request-unit maxima, model-call limits, email limits, and short log retention bound the demonstration. CloudWatch alarms cover web errors and dead-letter messages. A custom AWS Budget measures the `Project=DoorSignal` tag and alerts at US$25 and US$40 during the submission window. See [COSTS.md](COSTS.md).

## Limits of the submission build

This is a hackathon prototype. The official Ring playground is used for live evidence. SES begins in the AWS sandbox and can send only to verified recipients until Amazon approves production access. Domain validation and live-provider readiness are recorded separately from local tests in [IMPLEMENTATION.md](IMPLEMENTATION.md).

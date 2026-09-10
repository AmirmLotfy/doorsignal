# Devpost submission copy

Draft for project `doorsignal` (Devpost project 1423199). Links and provider evidence marked pending must be replaced with verified public values before updating the draft. Eligibility statements remain unanswered until the submitter confirms them.

## General information

**Project name**

DoorSignal

**Elevator pitch**

Turn Ring door events into guest, delivery, and service workflows—with clear ownership and no facial recognition.

## About the project

### Inspiration

A small studio can have a smart doorbell, a schedule full of visitors, deliveries arriving throughout the day, and no receptionist connecting those facts. A generic motion alert still leaves the team asking: why is this person here, who should respond, and did anyone finish the handoff?

DoorSignal treats the front door as a shared operational inbox. It adds context and ownership while keeping identity decisions with people.

### What it does

DoorSignal turns a Ring button press or motion event into a durable arrival case. It compares the event with expected guest, delivery, and service windows, then shows what matched and who owns the next step. A printable QR sign lets a visitor check in from their own phone. When the host responds, that status appears on the visitor's page.

Three workflows make the handoff concrete:

1. A guest arrival is associated with a scheduled visit, strengthened by voluntary QR check-in, and acknowledged by the host.
2. A delivery moves from received to collected with accountable actions and timestamps.
3. A scheduled service visit can be suggested, while an unmatched after-hours arrival is described objectively and sent to human review.

DoorSignal does not perform facial recognition. A schedule is only a suggestion; check-in evidence or a human confirms the context. Amazon Nova 2 Lite can return coarse facts such as whether a person, package, or vehicle is visible. Invalid or unavailable model output becomes **unknown**, and the model cannot take actions.

### How we built it

The Next.js 16 application runs on AWS Lambda through Lambda Web Adapter and HTTP API Gateway. Cognito protects operator controls. Production records live in DynamoDB with optimistic transactions, TTL, and site isolation. A signed Ring webhook is verified against its original bytes and persisted before acknowledgment. DynamoDB Streams forwards accepted work to EventBridge; a Lambda worker retries processing and sends exhausted work to SQS.

The server-side Ring adapter uses `api.amazonvision.com` for account and device discovery, recent event history, transient images, and receive-only WHEP session creation and deletion. Short-lived playground credentials and the webhook secret live in Secrets Manager.

Nova 2 Lite is invoked through the Bedrock Converse API with a fixed schema, two attempts, a 128-token output limit, and no identifying prompt. In-app notifications are durable. SES email tracks queued, accepted, and failed states and is disabled in the public judge replay.

The public demo uses a unique one-day partition with fictional data, so judges can test every workflow without accessing a live Ring account or sending external notifications. The UI adapts a clear activity inbox and shared ownership model across desktop, tablet, and phone.

### Challenges

The original prototype used an incorrect webhook shape and in-memory simulations. Correcting it required preserving the exact request bytes, validating Ring's v1.1 envelope, joining JSON:API device relationships, and treating missing device state as unknown. WHEP cleanup also needed strict same-origin validation so credentials could never follow an arbitrary URL.

Durable asynchronous work was another challenge: receiving a webhook is not the same as finishing it. DoorSignal records acceptance first, then lets Streams, EventBridge, Lambda retries, and the dead-letter queue own processing. Tests cover duplicate deliveries, restarts, concurrent actions, token expiry, offline devices, malformed model output, and notification failure.

AWS deployment revealed a custom Budget date-format mismatch at CloudFormation time and an account verification restriction on new CloudFront distributions. We documented both observations and deployed the app through the API Gateway hosting path while retaining the CloudFront/private-S3 configuration for an account where CloudFront creation is enabled.

### What we learned

Confidence at a physical doorway should come from explicit evidence, not a model's guess. The strongest product experience came from showing the reason for a match, preserving **unknown**, and giving one person a clear next action. We also learned to separate local tests, deployed infrastructure, live Ring calls, model invocation, and email delivery evidence; each proves something different.

### What's next

After the hackathon, the next gates are a stable Ring partner credential flow, SES production access, site-specific privacy review, accessibility testing with real participants, and a monitored pilot at one consenting workplace. Future integrations would enter through the same expected-arrivals API rather than adding unverified provider badges.

## Built with

TypeScript, Next.js, React, Ring API, Ring Developer Playground, WHEP, AWS CDK, AWS Lambda, Lambda Web Adapter, Amazon API Gateway, Amazon DynamoDB, DynamoDB Streams, Amazon EventBridge, Amazon SQS, Amazon Cognito, AWS Secrets Manager, Amazon Bedrock, Amazon Nova 2 Lite, Amazon SES, Amazon CloudWatch, AWS Budgets, Vitest, Zod, QRCode

## Links

- Product: `https://doorsignal.site` — HTTPS, homepage, and deep links verified September 10, 2026
- Source: `https://github.com/AmirmLotfy/doorsignal` — public with Apache-2.0 detected
- Testing: `https://doorsignal.site` — isolated public judge demo verified across separate operator and visitor sessions
- Video: pending final upload
- Friction log: public repository URL pending

## Additional information

**Submitter type:** pending submitter answer  
**Organization:** pending; use `N/A` only if the submitter confirms  
**Country of residence:** pending submitter answer  
**Canadian province:** pending submitter answer  
**Primary track:** Ring  
**New or existing before August 31, 2026:** pending submitter confirmation  
**AWS Builder Mini Challenge:** Yes  
**Open Source Mini Challenge:** Yes

### AWS Builder explanation

DoorSignal uses DynamoDB and Streams for durable, deduplicated arrival records and event handoff; EventBridge, Lambda, and SQS for retryable processing; Nova 2 Lite through Bedrock Converse for bounded coarse scene facts; SES for tracked host email attempts; Cognito for operator access; Secrets Manager for Ring and application secrets; API Gateway and Lambda Web Adapter for the Next.js service; and CloudWatch plus AWS Budgets for operational and cost controls. The repository includes CDK infrastructure and tests for model failure, worker retries, concurrency, site isolation, and notification failure.

### Open Source explanation

Contribution URL: `https://github.com/AmirmLotfy/doorsignal`  
Project repository: `https://github.com/AmirmLotfy/doorsignal`  
GitHub username: `AmirmLotfy`

DoorSignal is a new Apache-2.0 project created during the hackathon window. The contribution includes the complete Next.js product, Ring server adapter, webhook verifier, QR visitor handoff, DynamoDB persistence layer, EventBridge/Lambda worker pipeline, bounded Nova integration, SES notification state machine, CDK infrastructure, original brand assets, tests, setup instructions, and evidence-based friction notes. It matters because it turns a low-context sensor notification into an accountable workflow without biometric identification.

### Feature requests

- **Important — Ring SDK and webhook verifier:** publish official versioned TypeScript payloads plus raw-byte signature helpers. This would prevent subtle framework parsing errors.
- **Important — Playground expiry metadata:** expose an explicit expiry time and streamlined token reissue so a recorded demo can recover cleanly.
- **Nice-to-have — Structured WHEP session id:** avoid passing a cleanup URL and provide browser-disconnect lifecycle examples.
- **Important — AWS Budget CDK date alignment:** accept a `Date` or convert to the epoch format required by CloudFormation.

The full [friction log](friction-log.md) and five [developer-tool feedback answers](product-feedback.md) are prepared for their corresponding fields.

## Final submission gates

- Public product, deep links, QR flow, and HTTPS verified
- Public repository, full Apache-2.0 license, CI, and clean secret scan verified
- Official Ring calls and deployed Bedrock invocation recorded
- Final video under three minutes, captions, gallery, thumbnails, and rights record reviewed
- Judge kit under 35 MB reviewed
- Submitter type, organization, residence, project history, and all three eligibility attestations answered by the submitter
- Explicit **yes, submit** received after the Devpost preview is reviewable

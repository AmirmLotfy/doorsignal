# Title

DoorSignal

## One-line Summary

Turn Ring door events into guest, delivery, and service workflows—with clear ownership and no facial recognition.

## Problem

A smart doorbell tells a small workplace that somebody is outside, but it does not answer the operational questions that follow: why are they here, who should respond, and did the handoff finish? Guests wait without feedback, deliveries become unowned alerts, and after-hours events lack context.

## Solution

DoorSignal turns a signed Ring event into a durable arrival case. It compares the event with expected guest, delivery, and service windows, assigns the next action, and records what happened. A visitor can voluntarily check in from a signed QR link and see the host's real response on their phone. Schedule matches remain tentative until check-in evidence or a person confirms them.

The isolated judge demo covers three complete stories: guest check-in and acknowledgment, delivery receipt and collection, and scheduled service versus unmatched after-hours review. It uses fictional, one-day data partitions and cannot access live Ring credentials, invoke Bedrock, or send email.

## Why This Matters

DoorSignal closes the gap between a sensor notification and a completed real-world handoff. It gives a small team the shared ownership of a reception desk while preserving human judgment and avoiding biometric identification.

## How We Used AI

Amazon Nova 2 Lite is integrated through the Bedrock Converse API for three coarse, bounded observations: whether a person, package, or vehicle is visible. A fixed prompt, 128-token limit, schema validation, and two-attempt ceiling keep the result narrow. A refusal, malformed response, or provider failure becomes `unknown`. The model never receives a person's name, confirms identity, changes a case, or sends a notification.

The final brand assets use OpenAI's image generation model. Prompts and rights records are included in the repository. The interface screenshots shown inside the submission graphics are based on the real deployed product.

## How We Used Codex

Codex helped replace the prototype's simulated integrations with a tested Ring contract, durable DynamoDB workflows, the serverless AWS stack, isolated judge replay, and responsive interface. It also helped reproduce deployment failures, repair the Lambda package, verify the hosted multi-session check-in flow, scan the repository for secrets, and keep implementation claims tied to observed evidence.

## Key Features

- Signed Ring v1.1 webhook verification over the exact request bytes, with durable deduplication before acknowledgment.
- Server-side Ring device discovery, event history, transient image retrieval, and receive-only WHEP session lifecycle.
- Expected guest, delivery, and service windows with evidence-based, tentative association.
- Signed QR check-in and a live visitor status page.
- Atomic case actions with ownership, versions, and an audit trail.
- Durable in-app notifications plus tracked SES queued, accepted, and failed states.
- Bounded Nova 2 Lite scene observations with no facial recognition or autonomous actions.
- Isolated judge replay, authenticated Cognito operator controls, TTL retention, and site deletion controls.

## Architecture

`doorsignal.site` resolves through Namecheap DNS to API Gateway custom domains secured by ACM. API Gateway invokes the standalone Next.js application through Lambda Web Adapter. Accepted Ring events are persisted in DynamoDB before acknowledgment. DynamoDB Streams invoke a forwarder, EventBridge routes work, Lambda processes it with retries, and exhausted work reaches SQS. Cognito protects operator functions; Secrets Manager holds provider credentials; CloudWatch and AWS Budgets provide operational and cost controls.

The CDK stack includes an optional CloudFront/private-S3 mode, but the submitted deployment uses the verified API Gateway path because the AWS account cannot currently create a new CloudFront distribution.

## Testing Instructions

1. Open `https://doorsignal.site` and choose **Open the judge demo**.
2. Create a guest arrival, open or scan the visitor check-in link in a separate browser session, submit the visitor name and consent, then acknowledge it as the host. The visitor page should change to **They're on their way**.
3. Open Deliveries, create the delivery story, and move it from received to collected.
4. Open Arrivals to compare a scheduled service visit with an unmatched after-hours arrival that requires review.
5. For local verification, install Node.js 22 and pnpm 11, then run `pnpm install --frozen-lockfile`, `pnpm verify`, `pnpm infra:synth`, and `pnpm secrets:scan`.

## Public Demo Link

https://doorsignal.site

## Public Repository Link

https://github.com/AmirmLotfy/doorsignal

## Demo Video

https://youtu.be/bX1VeK-_rTo

The public video runs 2:45, uses the deployed judge demo, and includes English open captions plus an uploaded subtitle track.

## Screenshot Shot List

1. DoorSignal introduction and trust statement.
2. Today's shared arrival inbox with an expected guest.
3. Printable QR sign and visitor check-in form on a phone viewport.
4. Operator acknowledgment beside the visitor's updated status.
5. Delivery received and collected timeline.
6. Scheduled service match and unmatched after-hours review.
7. Ring integration reconnect/live evidence state.
8. Architecture and AWS processing evidence.

## Submission Readiness Notes

- Devpost confirmed **Project submitted!** on September 10, 2026. Public submission: `https://devpost.com/software/doorsignal`.

- Public HTTPS homepage, health endpoint, deep links, static chunks, and `www` redirect are verified.
- Forty unit tests, TypeScript checks, the production build, CDK synthesis, and secret scan pass.
- The deployed guest story is verified across separate operator and visitor sessions. Hosted delivery, scheduled-service, and unmatched-arrival runs also completed successfully.
- Devpost image: 1536 × 1024 PNG below 5 MB. YouTube master: 3840 × 2160 with a compressed upload copy.
- Primary track: Ring. Mini challenges: AWS Builder and Open Source.
- Participant answers are confirmed: Individual; N/A organization; Egypt; N/A Canadian province; new project; all three eligibility attestations accepted. The submitter explicitly authorized publication and submission on September 10, 2026.

## Known Limitations

- The official Ring Developer Playground was verified with successful device/account calls and complete WHEP create/delete lifecycles. Its temporary token expires quickly and was never persisted; the public judge demo and published video retain the truthful isolated **Reconnect** state.
- SES DKIM is verified, but the account remains in sandbox and no recipient has been approved for a delivery test.
- CloudFront distribution creation is unavailable in the current AWS account, so the active deployment serves static assets from the Lambda package through API Gateway.
- The final public video is live at `https://youtu.be/bX1VeK-_rTo` with English open captions, an uploaded English subtitle track, the custom thumbnail, and clean YouTube copyright and Community Guidelines checks.

## TODO Official Form Fields

- Uploaded gallery and judge kit.
- Codex session ID: `01a08839-a1f9-7f92-b4b4-6a2134861fbb`.

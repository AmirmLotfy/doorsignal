# DoorSignal implementation record

Approved scope: Ring primary track; AWS Builder and Open Source mini challenges. AWS budget: USD 50 through November 20, 2026, including credits consumed. Domain: doorsignal.site.

## Baseline — September 10, 2026

- Preserved the original prototype in Git commit `049958a` before integration changes.
- Baseline: 35 unit tests and web TypeScript check passed. These tests covered prototype behavior, not hosted readiness.
- Root Turbo build failed because no Turbo configuration existed. Next.js 14.2.24 was installed; 16.3.3 is available in the registry.
- Local browser reload failed with a missing JavaScript chunk.
- AWS CLI session was expired. A refresh was initiated; deployment has not yet occurred.
- Devpost project `doorsignal` (1423199) is an empty draft. No eligibility answers or final submission have been asserted.
- Ring's documented webhook uses HMAC-SHA256 over the raw body, `X-Signature: sha256=...`, and a v1.1 envelope. The original prototype used a different, invented contract.

## Design evidence

The approved design adapts the activity hierarchy of [Linear](https://mobbin.com/screens/beb9d6b3-ec34-46d7-9332-320fcb32a338) and ownership/conversation layout of [Front](https://mobbin.com/screens/41442600-aa1c-4ecc-bc45-9a5743c9c909). Both references were inspected during planning. Warm white, charcoal, IBM Plex Sans, and restrained status colors remain the DoorSignal identity.

MOBBIN-GATE: PASS for the approved dashboard refinement.

## Deployed evidence — September 10, 2026

- Deployed `DoorSignalStack` in `us-east-1` with termination protection. The active request path is Namecheap DNS → API Gateway custom domain → Lambda Web Adapter → standalone Next.js, including packaged static chunks.
- ACM issued the apex and `www` certificate. `https://doorsignal.site/api/health` returns `status: ok` with `storage: DynamoDB`; the homepage, `/today` deep link, JavaScript chunks, and the `www` redirect return successfully over HTTPS.
- The stack contains DynamoDB and Streams, EventBridge, two worker Lambdas, an SQS dead-letter queue, Cognito, Secrets Manager, SES permissions, CloudWatch alarms, SNS notifications, and gross-spend AWS Budget alerts at USD 25 and USD 40.
- SES DKIM is verified for `doorsignal.site`. The account remains in the SES sandbox, and no recipient is configured or contacted without the submitter's explicit approval.
- The isolated deployed judge demo was exercised in separate browser sessions. A guest arrival was created, the visitor submitted the signed check-in form, the operator acknowledged it, and the visitor status changed to **They're on their way**.
- The full verification suite passes 40 tests, TypeScript checking for all workspaces, the clean Next.js production build, CDK synthesis, and the repository secret scan.
- The Devpost image is 1536 × 1024 and below 5 MB. The YouTube master is 3840 × 2160 with a compressed upload copy. Source prompts and rights notes are saved with the assets.

## Open evidence gates

- The official Ring playground login is awaiting the submitter's Amazon Developer authentication. Live device discovery, event history, WHEP, token-expiry recovery, and recorded evidence remain pending.
- A deployed Bedrock invocation remains separate from the unit-tested adapter and must be recorded before the AWS integration claim is finalized.
- SES acceptance and inbox delivery are intentionally unclaimed until a verified, explicitly approved recipient is tested.
- Delivery and service/unmatched stories pass automated tests; their final hosted browser recording remains pending.
- Narration, music, captions, final video upload, participant details, eligibility attestations, and explicit final submission approval remain pending.

## Evidence levels

Implementation, automated tests, local browser checks, deployed endpoint checks, official Ring playground calls, Bedrock invocation, email acceptance/delivery, and participant attestations are separate evidence. Missing evidence remains explicit.

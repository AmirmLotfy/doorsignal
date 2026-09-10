# DoorSignal friction log

Observed during implementation on September 10, 2026. Severity describes the effect on this submission. Each workaround is implemented in this repository; provider behavior will be rechecked against live evidence before submission.

## Ring webhook contract was easy to misread

- **Task:** Replace the prototype webhook receiver with the documented Ring contract.
- **Steps:** Compared the existing handler with Ring's API reference, then implemented raw-body HMAC verification and tested official-shaped v1.1 fixtures, malformed signatures, duplicates, and an older incompatible envelope.
- **Expected:** A TypeScript example or SDK helper that verifies a webhook and exposes the exact event union.
- **Actual:** The application must preserve the original bytes, parse the `sha256=` header, perform constant-time comparison, and separately validate the v1.1 envelope. The old prototype had drifted to an invented timestamp-prefixed format.
- **Severity:** Critical. A plausible implementation can reject every legitimate event or validate transformed JSON.
- **Workaround:** `packages/core/src/ring.ts` verifies the exact bytes before parsing. `packages/core/src/types.ts` constrains the envelope and supported event types. Forty tests include malformed and legacy cases.
- **Suggestion:** Publish a small official Node package with raw-body framework examples, constant-time verification, and versioned TypeScript event types.

## Device details arrive through JSON:API relationships

- **Task:** Discover devices and determine their online state and capabilities.
- **Steps:** Requested `/v1/devices?include=status,capabilities`, mapped relationship identifiers into `included`, and tested online, offline, missing, and malformed combinations.
- **Expected:** A self-contained device record for the common status and capability fields.
- **Actual:** Useful data may require joining relationships to included resources. An absent relationship is different from a false capability, and an unknown status must not be treated as online.
- **Severity:** Important. Incorrect joins can enable a stream control for an offline or unrelated device.
- **Workaround:** DoorSignal resolves relationship `type` and `id`, preserves `unknown`, associates devices with the connected account, and refreshes status before WHEP creation.
- **Suggestion:** Add a complete response example with multiple devices, mixed online states, missing includes, and the capabilities needed for each media operation.

## Playground credentials are deliberately short-lived

- **Task:** Keep a live hackathon demo usable without representing an expired session as connected.
- **Steps:** Connected the official playground path, added a local expiry boundary, and tested calls after expiry and provider 401/403 responses.
- **Expected:** A stable development credential or machine-readable expiry supplied with the token.
- **Actual:** Playground access is short-lived, so a rehearsal or recording can cross the expiry boundary.
- **Severity:** Important for demos; low for security because short life reduces exposure.
- **Workaround:** DoorSignal stores the token only in Secrets Manager, records a conservative expiry, fails closed, and shows **Reconnect** instead of stale success.
- **Suggestion:** Return explicit `expires_at` metadata and add a refresh/reissue control in the playground without requiring the developer to reconstruct setup.

## WHEP cleanup needs careful URL handling

- **Task:** Start and reliably end a receive-only Ring live-view session.
- **Steps:** Sent a receive-only SDP offer, checked the answer and `Location`, then exercised normal cleanup, malformed locations, wrong origins, and device-path mismatch in tests.
- **Expected:** A typed session identifier that can be passed to an SDK cleanup method.
- **Actual:** The cleanup target is a URL returned in a header. Blindly following it would risk forwarding authorization to an unexpected host.
- **Severity:** Critical for credential protection and important for cleaning up provider sessions.
- **Workaround:** DoorSignal accepts only the Ring API origin and the connected device's WHEP session path, strips the URL into a short-lived signed app token, and calls DELETE explicitly.
- **Suggestion:** Return a structured session id and publish lifecycle examples for browser disconnect, timeout, and failed SDP negotiation.

## AWS Budget custom dates use epoch seconds at deployment

- **Task:** Create a US$50 gross-cost budget covering the hackathon deployment through November 20.
- **Steps:** Defined a CDK `CfnBudget` with a custom time period and deployed through CloudFormation.
- **Expected:** ISO 8601 strings accepted by the generated CDK type would deploy.
- **Actual:** AWS Budgets rejected those values and required epoch seconds encoded for the resource provider. CloudFormation rolled the first stack attempt back.
- **Severity:** Important. It blocked infrastructure deployment but created no application-data loss.
- **Workaround:** DoorSignal uses the verified epoch boundaries `1788998400` and `1795219200`, keeps the calculation documented, and reruns synthesis before deployment.
- **Suggestion:** Make CDK's generated type and documentation match the value shape enforced by the CloudFormation resource provider, or convert `Date` values during synthesis.

## SES sandbox state is easy to confuse with application readiness

- **Task:** Send host notifications and report their real state.
- **Steps:** Queried the account, found sending enabled with production access disabled and a daily quota of 200, then implemented persisted queue/attempt/failure states.
- **Expected:** A development environment that can send a bounded test to a configured recipient after domain verification.
- **Actual:** While the account is in the SES sandbox, recipients also need verification. SES accepting a request still does not prove inbox delivery.
- **Severity:** Important for live email evidence; the in-app workflow remains functional.
- **Workaround:** The judge demo never sends external email. Live configuration accepts only an approved recipient, tracks SES acceptance as `sent`, and keeps delivery claims out of the UI.
- **Suggestion:** Surface sandbox restrictions and identity readiness together in a single API response, including the exact next verification action.

## An active Nova profile can still be blocked at the account boundary

- **Task:** Record a real Nova 2 Lite Converse invocation through the same bounded scene-analysis path used by DoorSignal.
- **Steps:** Verified AWS CLI `2.36.29`, authenticated the target account, confirmed both `us.amazon.nova-2-lite-v1:0` and `global.amazon.nova-2-lite-v1:0` inference profiles were `ACTIVE`, then invoked the geo profile and supported in-region model with explicit 64-token limits.
- **Expected:** A small JSON response and usage metadata from the active model.
- **Actual:** Both supported model identifiers returned `ValidationException: Operation not allowed`. The application path consumed its bounded attempt, stored no false completion record, and returned `unknown`.
- **Severity:** Important for the optional scene-context enhancement and live video evidence. Core Ring, QR, ownership, persistence, and notification workflows continue without model output.
- **Workaround:** DoorSignal treats all Bedrock refusal, validation, timeout, and malformed-output paths as `unknown`; it does not infer a detection or authorize an action. The repository records the provider gate separately from local adapter tests.
- **Suggestion:** Return a reason code that distinguishes an account restriction from IAM, model access, cross-region routing, and quota errors, and surface the required support action in the Bedrock console.

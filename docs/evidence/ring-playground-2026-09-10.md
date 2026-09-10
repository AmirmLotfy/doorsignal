# Official Ring Playground verification — September 10, 2026

DoorSignal was checked against the authenticated official Ring Developer Playground on September 10, 2026. The playground issued a temporary OAuth token with an approximately 30-minute lifetime. The token, device identifiers, session identifiers, and account identifiers were not copied into the repository and are redacted from this record.

## Observed API evidence

| Playground operation | Observed result |
|---|---|
| Device List | Success; one synthetic playground device returned |
| Device Discovery | Success |
| Status | Success; four current device attributes returned |
| Capabilities | Success; twelve capability attributes returned |
| Locations | Success |
| Configurations | Success |
| Users API | Success |
| Event History | Empty before streaming; two `on_demand` records after verified WHEP sessions |

All calls were made by the official playground to `api.amazonvision.com` with its temporary credential.

## WHEP lifecycle

Package, vehicle, and motion simulations each opened the playground live view. The captured network sequence showed a `POST` to the device WHEP sessions endpoint returning **HTTP 201 Created**. Closing the live view issued `DELETE` to the same session URL and returned **HTTP 200**. The final live view was closed successfully.

This evidence validates the documented device and account request shapes plus creation and explicit cleanup of receive-only WHEP sessions. DoorSignal's corresponding server-side adapter and cleanup behavior are covered by the repository tests.

## Evidence boundary

This was an official synthetic Ring sandbox, not a household Ring account. It does not establish production account access, real camera-media handling, or webhook delivery from a physical device. The public DoorSignal judge workspace remains isolated and replay-only: its browser cannot read the temporary Ring token, and the token was not persisted in AWS or source control. The published video therefore continues to show the truthful **Reconnect** state; this later verification is recorded separately.

Amazon Bedrock remains a separate provider gate. The active AWS account still returns `ValidationException: Operation not allowed` for Nova 2 Lite, and DoorSignal maps that failure to `unknown`.

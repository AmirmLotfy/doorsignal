# DoorSignal judge kit

DoorSignal turns Ring events into accountable guest, delivery, and service workflows with no facial recognition.

- Live judge demo: https://doorsignal.site
- Public source: https://github.com/AmirmLotfy/doorsignal
- Demo video: https://youtu.be/bX1VeK-_rTo (public, 2:45, English captions)

The demo uses isolated fictional records and cannot access live Ring credentials, invoke Bedrock, or send external email. The submitted deployment is healthy on AWS in us-east-1. The authenticated official Ring Developer Playground was verified separately: device/account calls succeeded, WHEP creation returned HTTP 201, and cleanup returned HTTP 200. Temporary credentials and synthetic identifiers were not retained, so the public product and video correctly remain in **Reconnect** mode. Nova 2 Lite is integrated through Bedrock Converse but the current AWS account returns `ValidationException: Operation not allowed`, so runtime failures become `unknown`.

Start with `README.md`, `docs/ARCHITECTURE.md`, `docs/IMPLEMENTATION.md`, and `docs/SUBMISSION.md`.

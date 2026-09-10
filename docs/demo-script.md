# DoorSignal demo script

Target runtime: **2 minutes 45 seconds**. Language: English. Narration: a natural male voice, conversational and unhurried. Product footage must be a real browser recording. On-screen provider evidence must come from the official Ring playground and the deployed AWS account.

## 0:00–0:10 — The problem and product

**Picture:** A natural doorway detail cuts to DoorSignal's quiet inbox and logo. Title: **From doorbell to done.**

**Voiceover:**

> A doorbell can tell you someone arrived. It cannot tell your team why they are there, who owns the visit, or what happened next. DoorSignal turns Ring events into a shared arrival inbox.

## 0:10–1:00 — Guest check-in and acknowledgment

**Picture:** In the judge replay, choose Guest. Show the new arrival, print-sign QR, and scan/open the visitor link in a separate phone-size browser. Enter a fictional guest name, consent, and check in. Return to the host inbox, show the check-in evidence, and select **I'm on my way**. Return to the visitor page after its polling refresh.

**Voiceover:**

> Here is a guest arriving for a scheduled visit. DoorSignal records the event as a case and keeps the schedule match tentative. The sign opens a check-in page on the guest's own phone—no app and no camera permission. The guest shares a name and visit type, with consent. That check-in is stronger evidence, so the case updates. The host sees a clear reason, takes ownership, and responds. A moment later, the guest's page says the host is on the way. Every step is saved, and no facial recognition is used.

## 1:00–1:35 — Delivery lifecycle

**Picture:** Choose Delivery. Show the delivery case, mark it received, open Deliveries, then mark it collected. Keep the lifecycle and timestamps visible.

**Voiceover:**

> Deliveries use the same calm handoff. A due package appears with an owner and its current state. Operations marks it received, so it moves to awaiting collection. When a teammate picks it up, one more action closes the case. The timeline records who changed the state, and a stale or repeated action cannot overwrite the latest result.

## 1:35–2:05 — Scheduled service and unmatched arrival

**Picture:** Show Scheduled service, then Unmatched after hours. Pause on the objective reason and the **Human review** label. Dismiss the fictional unmatched case.

**Voiceover:**

> A scheduled service visit can be suggested from its time window and location. DoorSignal still asks a person to confirm. After hours, the same door event with no matching appointment becomes an unmatched arrival. It does not invent an identity or a threat score. It states what is known, marks the case for human review, and exposes only application-approved actions.

## 2:05–2:30 — Ring and AWS evidence

**Picture:** Use a compact split sequence: official Ring playground token/device screen; DoorSignal's live integration status and imported event; an evidence row for a successful Ring API request; AWS console/CLI evidence for DynamoDB → Streams → EventBridge → Lambda; and a successful Nova 2 Lite Converse invocation with its bounded usage. Do not show credentials or account secrets.

**Voiceover:**

> This is the live path. DoorSignal calls Ring's server-side API for device discovery, event history, and receive-only WHEP sessions. Signed webhook bytes are persisted before the response. DynamoDB Streams and EventBridge drive a retryable Lambda worker. Nova 2 Lite returns only bounded scene facts; malformed or unavailable results become unknown. Failed work goes to a dead-letter queue.

## 2:30–2:45 — Customer value and close

**Picture:** Return to the resolved inbox, show the privacy line, then the DoorSignal lockup and URL.

**Voiceover:**

> DoorSignal gives a small workplace the clarity of a front desk using the Ring devices it already has. Guests know someone heard them. Teams know what needs action. From doorbell to done.

## Recording and edit notes

- Record the deployed site at 1440p or higher and deliver at 1920 × 1080, 30 fps.
- Show the **Demo replay · fictional data** label whenever replay data is on screen.
- Use tight cursor movement and one action per cut. Avoid browser chrome where it does not establish official provider evidence.
- Redact access tokens, webhook secrets, email addresses, AWS account identifiers, request IDs that carry secrets, and any unrelated account resources.
- Use narration-led cuts; keep interface audio muted.
- Mix instrumental music at least 18 dB beneath normal speech and fade it under provider evidence.
- Captions must match the final spoken edit rather than this draft if timing corrections change wording.

# DoorSignal: Developer Friction Log
*Ring Partner API, WHEP Receive-Only Live View, and AWS Bedrock AgentCore Runtime*

---

## 1. Ring Partner API & Webhook Ingestion

### Friction Point 1: WHEP Receive-Only Audio Channel & Latency
- **Observation**: Ring's WHEP (WebRTC HTTP Egress Protocol) partner stream delivers high quality video and incoming audio, but does not support upstream audio injection back to the hardware device. Early architectural thoughts of an "AI receptionist speaking through the Ring doorbell" proved infeasible under current partner specs.
- **DoorSignal Resolution**: Re-architected the visitor interaction to use a zero-hardware, zero-install printable **DoorSignal QR Marker** placed near the Ring device, opening a lightweight PWA on the visitor's mobile phone. This solved the missing outbound audio channel cleanly while simultaneously boosting correlation certainty (+0.40 score when the visitor voluntary checks in).
- **Recommendation for Ring**: An outbound audio datachannel over WebRTC would enable remote host voice greetings, but the current receive-only constraint is manageable when paired with mobile companion flows.

### Friction Point 2: HMAC-SHA256 Signature Header Parsing & Clock Skew
- **Observation**: Ring webhook signatures are provided in the formatted header `X-Ring-Signature: t=1757464034,v1=9b7348...`. If developers attempt to sign only the raw body without prefixing the timestamp (`${timestamp}.${rawBody}`), verification silently fails. In addition, distributed Lambda cold starts can suffer from clock drift.
- **DoorSignal Resolution**: Implemented a dedicated constant-time verification utility (`verifyRingWebhookSignature`) in `@doorsignal/ring-client` with a configurable 300-second drift buffer and strict `crypto.timingSafeEqual` comparison.
- **Recommendation for Ring**: Provide official TypeScript SDK helpers for webhook verification in `@ring/developer-tools`.

### Friction Point 3: Watermarking Container Constraints
- **Observation**: Ring Partner API requires that video/snapshot streams served to external applications preserve the Ring logo, Device ID, Application ID, and timestamp watermark without cropping or tampering.
- **DoorSignal Resolution**: Created a dedicated `RingWatermarkFrame` component in `@doorsignal/ui` that explicitly frames the video stream and renders complementary metadata bars above and below without obscuring the stream boundaries.

---

## 2. AWS Bedrock AgentCore & Policy Engine

### Friction Point 4: Single Bedrock Prompt vs Multi-Service Agent Pipeline
- **Observation**: A single monolithic Bedrock prompt attempting to ingest camera descriptions, calendar databases, and notification formatting produces hallucinations and unpredictable tool calling.
- **DoorSignal Resolution**: Implemented a 4-stage resolver:
  - Stage 1: Deterministic filter (eliminating 90% of irrelevant scheduled records via window +/- 30m).
  - Stage 2: Contextual heuristic scoring (transparent weights for token match, time proximity, site match).
  - Stage 3: Strands agent on Bedrock AgentCore Runtime only for genuinely ambiguous multi-candidate events.
  - Stage 4: AgentCore Policy engine enforcing hard negative constraints.

### Friction Point 5: Enforcing Negative Guardrails on Agent Actions
- **Observation**: Standard LLM prompts like "Do not unlock doors" can be bypassed via indirect prompt injection or hallucinated parameters.
- **DoorSignal Resolution**: Enforced AgentCore Policy checks outside the model execution loop: any tool call matching access or unlock keywords is unconditionally blocked at the gateway level with an auditable policy violation log.

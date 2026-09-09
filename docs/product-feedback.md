# DoorSignal: Product & Ecosystem Feedback
*Constructive Feedback for Amazon Ring Developer Platform & AWS Bedrock AgentCore Teams*

---

## 1. Executive Summary

DoorSignal was conceived and built specifically for the **Amazon Developer Hackathon (Ring Track & AWS Builder Mini Challenge)**. During development, our team integrated:
- Ring Partner API (Webhooks, WHEP WebRTC receive-only video streaming, Playground simulation)
- AWS Bedrock AgentCore Runtime & Policy Guardrails
- Amazon Nova 2 Lite (Multimodal coarse scene interpretation)
- Amazon EventBridge, DynamoDB, S3 KMS, and API Gateway

Below is our structured feedback, designed to help Amazon improve developer ergonomics, partner SDKs, and platform capabilities.

---

## 2. Ring Developer Platform & Partner API

### 2.1 The Value of Upstream WebRTC Audio Channels (Two-Way Voice Intercom)
- **Current Behavior**: Ring's WHEP partner stream is currently **receive-only**. Video and incoming audio stream from the doorbell to the application, but external partner apps cannot transmit outbound audio back to the speaker on the doorbell.
- **Why This Matters**: Many business applications would benefit from allowing an authorized employee to say "Hi Maya, I'm coming down!" through the doorbell speaker. Because this is prohibited under current partner specs, we adapted by introducing the **DoorSignal QR Marker PWA**, which handles visitor-facing feedback on the visitor's phone.
- **Recommendation**: Introduce a companion WebRTC bidirectional datachannel or audio egress endpoint for vetted B2B partner applications with strict acoustic echo cancellation (AEC).

### 2.2 Official TypeScript / Node.js Webhook Verification SDK
- **Current Behavior**: Developers must manually implement HMAC-SHA256 signature verification by parsing the `X-Ring-Signature: t={timestamp},v1={hash}` header and concatenating `${timestamp}.${rawBody}`. Small clock drifts or JSON formatting variations cause silent verification drops.
- **Recommendation**: Release an official lightweight npm package (`@ring/webhook-verifier` or `@ring/sdk`) providing built-in constant-time verification, configurable clock skew tolerance (e.g. 300s), and TypeScript payload types.

### 2.3 Ring Developer Playground Enhancements
- **Praise**: The Ring Developer Playground is exceptional for testing `button_press`, `motion_detected`, and `package_detected` events without needing physical hardware mounted at a door.
- **Improvement Idea**: Allow injecting simulated metadata (e.g. `mock_carrier: "FedEx"`, `mock_device_location: "Delivery Entrance"`) directly from the playground UI to make end-to-end B2B scenario testing even faster.

### 2.4 Watermark Accommodations in Responsive Layouts
- **Current Behavior**: Ring Partner API requires external applications to display the Ring logo, device ID, application ID, and timestamp watermark without cropping.
- **Recommendation**: Provide explicit guidelines and CSS container recommendations for responsive mobile/tablet web apps to ensure developers maintain 100% compliance across various screen aspect ratios.

---

## 3. AWS Bedrock AgentCore & Nova 2 Lite

### 3.1 Multi-Stage Resolvers vs Single Monolithic Prompts
- **Finding**: Attempting to pass raw camera snapshots, company calendars, and delivery records into a single monolithic LLM prompt resulted in hallucinated candidate matches and unpredictable tool calling.
- **Our Solution**: We split the resolution into a 4-stage pipeline:
  1. *Stage 1*: Deterministic filter (eliminating 90% of noise via window ±30m).
  2. *Stage 2*: Contextual heuristic scoring (token match 0.40, time proximity 0.25, site match 0.15).
  3. *Stage 3*: Bedrock AgentCore Runtime + Strands agents only when multiple candidates remain.
  4. *Stage 4*: AgentCore Policy negative guardrails.
- **Recommendation for AWS**: Highlight multi-stage deterministic + agentic patterns in Bedrock documentation, rather than promoting single-prompt end-to-end LLM architectures for mission-critical operations.

### 3.2 AgentCore Policy as an Architectural Moat
- **Praise**: AgentCore Policy provides a crucial safety layer by evaluating actions *outside* the model's reasoning loop. For DoorSignal, we enforce hard rules:
  - Any tool call with `unlock`, `door_release`, or `access_grant` is unconditionally blocked.
  - Any biometric or facial recognition tool is blocked at the gateway level.
  - Delivery cases cannot inspect private meeting attendee details.
- This gives enterprise customers complete confidence that autonomous agents cannot trigger unauthorized physical lockouts or privacy breaches.

### 3.3 Amazon Nova 2 Lite for Coarse Multimodal Extraction
- **Observation**: Nova 2 Lite proved fast and cost-effective for coarse physical scene classification (`person_count`, `package_present`, `vehicle_present`) while strictly honoring our zero-biometric prompt contract.

---

## 4. Commercialization & Ring Appstore

- **United States First Strategy**: Ring's default commercial Appstore territory is the United States, which aligns perfectly with our initial target customer base (creative studios, architecture firms, coworking hubs, and professional offices with 5–75 employees).
- **Zero-Hardware Friction**: By pairing Ring cameras with printable QR signage, small businesses can activate an enterprise-grade front door workflow in under 5 minutes without purchasing $3,000+ lobby kiosks or specialized intercom hardware.

# DoorSignal
> **The physical inbox for your business. Turn arrivals into workflows.**

[![Hackathon Track: Ring](https://img.shields.io/badge/Amazon%20Hackathon-Ring%20Track-blue)](https://amazonappdev2026.devpost.com/)
[![AWS Builder Mini Challenge](https://img.shields.io/badge/AWS%20Builder-Bedrock%20AgentCore-orange)](https://amazonappdev2026.devpost.com/)
[![Zero Biometrics](https://img.shields.io/badge/Architecture-Zero--Biometric-teal)](#zero-biometric-architecture)
[![License: Apache 2.0](https://img.shields.io/badge/License-Apache%202.0-green.svg)](LICENSE)

---

## 1. What is DoorSignal?

Small businesses and studios commonly suffer from four disconnected systems:
1. **The front door**: Ring detects motion or button presses, but provides zero business context.
2. **The calendar**: Google Workspace or Microsoft 365 knows who is expected.
3. **Operations**: Delivery tracking and contractor work orders know what parcels and technicians are arriving.
4. **The team**: Slack, Teams, email, or SMS is where the right person can actually act.

None of these systems communicate with each other. A notification saying *"Motion detected at Front Door"* forces employees to stop work and open a security camera app just to see if it's the FedEx courier, a scheduled job candidate, or nobody.

**DoorSignal connects them.** The Ring device becomes the **commercial sensor** for business workflows. When someone arrives, DoorSignal immediately resolves:
- *Is this today's 10:30 interview?*
- *Is this the electrician scheduled by operations?*
- *Is this an expected UPS package delivery?*
- *Is there no expected arrival at all?*
- *Who inside the business should care, and what should happen next?*

---

## 2. Core Architectural Primitives

- **Arrival Intent**: Every real-world arrival is classified into one of 5 canonical operational intents: `GUEST`, `DELIVERY`, `SERVICE`, `PICKUP`, or `UNMATCHED`.
- **Arrival Case**: A structured work item representing what happened, where, when, what context matched it, who owns it, and whether it was acknowledged or resolved.
- **Zero-Biometric Resolution**: Identity is determined exclusively through operational context (appointment time, invitation token, voluntary QR scan, delivery log), never through facial recognition.
- **Receive-Only WHEP Live View**: Strictly respects Ring's partner streaming boundaries (receive-only WebRTC) and partner watermarking compliance.
- **Zero-Hardware Footprint**: Works with existing Ring devices paired with an ultra-lightweight, zero-install printable DoorSignal QR marker and mobile PWA.

---

## 3. System Architecture

```
┌────────────────────────────────────────────────────────┐
│ Ring Doorbell / Camera / Developer Playground          │
└──────────────────────────┬─────────────────────────────┘
                           │ (Webhook: button_press, motion, package)
                           ▼
┌────────────────────────────────────────────────────────┐
│ AWS API Gateway -> Lambda Webhook Receiver             │
│ • HMAC-SHA256 Signature Verification                   │
│ • DynamoDB 24h TTL Request Idempotency Deduplication   │
└──────────────────────────┬─────────────────────────────┘
                           │ (Normalized Domain Event)
                           ▼
┌────────────────────────────────────────────────────────┐
│ Amazon EventBridge Bus (doorsignal.bus)                │
└──────────────┬───────────────────────────┬─────────────┘
               │                           │
               ▼                           ▼
┌──────────────────────────────┐  ┌──────────────────────────────────┐
│ Amazon Nova 2 Lite (Vision)  │  │ Arrival Resolver Engine          │
│ • Coarse scene extraction    │  │ • Stage 1: Deterministic Filter  │
│   (person count, packages)   │  │ • Stage 2: Heuristic Scoring     │
│ • Zero facial recognition    │  │ • Stage 3: Bedrock AgentCore     │
└──────────────┬───────────────┘  │   Runtime + Strands Agent Tools  │
               │                  │ • Stage 4: AgentCore Policy      │
               └─────────┬────────┤   (Hard block on door unlocks)   │
                         │        └──────────────────┬───────────────┘
                         ▼                           │
              ┌──────────────────────┐               │
              │ Arrival Case Engine  │◄──────────────┘
              │ (Aurora PostgreSQL)  │
              └──────────┬───────────┘
                         │
         ┌───────────────┴───────────────┐
         ▼                               ▼
┌──────────────────────────────┐  ┌──────────────────────────────────┐
│ DoorSignal Web Dashboard     │  │ Visitor Check-in PWA             │
│ • Screen 01: Today & Quiet   │  │ • Zero-install mobile web        │
│ • Screen 02: Active Arrival  │  │ • Host notification status       │
│ • Screen 03: Arrivals Ledger │  │ • Voluntary QR token check-in    │
│ • Screen 04: Deliveries      │  └──────────────────────────────────┘
│ • Screen 05: Workflows       │
│ • Screen 06: Settings        │
└──────────────────────────────┘
```

---

## 4. The 3 Winning Hackathon Scenarios

1. **Scenario A — Expected Guest (10:30 Interview)**:
   - At 10:27 AM, candidate Alex Rivera arrives and rings the bell.
   - DoorSignal correlates sensor event with Maya Patel's calendar and Alex's QR check-in token.
   - Outcome: Resolved as *"Likely Maya's 10:30 interview (Arrived 3 min early · checked in)"*. Maya clicks `[ I'm on my way ]`.
2. **Scenario B — Expected Delivery (FedEx Supplies)**:
   - Delivery Entrance camera detects a package.
   - Matched to Office Supplies due today.
   - Outcome: Marked received by operations and logged into deliveries ledger.
3. **Scenario C — After-Hours Service vs. Unmatched Arrival**:
   - At 8:06 PM, a button press fires. With an AC maintenance work order on file, it matches the service contractor.
   - Without an appointment, it resolves calmly to `UNMATCHED ARRIVAL` with options to notify on-call or view live. AgentCore Policy strictly blocks automated unlocking.

---

## 5. Quickstart & Local Development

### Prerequisites
- Node.js >= 20.0
- pnpm >= 9.0

### Installation
```bash
# Clone the repository
git clone https://github.com/your-org/doorsignal.git
cd doorsignal

# Install all workspace dependencies
pnpm install
```

### Run Unit Tests
```bash
pnpm test:unit
```
Executes test suites covering:
- Ring HMAC-SHA256 signature verification & replay drift prevention
- Stage 1 filtering and Stage 2 heuristic scoring formulas
- Bedrock AgentCore Policy guardrail enforcement (blocking unlocks and biometrics)
- Arrival Case state machine transition rules

### Start Web Application & Demo Harness
```bash
pnpm --filter @doorsignal/web dev
```
Open **[http://localhost:3000](http://localhost:3000)** in your browser.

Use the **Hackathon Demo Controls** bar at the top of the screen to trigger Scenario A, B, or C with one click!

To experience the Visitor PWA, visit **[http://localhost:3000/visitor/northline](http://localhost:3000/visitor/northline)**.

---

## 6. Monorepo Structure

```
doorsignal/
├── apps/
│   ├── web/                     # Employee & Admin Next.js 14 App
│   └── visitor/                 # Zero-Install Visitor Check-in PWA
├── services/
│   ├── ring-webhooks/           # Lambda Webhook Ingest & HMAC Verifier
│   ├── arrival-resolver/        # Deterministic + Bedrock AgentCore Engine
│   ├── case-engine/             # Case CRUD, Candidate Evaluation & Actions
│   └── notifications/           # Dispatcher (In-app, SES, Webhooks)
├── packages/
│   ├── db/                      # 17-table Drizzle ORM PostgreSQL schema
│   ├── ring-client/             # Ring Partner API, WHEP & Simulation SDK
│   ├── arrival-schema/          # Shared Zod types & State Machine
│   ├── ui/                      # Ledger Palette design tokens & components
│   └── events/                  # EventBridge domain topics & event bus
├── infra/
│   └── cdk/                     # AWS CDK TypeScript infrastructure
└── docs/
    ├── friction-log.md          # Ring Partner API & AgentCore friction log (10% bonus)
    └── demo-script.md           # 3-minute video presentation script
```

---

## 7. Submission Artifacts & Compliance

- [Developer Friction Log](docs/friction-log.md): Details our runtime experience integrating Ring's WHEP stream, HMAC webhooks, and AWS Bedrock AgentCore Runtime (qualifying for the 10% Devpost bonus).
- [3-Minute Demo Video Script](docs/demo-script.md): Precise timing and narrative script for the Devpost demonstration.
- [License](LICENSE): Open-source Apache 2.0.

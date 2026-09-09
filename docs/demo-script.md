# DoorSignal: 3-Minute Hackathon Demo Script
*Submission Video Walkthrough for Ring Track & AWS Builder Mini Challenge*

---

## 0:00 – 0:15 | The Problem & Thesis
- **Visual**: DoorSignal Dashboard in Quiet State (`Today · Front Entry · Quiet · No active arrival`).
- **Voiceover**: 
  > "Small businesses and studios already have a camera at the door, meetings on a calendar, deliveries in email, and usually no receptionist. None of those systems know what the others know. Ring alerts you that 'motion was detected'—which tells you almost nothing. DoorSignal changes that. It's the physical inbox for your business, turning arrivals into actionable workflows."

---

## 0:15 – 0:50 | Scenario A: Expected Guest (Interview with Maya Patel)
- **Visual**: Click "Scenario A" in the demo bar or fire Ring Playground `button_press`.
- **UI Transition**: Quiet state immediately transforms into the **Active Arrival Card**:
  - Live Ring preview with compliance watermark.
  - Intent: `LIKELY EXPECTED ARRIVAL`.
  - Title: `Candidate interview with Maya Patel (10:30 – 11:15)`.
  - Explainability: `✓ Arrived 3 min early · ✓ Correct location · ✓ Guest checked in with token`.
- **Action**: Click `[ Notify Maya ]` -> Status notification appears -> Click `[ I'm on my way ]`.
- **Cut to Mobile PWA (`/visitor/northline`)**: Visitor screen confirms: `"Maya Patel has been notified. Please wait by the entrance."`
- **Voiceover**:
  > "Alex arrives 3 minutes early for his 10:30 design interview. When he rings the bell, DoorSignal doesn't run facial recognition. It correlates the sensor event with Maya's calendar and his QR check-in token. Maya receives the Door Card, clicks 'On my way', and Alex's phone immediately tells him she's coming down. Zero biometrics. Pure operational context."

---

## 0:50 – 1:25 | Scenario B: Package Arrival (FedEx Office Supplies)
- **Visual**: Click "Scenario B" in the demo bar. Ring Stick Up Cam at Delivery Entrance detects package.
- **UI Transition**: Active card updates:
  - Intent: `EXPECTED DELIVERY`.
  - Title: `Office Supplies (FedEx) · Due Today`.
  - Sensor: `Delivery Entrance`.
- **Action**: Click `[ Mark Received ]` -> Case resolves and appears instantly on the `/deliveries` board under `Awaiting Collection`.
- **Voiceover**:
  > "At 2:14 PM, FedEx rings the Delivery Entrance. DoorSignal matches the package event with scheduled office supplies due today. Operations marks it received with one tap, notifying the team. When Sarah grabs it later, she marks it collected. Simple, calm delivery operations."

---

## 1:25 – 2:05 | Scenario C: After-Hours Service vs Unmatched Arrival
- **Visual**: Click "Scenario C". Button press at 8:06 PM.
- **UI Transition**: First run shows AC maintenance appointment match.
- **Counter Scenario**: Remove service appointment and re-trigger.
- **UI Transition**: Case resolves to `UNMATCHED ARRIVAL`:
  - `No visit, delivery or service appointment is scheduled.`
  - Options: `[ Notify on-call ]` `[ View live ]` `[ Dismiss ]`.
- **Voiceover**:
  > "Notice what happens when someone arrives after hours with no scheduled appointment. DoorSignal doesn't label them a 'suspicious intruder' or invent threat scores. It reports the objective truth: 'Unmatched arrival. No visit or delivery is scheduled.' The on-call supervisor can view the receive-only live stream or dismiss it. DoorSignal's AgentCore policy strictly forbids automated door unlocking."

---

## 2:05 – 2:40 | Architecture & AWS Intelligence
- **Visual**: Architecture diagram overlay showing:
  - `Ring Device / Playground` -> `API Gateway` -> `HMAC Verifier` -> `EventBridge` -> `AgentCore Runtime + Strands` -> `AgentCore Policy` -> `DoorSignal Web App`.
  - Highlight Bedrock AgentCore trace log showing deterministic filter -> scoring -> tool calls -> policy check.
- **Voiceover**:
  > "Under the hood, DoorSignal pairs the Ring Partner API with AWS Bedrock AgentCore Runtime. EventBridge handles the real-time event pipeline, while Strands agents query calendar and check-in tools. Crucially, AgentCore Policy acts as a hard guardrail: the agent can never trigger physical locks or access biometrics."

---

## 2:40 – 3:00 | Conclusion & Vision
- **Visual**: Settings & Privacy Center showing Ring data purge button, then the DoorSignal brand mark `│•│`.
- **Voiceover**:
  > "DoorSignal turns Ring into a commercial sensor for business software. No kiosks. No receptionist. No new hardware. Turn arrivals into workflows."

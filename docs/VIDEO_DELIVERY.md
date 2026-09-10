# DoorSignal video delivery

The rendered DoorSignal demonstration is exactly **2:45** and uses real recordings of the deployed public judge demo. It opens with the Amazon Developer Hackathon 2026 and target-track slate, demonstrates the three complete workflows, explains the Ring and AWS path, and closes on a bright 15-second DoorSignal call to action. The final frame size is 1920 × 1080 at 30 fps with H.264 video and 48 kHz stereo AAC audio.

## Deliverables

- `artifacts/video/render/doorsignal-demo-1080p-captioned.mp4` — recommended upload file with open English captions.
- `artifacts/video/render/doorsignal-demo-1080p.mp4` — clean master for platforms that display the supplied SRT.
- `artifacts/video/render/doorsignal-demo-en.srt` — UTF-8 English captions.
- `assets/submission/doorsignal-youtube-upload-3840x2160.jpg` — YouTube thumbnail upload.

The media outputs are intentionally ignored by Git because they are delivery artifacts. Run `scripts/render_demo_video.py` with the bundled Pillow/NumPy Python runtime and FFmpeg to rebuild them from the recorded sources.

## Production record

- Narrator: Higgsfield Text to Speech 2.0, ElevenLabs engine, Reid male preset (`66469f5a-10db-586a-bab1-72f6ee66ba69`).
- Music: original Higgsfield Sonilo Music generation, instrumental only.
- Product capture: `https://doorsignal.site`, isolated fictional judge sessions, 1920 × 1080 desktop and 430 × 932 visitor view.
- Mix: measured −15.6 LUFS integrated and −1.27 dBTP after AAC encoding, with narration over an 11% instrumental bed.
- Captions: sentence-timed sidecar plus deterministic open-caption cards.
- Edit: one prepared operator session and one visitor session; loading and reload intervals are excluded from the timeline.
- Validation: full-file decode succeeds; duration 165.000 seconds; exactly 4,950 video frames; H.264/AAC; 1920 × 1080; constant 30 fps; 48 kHz stereo.
- Timing QC: AWS architecture remains visible at 02:25; the CTA begins at 02:30; the 02:44.8 frame remains bright and branded.
- Narration QC: final speech windows are 10.240s, 31.200s, 21.582s, 21.840s, and 37.360s. No time stretching is applied.

## Provider-evidence gate

The current edit accurately shows the deployed integration screen, including the reconnect state. Replace that short segment with an official Ring playground call after the account holder completes Amazon Developer sign-in. Do not represent the reconnect screen as successful live Ring evidence.

Amazon Bedrock returned `ValidationException: Operation not allowed` for Nova 2 Lite in the current AWS account. The video therefore describes and shows the validated unknown-on-failure boundary rather than claiming a successful model response.

## Checksums

```text
a063efef7228ec8665e9548caf8050ef1b79d2e02d3e100d738f305bab36d91a  doorsignal-demo-1080p.mp4
7a0678fb9cd6523efad24639d235bc0d70d1ee9feb6b91cba6c0da729cf2cf74  doorsignal-demo-1080p-captioned.mp4
2c9a5b2febd3066c9c2dc5b42e64a9e6aa899886f0f199fb1a4ded0c09f70b04  doorsignal-demo-en.srt
```

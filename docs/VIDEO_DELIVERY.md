# DoorSignal video delivery

The rendered DoorSignal demonstration is exactly **2:45** and uses real recordings of the deployed public judge demo. It opens with the Amazon Developer Hackathon 2026 and target-track slate, demonstrates the three complete workflows, explains the Ring and AWS path, and closes on a bright 15-second DoorSignal call to action. The final frame size is 1920 × 1080 at 30 fps with H.264 video and 48 kHz stereo AAC audio.

## Deliverables

- `artifacts/video/render/doorsignal-demo-1080p-captioned.mp4` — recommended upload file with open English captions.
- `artifacts/video/render/doorsignal-demo-1080p.mp4` — clean master for platforms that display the supplied SRT.
- `artifacts/video/render/doorsignal-demo-en.srt` — UTF-8 English captions.
- `assets/submission/doorsignal-youtube-upload-3840x2160.jpg` — YouTube thumbnail upload.

The media outputs are intentionally ignored by Git because they are delivery artifacts. Run `scripts/render_demo_video.py` with the bundled Pillow/NumPy Python runtime and FFmpeg to rebuild them from the recorded sources.

## Production record

- Narrator: Higgsfield Seed Audio 1.0, Kevin male preset (`f1373f24-3b96-433f-9a68-e595810ef608`), using the warm, grounded continuous-read approach proven in STAY.
- Music: original Higgsfield Sonilo Music generation, instrumental only.
- Product capture: `https://doorsignal.site`, isolated fictional judge sessions, 1920 × 1080 desktop and 430 × 932 visitor view.
- Mix: measured −14.30 LUFS integrated and −1.18 dBTP after AAC encoding, with narration over an 11% instrumental bed.
- Captions: sentence-timed sidecar plus deterministic open-caption cards.
- Edit: one prepared operator session and one visitor session; loading and reload intervals are excluded from the timeline.
- Validation: full-file decode succeeds; duration 165.000 seconds; exactly 4,950 video frames; H.264/AAC; 1920 × 1080; constant 30 fps; 48 kHz stereo.
- Timing QC: AWS architecture remains visible at 02:25; the CTA begins at 02:30; the 02:44.8 frame remains bright and branded.
- Narration QC: final file durations are 8.283s, 32.094s, 23.200s, 28.600s, and 39.780s; detected speech ends at 8.029s, 31.830s, 23.014s, 26.915s, and 38.283s. No time stretching is applied.

## Provider-evidence gate

The current edit accurately shows the deployed integration screen, including the reconnect state. Replace that short segment with an official Ring playground call after the account holder completes Amazon Developer sign-in. Do not represent the reconnect screen as successful live Ring evidence.

Amazon Bedrock returned `ValidationException: Operation not allowed` for Nova 2 Lite in the current AWS account. The video therefore describes and shows the validated unknown-on-failure boundary rather than claiming a successful model response.

## Checksums

```text
369695fd4b275b7b85161d2cc11a5da269b78bafe4745e90a708acaf4c7ff00e  doorsignal-demo-1080p.mp4
753016c912a901ced7815266f7d9640ee61378a0886a535edf30b9fb650a12a2  doorsignal-demo-1080p-captioned.mp4
a364b4ed75b392ba6c29b25535a49bcba5f33870a1a49b4f238cea903ba8cbc3  doorsignal-demo-en.srt
```

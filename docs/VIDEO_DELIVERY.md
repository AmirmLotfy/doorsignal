# DoorSignal video delivery

The rendered DoorSignal demonstration is exactly **2:45** and uses real recordings of the deployed public judge demo. The final frame size is 1920 × 1080 at 30 fps with H.264 video and 48 kHz stereo AAC audio.

## Deliverables

- `artifacts/video/render/doorsignal-demo-1080p-captioned.mp4` — recommended upload file with open English captions.
- `artifacts/video/render/doorsignal-demo-1080p.mp4` — clean master for platforms that display the supplied SRT.
- `artifacts/video/render/doorsignal-demo-en.srt` — UTF-8 English captions.
- `assets/submission/doorsignal-youtube-upload-3840x2160.jpg` — YouTube thumbnail upload.

The media outputs are intentionally ignored by Git because they are delivery artifacts. Run `scripts/render_demo_video.py` with the bundled Pillow/NumPy Python runtime and FFmpeg to rebuild them from the recorded sources.

## Production record

- Narrator: Higgsfield Seed Audio 1.0, Cillian preset.
- Music: original Higgsfield Sonilo Music generation, instrumental only.
- Product capture: `https://doorsignal.site`, isolated fictional judge sessions, 1920 × 1080 desktop and 430 × 932 visitor view.
- Mix: integrated loudness target −14 LUFS, true peak ceiling −1.5 dB, narration over an 11% instrumental bed.
- Captions: sentence-timed sidecar plus deterministic open-caption cards.
- Validation: full-file decode succeeds; duration 165.000 seconds; H.264/AAC; 1920 × 1080; 30 fps; 48 kHz stereo.

## Provider-evidence gate

The current edit accurately shows the deployed integration screen, including the reconnect state. Replace that short segment with an official Ring playground call after the account holder completes Amazon Developer sign-in. Do not represent the reconnect screen as successful live Ring evidence.

Amazon Bedrock returned `ValidationException: Operation not allowed` for Nova 2 Lite in the current AWS account. The video therefore describes and shows the validated unknown-on-failure boundary rather than claiming a successful model response.

## Checksums

```text
975af34d4ec91d2e731613d8d107524366fa868daa739c33f1ccaa17a4400654  doorsignal-demo-1080p.mp4
fef2eec44482b199f828420fc1127125e65862705142cd1e54cd21288d947851  doorsignal-demo-1080p-captioned.mp4
6f217b2a76f179f3a2f91f0dfa5b563ee8d053be592181bc28983a2ce148f717  doorsignal-demo-en.srt
```

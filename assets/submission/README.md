# DoorSignal submission images

The final graphics combine generated campaign key art with a real 1600 × 1000 capture of the deployed product. The interface planes are replaced by the exact browser capture before export, so judges see real product evidence rather than invented interface text.

- `doorsignal-devpost-1536x1024.png`: final 3:2 Devpost image.
- `doorsignal-youtube-master-3840x2160.png`: final 4K YouTube thumbnail master.
- `doorsignal-youtube-upload-3840x2160.jpg`: compressed 4K upload copy.
- `source/dashboard-desktop-1600x1000.png`: direct deployed-browser capture.
- `source/devpost-key-art.png` and `source/youtube-key-art.png`: generated campaign sources.
- `source/ring-entry-*-background.png`: earlier generated doorway studies retained as provenance.

Run `scripts/compose_submission_images.py` with the bundled workspace Python runtime to reproduce the final layouts.

These project-owned images were produced with OpenAI's internal image-generation model on September 10, 2026. The model created the two campaign scenes, including an original depiction of a modern Ring-style video doorbell; no third-party product photograph or stock asset was used. The final interface planes are composited from a direct capture of the deployed judge demo at `https://doorsignal.site/today`.

## Deliverables

- `doorsignal-devpost-1536x1024.png`: 1536 × 1024, 3:2, about 0.92 MB.
- `doorsignal-youtube-master-3840x2160.png`: exact 3840 × 2160 master.
- `doorsignal-youtube-upload-3840x2160.jpg`: exact 3840 × 2160 upload copy, progressive JPEG, about 0.89 MB.

## Devpost prompt

> Create a bold, editorial 3:2 product-launch cover showing one physically accurate Ring-style video doorbell at the threshold and the deployed DoorSignal dashboard as the dominant product proof. A single Ring-blue signal travels from the button and resolves into DoorSignal's terracotta status dot. Use a strong asymmetric grid, tactile architecture, confident grotesk typography, and exact copy: `DoorSignal`, `From doorbell to done.`, `Built with Ring + AWS`. No laptop, browser chrome, people, fake metrics, purple gradient, generic poster layout, or distorted hardware.

## YouTube prompt

> Create a striking 16:9 technology-campaign thumbnail showing a macro Ring-style doorbell press becoming an owned DoorSignal arrival. Use one blue-to-terracotta signal path, an oversized condensed headline, and the deployed dashboard filling the right half. Exact copy: `DoorSignal`, `FROM DOORBELL`, `TO DONE.`, `RING + AWS`. Keep the hardware plausible and the interface dominant. No laptop, phone, fake panels, reaction face, purple gradient, generic template, or random text.

The final layouts are reproduced by `scripts/compose_submission_images.py`. It places the exact DoorSignal logo, typed copy, and real 1600 × 1000 browser capture over the generated backgrounds, then exports the requested dimensions. Source generations remain in `assets/submission/source/` and the Codex generated-image store.

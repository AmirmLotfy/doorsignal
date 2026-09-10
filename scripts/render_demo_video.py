#!/usr/bin/env python3
"""Assemble the DoorSignal hackathon demo from real captures and Higgsfield audio."""

from __future__ import annotations

import math
import subprocess
import textwrap
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont


ROOT = Path(__file__).resolve().parents[1]
VIDEO = ROOT / "artifacts" / "video"
CAPTURES = VIDEO / "captures"
AUDIO = VIDEO / "audio"
RENDER = VIDEO / "render"
SUBMISSION = ROOT / "assets" / "submission"
FFMPEG = "/opt/homebrew/bin/ffmpeg"

WIDTH = 1920
HEIGHT = 1080
FPS = 30
TOTAL_SECONDS = 165.0
FONT_REGULAR = "/System/Library/Fonts/HelveticaNeue.ttc"
FONT_CONDENSED = "/System/Library/Fonts/Supplemental/DIN Condensed Bold.ttf"


def run(*args: str) -> None:
    subprocess.run([FFMPEG, "-hide_banner", "-loglevel", "error", "-y", *args], check=True)


def timecode(seconds: float, srt: bool = True) -> str:
    millis = round(seconds * 1000)
    hours, millis = divmod(millis, 3_600_000)
    minutes, millis = divmod(millis, 60_000)
    secs, millis = divmod(millis, 1000)
    separator = "," if srt else "."
    return f"{hours:02d}:{minutes:02d}:{secs:02d}{separator}{millis:03d}"


def make_architecture_card(path: Path) -> None:
    image = Image.new("RGB", (WIDTH, HEIGHT), "#101512")
    draw = ImageDraw.Draw(image)
    title = ImageFont.truetype(FONT_CONDENSED, 82)
    body = ImageFont.truetype(FONT_REGULAR, 31)
    small = ImageFont.truetype(FONT_REGULAR, 24)
    label = ImageFont.truetype(FONT_CONDENSED, 42)

    draw.text((120, 92), "THE LIVE PATH", font=title, fill="#f7f4ec")
    draw.text((120, 185), "Deployed in us-east-1 · durable before response", font=body, fill="#aeb8af")

    nodes = [
        (120, "RING\nEVENT"),
        (450, "API\nGATEWAY"),
        (780, "DYNAMO\nDB"),
        (1110, "EVENT\nBRIDGE"),
        (1440, "LAMBDA\nWORKER"),
    ]
    y = 400
    for index, (x, copy) in enumerate(nodes):
        draw.rounded_rectangle((x, y, x + 250, y + 170), radius=18, fill="#18211d", outline="#54665a", width=2)
        bbox = draw.multiline_textbbox((0, 0), copy, font=label, spacing=0, align="center")
        tw = bbox[2] - bbox[0]
        th = bbox[3] - bbox[1]
        draw.multiline_text((x + 125 - tw / 2, y + 85 - th / 2), copy, font=label, fill="#f7f4ec", spacing=0, align="center")
        if index < len(nodes) - 1:
            start = x + 264
            end = nodes[index + 1][0] - 14
            draw.line((start, y + 85, end, y + 85), fill="#4ca7ff", width=5)
            draw.polygon([(end, y + 85), (end - 16, y + 75), (end - 16, y + 95)], fill="#f25a3c")

    facts = [
        ("SIGNED BYTES", "Verified before parsing"),
        ("RETRIES + DLQ", "Failures stay visible"),
        ("NOVA 2 LITE", "Bounded facts; unknown on failure"),
        ("NO FACE ID", "People confirm identity and action"),
    ]
    for index, (head, detail) in enumerate(facts):
        x = 120 + index * 440
        draw.ellipse((x, 745, x + 18, 763), fill="#f25a3c" if index != 2 else "#4ca7ff")
        draw.text((x + 34, 726), head, font=label, fill="#f7f4ec")
        draw.text((x + 34, 785), detail, font=small, fill="#aeb8af")

    draw.text((120, 970), "DOORSIGNAL.SITE", font=label, fill="#f7f4ec")
    image.save(path, optimize=True)


def make_captions(path: Path) -> list[tuple[float, float, str]]:
    chapters = [
        (0.6, 11.281458, [
            "A doorbell can tell you someone arrived.",
            "It cannot tell your team why they are there, who owns the visit, or what happened next.",
            "DoorSignal turns Ring events into a shared arrival inbox.",
        ]),
        (13.5, 33.991042, [
            "Here is a guest arriving for a scheduled visit.",
            "DoorSignal records the event as a case and keeps the schedule match tentative.",
            "The sign opens a check-in page on the guest's own phone—no app and no camera permission.",
            "The guest shares a name and visit type, with consent.",
            "That check-in is stronger evidence, so the case updates.",
            "The host sees a clear reason, takes ownership, and responds.",
            "A moment later, the guest's page says the host is on the way.",
            "Every step is saved, and no facial recognition is used.",
        ]),
        (54.5, 25.28, [
            "Deliveries use the same calm handoff.",
            "A due package appears with an owner and its current state.",
            "Operations marks it received, so it moves to awaiting collection.",
            "When a teammate picks it up, one more action closes the case.",
            "The timeline records who changed the state, and a stale or repeated action cannot overwrite the latest result.",
        ]),
        (86.0, 24.620917, [
            "A scheduled service visit can be suggested from its time window and location.",
            "DoorSignal still asks a person to confirm.",
            "After hours, the same door event with no matching appointment becomes an unmatched arrival.",
            "It does not invent an identity or a threat score.",
            "It states what is known, marks the case for human review, and exposes only application-approved actions.",
        ]),
        (118.0, 38.2, [
            "This is the live path.",
            "DoorSignal calls Ring's server-side API for device discovery, event history, and receive-only WHEP sessions.",
            "Signed webhook bytes are persisted before the response.",
            "DynamoDB Streams and EventBridge drive a retryable Lambda worker.",
            "Nova 2 Lite is bounded to coarse scene facts; malformed or unavailable results become unknown.",
            "Failed work goes to a dead-letter queue.",
            "DoorSignal gives a small workplace the clarity of a front desk using the Ring devices it already has.",
            "Guests know someone heard them. Teams know what needs action.",
            "From doorbell to done.",
        ]),
    ]
    cues: list[tuple[float, float, str]] = []
    for start, duration, sentences in chapters:
        weights = [max(3, len(sentence.split())) for sentence in sentences]
        available = duration - 0.15 * (len(sentences) - 1)
        cursor = start
        for sentence, weight in zip(sentences, weights, strict=True):
            cue_duration = available * weight / sum(weights)
            cues.append((cursor, cursor + cue_duration, sentence))
            cursor += cue_duration + 0.15

    lines = []
    for index, (start, end, copy) in enumerate(cues, 1):
        lines.extend([str(index), f"{timecode(start)} --> {timecode(end)}", copy, ""])
    path.write_text("\n".join(lines), encoding="utf-8")
    return cues


def make_mobile_card(kicker: str, path: Path) -> None:
    image = Image.new("RGB", (WIDTH, HEIGHT), "#101512")
    draw = ImageDraw.Draw(image)
    title = ImageFont.truetype(FONT_CONDENSED, 82)
    body = ImageFont.truetype(FONT_REGULAR, 31)
    draw.text((120, 300), kicker, font=title, fill="#f7f4ec")
    draw.text((120, 408), "Voluntary check-in. No app. No camera.", font=body, fill="#aeb8af")
    draw.ellipse((120, 500, 142, 522), fill="#f25a3c")
    draw.line((151, 511, 545, 511), fill="#4ca7ff", width=4)
    path.parent.mkdir(parents=True, exist_ok=True)
    image.save(path, optimize=True)


def make_caption_cards(cues: list[tuple[float, float, str]]) -> list[Path]:
    cards_dir = RENDER / "caption-cards"
    cards_dir.mkdir(parents=True, exist_ok=True)
    font = ImageFont.truetype(FONT_REGULAR, 36)
    cards = []
    for index, (_, _, copy) in enumerate(cues, 1):
        lines = textwrap.wrap(copy, width=68)
        card = Image.new("RGBA", (1520, 176), (0, 0, 0, 0))
        draw = ImageDraw.Draw(card)
        draw.rounded_rectangle((0, 0, 1519, 175), radius=24, fill=(16, 21, 18, 220), outline=(117, 130, 120, 130), width=2)
        line_height = 48
        total_height = len(lines) * line_height
        y = (176 - total_height) / 2
        for line in lines:
            bbox = draw.textbbox((0, 0), line, font=font)
            x = (1520 - (bbox[2] - bbox[0])) / 2
            draw.text((x, y), line, font=font, fill="#ffffff")
            y += line_height
        path = cards_dir / f"caption-{index:02d}.png"
        card.save(path, optimize=True)
        cards.append(path)
    return cards


def render_standard(source: Path, target: Path, source_start: float, source_end: float, duration: float) -> None:
    speed = duration / (source_end - source_start)
    fade_out = max(0, duration - 0.18)
    vf = (
        f"trim=start={source_start}:end={source_end},setpts={speed}*(PTS-STARTPTS),"
        f"fps={FPS},scale={WIDTH}:{HEIGHT}:force_original_aspect_ratio=decrease,"
        f"pad={WIDTH}:{HEIGHT}:(ow-iw)/2:(oh-ih)/2:color=#101512,"
        f"fade=t=in:st=0:d=0.16,fade=t=out:st={fade_out}:d=0.18,format=yuv420p"
    )
    run("-i", str(source), "-an", "-vf", vf, "-t", str(duration), "-c:v", "libx264", "-preset", "medium", "-crf", "18", str(target))


def render_mobile(source: Path, target: Path, source_start: float, source_end: float, duration: float, kicker: str) -> None:
    speed = duration / (source_end - source_start)
    card = RENDER / f"mobile-{target.stem}.png"
    make_mobile_card(kicker, card)
    filter_complex = (
        f"[0:v]fps={FPS},scale={WIDTH}:{HEIGHT}[bg];"
        f"[1:v]trim=start={source_start}:end={source_end},setpts={speed}*(PTS-STARTPTS),"
        f"fps={FPS},scale=-2:940[phone];"
        f"[bg][phone]overlay=x=1240:y=70:shortest=1[composite];"
        "[composite]fade=t=in:st=0:d=0.16,"
        f"fade=t=out:st={max(0, duration - 0.18)}:d=0.18,format=yuv420p[out]"
    )
    run("-loop", "1", "-i", str(card), "-i", str(source), "-filter_complex", filter_complex, "-map", "[out]", "-an", "-t", str(duration), "-c:v", "libx264", "-preset", "medium", "-crf", "18", str(target))


def render_captioned(clean: Path, captioned: Path, cues: list[tuple[float, float, str]]) -> None:
    cards = make_caption_cards(cues)
    args = ["-i", str(clean)]
    for card in cards:
        args.extend(["-loop", "1", "-i", str(card)])
    filters = ["[0:v]setpts=PTS-STARTPTS[v0]"]
    current = "v0"
    for index, (start, end, _) in enumerate(cues, 1):
        next_name = f"v{index}"
        filters.append(
            f"[{current}][{index}:v]overlay=x=200:y=860:enable='between(t,{start:.3f},{end:.3f})'[{next_name}]"
        )
        current = next_name
    args.extend([
        "-filter_complex", ";".join(filters), "-map", f"[{current}]", "-map", "0:a:0",
        "-t", str(TOTAL_SECONDS), "-c:v", "libx264", "-preset", "slow", "-crf", "18",
        "-c:a", "copy", "-movflags", "+faststart", str(captioned),
    ])
    run(*args)


def render_still(source: Path, target: Path, duration: float, reverse: bool = False) -> None:
    frames = math.ceil(duration * FPS)
    zoom = "if(lte(zoom,1.0),1.0,max(1.0,zoom-0.00035))" if reverse else "min(zoom+0.00035,1.06)"
    vf = (
        f"scale=4000:-2,zoompan=z='{zoom}':x='iw/2-(iw/zoom/2)':"
        f"y='ih/2-(ih/zoom/2)':d={frames}:s={WIDTH}x{HEIGHT}:fps={FPS},"
        f"fade=t=in:st=0:d=0.35,fade=t=out:st={max(0, duration - 0.45)}:d=0.45,format=yuv420p"
    )
    run("-loop", "1", "-i", str(source), "-an", "-vf", vf, "-t", str(duration), "-c:v", "libx264", "-preset", "medium", "-crf", "18", str(target))


def main() -> None:
    RENDER.mkdir(parents=True, exist_ok=True)
    architecture = RENDER / "architecture.png"
    captions = RENDER / "doorsignal-demo-en.srt"
    make_architecture_card(architecture)
    cues = make_captions(captions)

    segments = [RENDER / f"segment-{index:02d}.mp4" for index in range(1, 12)]
    render_still(SUBMISSION / "doorsignal-youtube-upload-3840x2160.jpg", segments[0], 5.0)
    render_standard(CAPTURES / "01-opening.webm", segments[1], 0, 15.6, 8.0)
    render_standard(CAPTURES / "02-guest-operator.webm", segments[2], 0, 20, 12.0)
    render_mobile(CAPTURES / "03-guest-visitor.webm", segments[3], 0, 18, 12.0, "A GOOD WELCOME STARTS HERE")
    render_standard(CAPTURES / "02-guest-operator.webm", segments[4], 20, 39, 11.0)
    render_mobile(CAPTURES / "03-guest-visitor.webm", segments[5], 18, 30, 6.0, "THEY'RE ON THEIR WAY")
    render_standard(CAPTURES / "04-delivery.webm", segments[6], 4.5, 28.6, 28.6)
    render_standard(CAPTURES / "05-service-unmatched.webm", segments[7], 4.5, 30.84, 30.84)
    render_standard(CAPTURES / "06-integrations.webm", segments[8], 4.5, 23.84, 23.84)
    render_still(architecture, segments[9], 15.0)
    render_still(SUBMISSION / "doorsignal-youtube-upload-3840x2160.jpg", segments[10], 12.72, reverse=True)

    concat_file = RENDER / "segments.txt"
    concat_file.write_text("\n".join(f"file '{segment.name}'" for segment in segments) + "\n", encoding="utf-8")
    silent_video = RENDER / "doorsignal-demo-silent.mp4"
    run("-f", "concat", "-safe", "0", "-i", str(concat_file), "-c", "copy", str(silent_video))

    clean = RENDER / "doorsignal-demo-1080p.mp4"
    mix = (
        "[1:a]atrim=0:165,afade=t=in:st=0:d=1.2,afade=t=out:st=160:d=5,volume=0.11[music];"
        "[2:a]highpass=f=70,lowpass=f=14500,adelay=600|600[vo1];"
        "[3:a]highpass=f=70,lowpass=f=14500,adelay=13500|13500[vo2];"
        "[4:a]highpass=f=70,lowpass=f=14500,adelay=54500|54500[vo3];"
        "[5:a]highpass=f=70,lowpass=f=14500,adelay=86000|86000[vo4];"
        "[6:a]highpass=f=70,lowpass=f=14500,adelay=118000|118000[vo5];"
        "[music][vo1][vo2][vo3][vo4][vo5]amix=inputs=6:duration=longest:normalize=0,"
        "loudnorm=I=-14:TP=-1.5:LRA=7,atrim=0:165[aout]"
    )
    run(
        "-i", str(silent_video),
        "-i", str(AUDIO / "music-original.m4a"),
        "-i", str(AUDIO / "vo-01-problem.wav"),
        "-i", str(AUDIO / "vo-02-guest.wav"),
        "-i", str(AUDIO / "vo-03-delivery.wav"),
        "-i", str(AUDIO / "vo-04-service.wav"),
        "-i", str(AUDIO / "vo-05-integration-close.wav"),
        "-filter_complex", mix,
        "-map", "0:v:0", "-map", "[aout]", "-c:v", "copy", "-c:a", "aac", "-ar", "48000", "-b:a", "192k",
        "-movflags", "+faststart", "-t", str(TOTAL_SECONDS), str(clean),
    )

    captioned = RENDER / "doorsignal-demo-1080p-captioned.mp4"
    render_captioned(clean, captioned, cues)

    print(clean)
    print(captioned)
    print(captions)


if __name__ == "__main__":
    main()

#!/usr/bin/env python3
"""Place the exact deployed UI into the generated submission key art."""

from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw


ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "assets" / "submission" / "source"
OUT = ROOT / "assets" / "submission"


def perspective_coefficients(destination, source):
    """Return PIL coefficients mapping destination pixels to source pixels."""
    matrix = []
    values = []
    for (x, y), (u, v) in zip(destination, source, strict=True):
        matrix.append([x, y, 1, 0, 0, 0, -u * x, -u * y])
        values.append(u)
        matrix.append([0, 0, 0, x, y, 1, -v * x, -v * y])
        values.append(v)
    return np.linalg.solve(np.asarray(matrix, dtype=float), np.asarray(values, dtype=float))


def replace_product_plane(key_art: Path, destination, output_size, png_path: Path, jpg_path: Path | None = None):
    canvas = Image.open(key_art).convert("RGBA")
    screenshot = Image.open(SOURCE / "dashboard-desktop-1600x1000.png").convert("RGBA")
    sw, sh = screenshot.size
    source = [(0, 0), (sw - 1, 0), (sw - 1, sh - 1), (0, sh - 1)]
    coefficients = perspective_coefficients(destination, source)
    warped = screenshot.transform(
        canvas.size,
        Image.Transform.PERSPECTIVE,
        coefficients,
        resample=Image.Resampling.BICUBIC,
        fillcolor=(0, 0, 0, 0),
    )
    mask = Image.new("L", canvas.size, 0)
    ImageDraw.Draw(mask).polygon(destination, fill=255)
    canvas.alpha_composite(Image.composite(warped, Image.new("RGBA", canvas.size), mask))

    final = canvas.convert("RGB").resize(output_size, Image.Resampling.LANCZOS)
    final.save(png_path, optimize=True)
    if jpg_path:
        final.save(jpg_path, quality=92, optimize=True, progressive=True)


replace_product_plane(
    SOURCE / "devpost-key-art.png",
    [(600, 371), (1493, 308), (1510, 1014), (599, 1005)],
    (1536, 1024),
    OUT / "doorsignal-devpost-1536x1024.png",
)

replace_product_plane(
    SOURCE / "youtube-key-art.png",
    [(768, 116), (1646, 79), (1645, 880), (769, 836)],
    (3840, 2160),
    OUT / "doorsignal-youtube-master-3840x2160.png",
    OUT / "doorsignal-youtube-upload-3840x2160.jpg",
)

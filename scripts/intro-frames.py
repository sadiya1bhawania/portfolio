#!/usr/bin/env python3
"""Make the web versions of the homepage intro frames.

Run from the repo root:
    python3 scripts/intro-frames.py

Reads:   sadie-frames/production/00_intro/*.png
Writes:  public/experience/frames/intro_*.webp

All frames share one framing, so none is cropped, moved or resized.
"""
import numpy as np
from PIL import Image

for name in ["intro_type_01", "intro_type_02", "intro_lookup"]:
    a = np.array(Image.open(f"sadie-frames/production/00_intro/{name}.png").convert("RGBA"))
    a[:, :, 3][a[:, :, 3] < 16] = 0  # stray edge specks
    im = Image.fromarray(a)
    assert im.size == (1024, 1536), (name, im.size)
    im.save(f"public/experience/frames/{name}.webp", "WEBP", quality=86, alpha_quality=100, method=6)

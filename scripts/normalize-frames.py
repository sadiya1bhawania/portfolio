#!/usr/bin/env python3
"""Normalize Sadie's Walk frames onto one canvas, scale and ground line.

Run from the repo root:
    pip install pillow numpy scipy
    python3 scripts/normalize-frames.py

Reads:   sadie-frames/previous_sequences/walk/NN_frame.png
         sadie-frames/01_avalara/storyboard.png
         sadie-frames/source_images/* (front poses, graduation, cap throw)
Writes:  public/experience/frames/*.png and manifest.json

Frame contract: 700x1100 canvas (render at 350x550 CSS), shoe soles on y=1060,
head centre on x=350, standing figure about 880px tall.
"""
import glob
import json
import os

import numpy as np
from PIL import Image, ImageDraw, ImageFilter
from scipy import ndimage

SRC = "sadie-frames"
OUT = "public/experience/frames"
CW, CH, BASE, AX = 700, 1100, 1060, 350
S_SB = 2 * 440 / 375          # storyboard figures -> 880px tall
S_W = S_SB * 375 / 336        # walk-cycle figures are drawn smaller

os.makedirs(OUT, exist_ok=True)


def place(rgba, alpha, scale, name):
    a = np.array(rgba).astype(np.uint8).copy()
    a[:, :, 3] = alpha.astype(np.uint8)
    im = Image.fromarray(a, "RGBA")
    im = im.crop(im.getbbox())
    mask = np.array(im)[:, :, 3] > 40
    top = int(np.argmax(mask.any(1)))
    head = mask[top: top + int(0.12 * mask.shape[0])]
    cols = np.where(head.any(0))[0]
    hc = (cols.min() + cols.max()) / 2
    im = im.resize((int(im.width * scale), int(im.height * scale)), Image.LANCZOS)
    canvas = Image.new("RGBA", (CW, CH), (0, 0, 0, 0))
    canvas.paste(im, (int(AX - hc * scale), int(BASE - im.height)), im)
    path = os.path.join(OUT, name)
    canvas.save(path, optimize=True)
    return {"file": "/experience/frames/" + name, "w": CW, "h": CH, "baseline": BASE, "headX": AX}


def figure_mask(key, A, na, lab, pad=0):
    h, w = na.shape
    xs = np.arange(w)[None, :] - pad      # panel coordinates (negative = neighbour margin)
    ys = np.arange(h)[:, None]
    sizes = ndimage.sum(na > 40, lab, range(1, lab.max() + 1))
    objs = ndimage.find_objects(lab)
    cand = [i + 1 for i, s in enumerate(objs)
            if s[1].start - pad < 130 and s[0].start < 110 and sizes[i] > 8000 and s[0].stop > 250]
    m = np.isin(lab, cand)
    r, g, b = A[:, :, 0], A[:, :, 1], A[:, :, 2]
    skin = (r > 150) & (r > b + 25)
    if key == "02":    # cut the tax-form pile away from her elbow
        m &= (xs < 86) | ((xs < 112) & (ys < 240))
    if key in ("07", "08"):    # remove the switch, keep her fingertip
        rect = (xs >= 118) & (ys >= 95) & (ys <= 195)
        m &= ~(rect & ~skin & ~((r < 55) & (g < 55) & (b < 55)))
        m &= ~(xs > 200)
    if key == "10":    # remove the result panel, keep her open hand
        m &= ~((xs >= 192) & ~(skin & (xs < 216) & (ys > 145) & (ys < 185)))
    lum = 0.3 * r + 0.59 * g + 0.11 * b
    m &= (xs >= 0) | (lum < 140)           # from the neighbour panel keep only dark hair
    m = ndimage.binary_opening(m, iterations=1)
    lab2, n2 = ndimage.label(m)
    if n2 > 1:
        s2 = ndimage.sum(m, lab2, range(1, n2 + 1))
        m = np.isin(lab2, [i + 1 for i, v in enumerate(s2) if v > 0.02 * s2.max()])
    return m


manifest = {"contract": {"canvas": [CW, CH], "css": [CW // 2, CH // 2], "baseline": BASE, "headX": AX},
            "walk": [], "avalara": {}}

# Base walk cycle: only frames 01-06 are a clean side-view stride.
# Frames 07-12 rotate her toward / away from the camera, so they are skipped.
for old in glob.glob(os.path.join(OUT, "walk_*.png")):
    os.remove(old)
for n in ["01", "02", "03", "04", "05", "06"]:
    im = Image.open(os.path.join(SRC, f"previous_sequences/walk/{n}_frame.png")).convert("RGBA")
    # source alpha is 1-bit; soften it so edges don't look jagged after scaling
    soft = np.array(im.getchannel("A").filter(ImageFilter.GaussianBlur(0.8))).astype(np.float32)
    manifest["walk"].append(place(im, soft, S_W, f"walk_{n}.png"))

# Avalara beats, cut straight from the storyboard (6 x 2 grid)
sb = Image.open(os.path.join(SRC, "01_avalara/storyboard.png")).convert("RGBA")
M = 80
cw, ch = sb.width / 6, sb.height / 2
beats = {"02": (0, 1, "spot"), "03": (0, 2, "plan"), "04": (0, 3, "build"),
         "07": (1, 0, "reach"), "08": (1, 1, "flip"), "09": (1, 2, "morph"), "10": (1, 3, "reveal")}
for key, (row, col, beat) in beats.items():
    left = max(0, int(col * cw) - M)        # hair often spills into the neighbouring panel
    cell = sb.crop((left, int(row * ch), int((col + 1) * cw), int((row + 1) * ch)))
    pad = int(col * cw) - left
    A = np.array(cell).astype(np.float32)
    na = np.clip((A[:, :, 3] - 150) / 85, 0, 1) * 255     # drop the haze background
    lab, _ = ndimage.label(na > 40)
    m = figure_mask(key, A, na, lab, pad)
    alpha = np.where(ndimage.binary_dilation(m, iterations=1), na, 0)
    manifest["avalara"][beat] = place(Image.fromarray(A.astype(np.uint8), "RGBA"), alpha, S_SB, f"av_{key}.png")

# ---------- front poses + graduation (white-background sources) ----------
def cutout(path):
    im = Image.open(path).convert("RGBA")
    w, h = im.size
    if np.array(im)[2, 2, 3] > 200:
        for pt in [(0, 0), (w - 1, 0), (0, h - 1), (w - 1, h - 1), (w // 2, 0), (0, h // 2), (w - 1, h // 2), (w // 2, h - 1)]:
            try:
                ImageDraw.floodfill(im, pt, (255, 0, 255, 0), thresh=40)
            except Exception:
                pass
    A = np.array(im)
    A[(A[:, :, 0] == 255) & (A[:, :, 1] == 0) & (A[:, :, 2] == 255)] = 0
    # white gaps trapped between hair curls: pure neutral white islands ringed by dark hair
    rgb = A[:, :, :3].astype(int)
    white = (A[:, :, 3] > 0) & (rgb.min(2) >= 240) & (rgb.max(2) - rgb.min(2) < 10)
    bb = Image.fromarray(A).getbbox() or (0, 0, w, h)
    lab, n = ndimage.label(white)
    lum = rgb @ np.array([0.3, 0.59, 0.11])
    for i, sl in enumerate(ndimage.find_objects(lab), 1):
        if sl is None or sl[0].stop > bb[1] + 0.62 * (bb[3] - bb[1]):
            continue                      # only the hair zone; sneakers stay white
        comp = lab[sl] == i
        if comp.sum() < 12:
            continue
        ring = ndimage.binary_dilation(lab == i, iterations=3) & ~(lab == i)
        if (lum[ring] < 90).mean() > 0.6:
            A[lab == i] = 0
    y0 = int(h * 0.85)
    sub = A[y0:]
    r, g, b, a = [sub[:, :, i].astype(int) for i in range(4)]
    sub[(a > 0) & (abs(r - g) < 14) & (abs(g - b) < 14) & (r > 150) & (r < 238)] = 0
    A[y0:] = sub
    return A


def put(A, scale, name, ox=None, baseline=None):
    im = Image.fromarray(A, "RGBA")
    bb = im.getbbox()
    big = im.resize((int(im.width * scale), int(im.height * scale)), Image.LANCZOS)
    cx = ((bb[0] + bb[2]) / 2 if ox is None else ox) * scale
    bot = (bb[3] if baseline is None else baseline) * scale
    dx, dy = int(AX - cx), int(BASE - bot)
    canvas = Image.new("RGBA", (CW, CH), (0, 0, 0, 0))
    canvas.paste(big, (dx, dy), big)
    canvas.save(os.path.join(OUT, name), optimize=True)
    return dx, dy


def anchors(name):
    """Face box and hand positions in CSS px (frame box 350x550), for overlays like hats and badges."""
    A = np.array(Image.open(os.path.join(OUT, name))).astype(int)
    r, g, b, a = [A[:, :, i] for i in range(4)]
    skin = (a > 200) & (r > 200) & (g > 160) & (b > 120) & (r > b + 30)
    lab, n = ndimage.label(skin)
    sizes = ndimage.sum(skin, lab, range(1, n + 1))
    objs = ndimage.find_objects(lab)
    blobs = sorted([(sizes[i], objs[i]) for i in range(n)], key=lambda t: -t[0])[:3]
    face = blobs[0][1]
    hands = [{"x": round((s[1].start + s[1].stop) / 4), "y": round((s[0].start + s[0].stop) / 4)} for _, s in blobs[1:]]
    return {"faceCx": round((face[1].start + face[1].stop) / 4), "faceTop": face[0].start // 2,
            "faceBottom": face[0].stop // 2, "hands": hands}


def face_width(A):
    r, g, b, a = [A[:, :, i].astype(int) for i in range(4)]
    skin = (a > 200) & (r > 210) & (g > 170) & (b > 130) & (r > b + 30)
    lab, n = ndimage.label(skin[:800])
    sizes = ndimage.sum(skin[:800], lab, range(1, n + 1))
    o = ndimage.find_objects(lab)[int(np.argmax(sizes))]
    return o[1].stop - o[1].start


SI = os.path.join(SRC, "source_images")
front = {"front_pocket": "imagegen.png",
         "front_present": "faceless_woman_presenting_in_casual_style.png",
         "front_wave": "waving_woman_in_jeans_and_sneakers.png",
         "ne_stand": "northeastern_university_graduate_illustration.png"}
ref = cutout(os.path.join(SI, front["front_pocket"]))
rb = Image.fromarray(ref).getbbox()
S_F = 880 / (rb[3] - rb[1])
manifest["poses"] = {}
for name, fn in front.items():
    put(cutout(os.path.join(SI, fn)), S_F, name + ".png")
    manifest["poses"][name] = {"file": "/experience/frames/" + name + ".png", "anchors": anchors(name + ".png")}

throw = {"ne_hold": "a_clean_vector_cartoon_style_illustration_on_a_whi.png",
         "ne_lift": "a_clean_vector_flat_cartoon_illustration_full_bod.png",
         "ne_toss": "a_clean_vector_illustration_on_a_white_background.png"}
# optional in-between frames (same size/style as the throw images), used if present
for name, fn in [("ne_mid_grab", "ne_mid_grab.png"), ("ne_mid_release", "ne_mid_release.png")]:
    if os.path.exists(os.path.join(SI, fn)):
        throw[name] = fn
hold = cutout(os.path.join(SI, throw["ne_hold"]))
S_T = S_F * face_width(ref) / face_width(hold)
base_t = Image.fromarray(hold).getbbox()[3]
manifest["northeastern"] = {}
for name, fn in throw.items():
    A = cutout(os.path.join(SI, fn))
    dx, dy = put(A, S_T, name + ".png", ox=512, baseline=base_t)
    manifest["northeastern"][name] = {"file": "/experience/frames/" + name + ".png"}
    manifest["northeastern"]["order"] = [k for k in ["ne_hold", "ne_mid_grab", "ne_lift", "ne_mid_release", "ne_toss"]
                                         if k in throw]
    if name == "ne_lift":   # cut the cap out so it can fly on its own
        cap = A.copy()
        ys, xs = np.mgrid[0:cap.shape[0], 0:cap.shape[1]]
        keep = (xs >= 395) & (xs < 705) & (ys >= 20) & (ys < 262) & ~((ys > 212) & (xs < 590))
        cap[~keep] = 0
        ci = Image.fromarray(cap, "RGBA")
        cb = ci.getbbox()
        ci = ci.crop(cb)
        ci = ci.resize((int(ci.width * S_T), int(ci.height * S_T)), Image.LANCZOS)
        ci.save(os.path.join(OUT, "ne_cap.png"), optimize=True)
        manifest["northeastern"]["ne_cap"] = {"file": "/experience/frames/ne_cap.png",
                                              "x": (dx + int(cb[0] * S_T)) // 2, "y": (dy + int(cb[1] * S_T)) // 2,
                                              "w": ci.width // 2, "h": ci.height // 2,
                                              "note": "CSS px inside the 350x550 frame box, where the cap sits in ne_lift"}

with open(os.path.join(OUT, "manifest.json"), "w") as fh:
    json.dump(manifest, fh, indent=2)
print(f"wrote {len(manifest['walk'])} walk, {len(manifest['avalara'])} avalara, "
      f"{len(manifest['poses'])} poses, {len(manifest['northeastern'])} graduation assets to {OUT}")
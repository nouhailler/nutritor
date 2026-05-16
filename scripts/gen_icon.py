#!/usr/bin/env python3
"""Generate Nutritor app icons (icon.png, adaptive-icon.png, splash-icon.png)."""

import math
from PIL import Image, ImageDraw, ImageFont

FONT_PATH = "node_modules/@expo-google-fonts/instrument-serif/400Regular/InstrumentSerif_400Regular.ttf"

# Brand palette
BG   = (26,  24,  20,  255)   # #1A1814 — ink
INK  = (242, 237, 226, 255)   # #F2EDE2 — paper
OK   = (63,  90,  58,  255)   # #3F5A3A — green
SIG  = (107, 90,  46,  255)   # #6B5A2E — amber

def draw_rounded_rect(draw, x0, y0, x1, y1, r, fill):
    draw.rectangle([x0 + r, y0, x1 - r, y1], fill=fill)
    draw.rectangle([x0, y0 + r, x1, y1 - r], fill=fill)
    draw.ellipse([x0, y0, x0 + 2*r, y0 + 2*r], fill=fill)
    draw.ellipse([x1 - 2*r, y0, x1, y0 + 2*r], fill=fill)
    draw.ellipse([x0, y1 - 2*r, x0 + 2*r, y1], fill=fill)
    draw.ellipse([x1 - 2*r, y1 - 2*r, x1, y1], fill=fill)

def draw_leaf(draw, cx, cy, r, color):
    """Draw a small 3-leaf clover / sprout mark."""
    for angle_deg in [90, 210, 330]:
        a = math.radians(angle_deg)
        lx = cx + math.cos(a) * r * 0.55
        ly = cy - math.sin(a) * r * 0.55
        draw.ellipse([lx - r, ly - r, lx + r, ly + r], fill=color)
    # stem
    draw.rectangle([cx - r*0.18, cy, cx + r*0.18, cy + r*1.6], fill=color)

def make_icon(size=1024):
    img = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)

    # Background fill (full square — iOS applies mask automatically)
    draw.rectangle([0, 0, size, size], fill=BG)

    s = size / 1024  # scale factor

    # ── Subtle diagonal hatch texture (very faint) ──
    hatch_color = (255, 255, 255, 8)
    hatch_img = Image.new('RGBA', (size, size), (0,0,0,0))
    hatch_draw = ImageDraw.Draw(hatch_img)
    step = int(28 * s)
    for i in range(-size, size * 2, step):
        hatch_draw.line([(i, 0), (i + size, size)], fill=hatch_color, width=max(1, int(s)))
    img = Image.alpha_composite(img, hatch_img)
    draw = ImageDraw.Draw(img)

    # ── Card background (slightly lighter panel) ──
    pad = int(100 * s)
    card_r = int(80 * s)
    card_color = (36, 33, 28, 255)
    draw_rounded_rect(draw, pad, pad, size - pad, size - pad, card_r, card_color)

    # ── "N" glyph using Instrument Serif ──
    font_size = int(580 * s)
    try:
        font = ImageFont.truetype(FONT_PATH, font_size)
    except Exception:
        font = ImageFont.load_default()

    letter = "N"
    # Measure text
    bbox = draw.textbbox((0, 0), letter, font=font)
    tw = bbox[2] - bbox[0]
    th = bbox[3] - bbox[1]
    tx = (size - tw) // 2 - bbox[0]
    ty = (size - th) // 2 - bbox[1] - int(30 * s)  # slight upward shift

    draw.text((tx, ty), letter, font=font, fill=INK)

    # ── Decorative leaf accent (top-right of N) ──
    leaf_r = int(28 * s)
    leaf_cx = int(680 * s)
    leaf_cy = int(210 * s)
    draw_leaf(draw, leaf_cx, leaf_cy, leaf_r, OK)

    # ── Small dot accent below leaf ──
    dot_r = int(10 * s)
    draw.ellipse(
        [leaf_cx - dot_r, leaf_cy + int(70*s) - dot_r,
         leaf_cx + dot_r, leaf_cy + int(70*s) + dot_r],
        fill=SIG
    )

    return img


def make_adaptive_icon(size=1024):
    """Android adaptive icon — foreground on transparent bg.
    The safe zone is 66.67% (center 682×682 on 1024×1024).
    """
    img = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)

    # Fill full square with background (will be clipped to circle/squircle)
    draw.rectangle([0, 0, size, size], fill=BG)

    s = size / 1024

    # Hatch texture
    hatch_color = (255, 255, 255, 8)
    hatch_img = Image.new('RGBA', (size, size), (0,0,0,0))
    hatch_draw = ImageDraw.Draw(hatch_img)
    step = int(28 * s)
    for i in range(-size, size * 2, step):
        hatch_draw.line([(i, 0), (i + size, size)], fill=hatch_color, width=max(1, int(s)))
    img = Image.alpha_composite(img, hatch_img)
    draw = ImageDraw.Draw(img)

    # "N" — slightly smaller to stay within safe zone
    font_size = int(500 * s)
    try:
        font = ImageFont.truetype(FONT_PATH, font_size)
    except Exception:
        font = ImageFont.load_default()

    letter = "N"
    bbox = draw.textbbox((0, 0), letter, font=font)
    tw = bbox[2] - bbox[0]
    th = bbox[3] - bbox[1]
    tx = (size - tw) // 2 - bbox[0]
    ty = (size - th) // 2 - bbox[1] - int(20 * s)

    draw.text((tx, ty), letter, font=font, fill=INK)

    # Leaf accent
    leaf_r = int(24 * s)
    leaf_cx = int(640 * s)
    leaf_cy = int(230 * s)
    draw_leaf(draw, leaf_cx, leaf_cy, leaf_r, OK)

    dot_r = int(9 * s)
    draw.ellipse(
        [leaf_cx - dot_r, leaf_cy + int(62*s) - dot_r,
         leaf_cx + dot_r, leaf_cy + int(62*s) + dot_r],
        fill=SIG
    )

    return img


def make_splash(size=1024):
    img = Image.new('RGBA', (size, size), BG)
    draw = ImageDraw.Draw(img)

    s = size / 1024

    font_size = int(220 * s)
    try:
        font = ImageFont.truetype(FONT_PATH, font_size)
    except Exception:
        font = ImageFont.load_default()

    letter = "N"
    bbox = draw.textbbox((0, 0), letter, font=font)
    tw = bbox[2] - bbox[0]
    th = bbox[3] - bbox[1]
    tx = (size - tw) // 2 - bbox[0]
    ty = (size - th) // 2 - bbox[1] - int(20 * s)

    draw.text((tx, ty), letter, font=font, fill=INK)

    # Leaf
    leaf_r = int(16 * s)
    leaf_cx = int(size // 2) + int(90 * s)
    leaf_cy = ty - int(10 * s)
    draw_leaf(draw, leaf_cx, leaf_cy, leaf_r, OK)

    return img


if __name__ == '__main__':
    print("Generating icon.png …")
    icon = make_icon(1024)
    icon.save('assets/icon.png', 'PNG')
    print("  ✓ assets/icon.png")

    print("Generating adaptive-icon.png …")
    adaptive = make_adaptive_icon(1024)
    adaptive.save('assets/adaptive-icon.png', 'PNG')
    print("  ✓ assets/adaptive-icon.png")

    print("Generating splash-icon.png …")
    splash = make_splash(512)
    splash.save('assets/splash-icon.png', 'PNG')
    print("  ✓ assets/splash-icon.png")

    print("Done.")

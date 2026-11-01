"""Remove the baked-in fake-transparency checkerboard from Title-Marker.jpg.

The source JPG stores a two-tone grey checkerboard (237 / 195) instead of alpha.
Strategy:
  1. strict mask = flat, colourless pixels matching either checker tone;
  2. open the mask so thin specular highlights inside the artwork are dropped;
  3. background = everything border-connected (keeps light highlights opaque)
     plus every opened island (these are checker squares trapped inside the
     flourishes of the artwork);
  4. grow the artwork silhouette a few pixels to swallow the JPEG fringe,
     then feather the alpha edge.
"""

import numpy as np
from PIL import Image, ImageFilter

SRC = "Picture/LOGO/Title-Marker.jpg"
DST = "Picture/LOGO/Title-Marker.alpha.png"
PREVIEW = "Picture/LOGO/Title-Marker.preview.png"

img = Image.open(SRC).convert("RGB")
a = np.asarray(img).astype(np.int16)
h, w, _ = a.shape

c1 = np.array([237, 237, 237], dtype=np.int16)
c2 = np.array([195, 195, 195], dtype=np.int16)

d1 = np.abs(a - c1).max(axis=2)
d2 = np.abs(a - c2).max(axis=2)
dmin = np.minimum(d1, d2)
chroma = a.max(axis=2) - a.min(axis=2)

loose = (dmin < 54) & (chroma < 30)
strict = (dmin < 14) & (chroma < 10)

# --- open the strict mask (drop specular slivers, keep big flat squares) ---
m = Image.fromarray(strict.astype(np.uint8) * 255)
m = m.filter(ImageFilter.MinFilter(7)).filter(ImageFilter.MaxFilter(7))
opened = np.asarray(m) > 127

outside = np.zeros((h, w), dtype=bool)
outside[0, :] = loose[0, :]
outside[-1, :] = loose[-1, :]
outside[:, 0] = loose[:, 0]
outside[:, -1] = loose[:, -1]

for _ in range(5000):
    grow = np.zeros_like(outside)
    grow[1:, :] |= outside[:-1, :]
    grow[:-1, :] |= outside[1:, :]
    grow[:, 1:] |= outside[:, :-1]
    grow[:, :-1] |= outside[:, 1:]
    grow[1:, 1:] |= outside[:-1, :-1]
    grow[1:, :-1] |= outside[:-1, 1:]
    grow[:-1, 1:] |= outside[1:, :-1]
    grow[:-1, :-1] |= outside[1:, 1:]
    grow &= loose
    grow |= outside
    if np.array_equal(grow, outside):
        break
    outside = grow

background = outside | opened
print("border background", round(float(outside.mean()), 4), "islands ->", round(float(opened.mean()), 4))

alpha = Image.fromarray(np.where(background, 0, 255).astype(np.uint8))
alpha = alpha.filter(ImageFilter.MinFilter(9))  # grow artwork, eat JPEG fringe
alpha = alpha.filter(ImageFilter.GaussianBlur(1.6))

out = img.convert("RGBA")
out.putalpha(alpha)
out = out.crop(alpha.getbbox())
out.save(DST)
print("saved", DST, out.size)

bg = Image.new("RGB", out.size, (36, 24, 12))
bg.paste(out, mask=out.split()[3])
bg.save(PREVIEW)

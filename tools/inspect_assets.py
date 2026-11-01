from PIL import Image
import numpy as np

for p in ["Picture/LOGO/LOGO.png", "Picture/LOGO/Title-Marker.jpg"]:
    im = Image.open(p)
    print(p, im.mode, im.size)
    a = np.asarray(im.convert("RGBA")).astype(int)
    print(" corners", a[2, 2].tolist(), a[2, -3].tolist(), a[-3, 2].tolist(), a[-3, -3].tolist())
    if im.mode == "RGBA":
        alpha = a[..., 3]
        print(" alpha min/max/mean", alpha.min(), alpha.max(), round(float(alpha.mean()), 1))
        print(" transparent ratio", round(float((alpha < 10).mean()), 3))

# unique colours on title corners to identify checker pair
im = Image.open("Picture/LOGO/Title-Marker.jpg").convert("RGB")
a = np.asarray(im).astype(int)
patch = a[0:60, 0:60].reshape(-1, 3)
vals, counts = np.unique(patch, axis=0, return_counts=True)
order = np.argsort(-counts)[:6]
print(" top corner colours:", [(vals[i].tolist(), int(counts[i])) for i in order])

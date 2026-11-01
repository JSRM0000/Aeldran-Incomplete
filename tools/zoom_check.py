from PIL import Image

im = Image.open("Picture/LOGO/Title-Marker.alpha.png").convert("RGBA")
w, h = im.size
print("size", im.size)
bg = Image.new("RGB", im.size, (36, 24, 12))
bg.paste(im, mask=im.split()[3])

crops = [(-10, 300, 190, 460), (560, 460, 780, 620), (900, 430, 1080, 580)]
for i, box in enumerate(crops):
    box = (max(0, box[0]), max(0, box[1]), min(w, box[2]), min(h, box[3]))
    part = bg.crop(box)
    part = part.resize((part.width * 3, part.height * 3), Image.LANCZOS)
    part.save(f"tmp-inspect/zoom-{i}.png")
    print("zoom", i, box)

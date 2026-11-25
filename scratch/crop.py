# Temporary helper: fetch a large public image and save crops for design work.
import sys, urllib.request, io
from PIL import Image
Image.MAX_IMAGE_PIXELS = None
url, box, scale, out = sys.argv[1], sys.argv[2], float(sys.argv[3]), sys.argv[4]
req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0 (RelationalRiver design fetch)'})
data = urllib.request.urlopen(req, timeout=300).read()
im = Image.open(io.BytesIO(data)).convert('RGB')
print('source size', im.size, len(data))
if box != 'all':
    x0, y0, x1, y1 = [int(v) for v in box.split(',')]
    im = im.crop((x0, y0, x1, y1))
if scale != 1:
    im = im.resize((int(im.width * scale), int(im.height * scale)), Image.LANCZOS)
im.save(out, quality=92)
print('saved', out, im.size)

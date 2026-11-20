#!/usr/bin/env python3
"""
Builds public/models/shoe.glb, the configurator's shoe, from a licensed model:

  "Materials Variants Shoe", (c) 2021 Shopify, CC BY 4.0
  https://github.com/KhronosGroup/glTF-Sample-Assets/tree/main/Models/MaterialsVariantsShoe
  (the licence excludes logos and trademarks, so the logo is removed here)

What this script changes, as CC BY asks us to say:
  - removes the two stripes on each side, the logo on the heel patch, the
    lettering on the midsole and the stitched marks on the tongue;
  - makes the knit and the pull tabs non-metallic (fabric), keeps the eyelets metal;
  - tags every vertex with the part it belongs to (_PART, see PARTS), and
    replaces the colour map with a "detail" map: the light and shade of the
    original texture without its colour, so the configurator can colour each
    part and keep the knit, the stitching and the foam;
  - scales the shoe to 2.84 units long, sole on y = 0, centred on x and z
    (toe on +x, outer side on +z: a right shoe).

Run from apps/web:
  python3 scripts/model/build-shoe.py            (needs numpy, pillow, opencv-python-headless)
  python3 scripts/model/build-shoe.py --sheet    (also writes a contact sheet of the maps)
The source file is downloaded once into scripts/model/.cache (not committed).
"""
import hashlib
import io
import json
import struct
import sys
import urllib.request
from pathlib import Path

import cv2
import numpy as np
from PIL import Image

WEB = Path(__file__).resolve().parents[2]
CACHE = Path(__file__).resolve().parent / ".cache"
SRC_URL = ("https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Assets/main/"
           "Models/MaterialsVariantsShoe/glTF-Binary/MaterialsVariantsShoe.glb")
SRC_SHA256 = "e1d7cb190382111e5a5b37b51e9a7f007f7eb2ab1b6185e0188e8d0a0d1265a7"
OUT = WEB / "public/models/shoe.glb"
LENGTH = 2.84  # the configurator's stage and the stills are framed for this length

# Part order = the _PART value = the order of PART_IDS in src/features/configurator/parts.ts.
PART_NAMES = ["upper", "tabs", "laces", "lining", "heel", "midsole", "outsole"]

# The mesh is one primitive made of 83 separate pieces (connected sets of
# triangles, numbered in the order components() finds them). Each piece
# belongs to one part; the stripes are dropped.
PIECES = {
    "upper": [16, 17, 18, 19, 20, 21, 22, 23, 24,          # knit: tongue, sides, collar edge, toe
              *range(33, 49)],                              # eight eyelets (metal, tinted)
    "tabs": [25, 26, 27, 28, 29, 30, 31, 32],              # tongue strap with its loop, heel loop
    "laces": [0, 1, 2, 3, 4, 5, 6, 14, 15],                # seven crossings and the lace ends
    "lining": [7, 8, 9, 10, 11, 12, 13],                   # tongue lining, insole, collar and inner lining
    "heel": [58, 59, 60, 61, 62],                           # the heel patch and its edges
    "midsole": [50, 51, 52, 53, 54, 55, 56, 57],            # sides, toe, heel and the top rim
    "outsole": [49],                                         # the tread
}
STRIPES = list(range(63, 83))                               # two stripes on each side, with their edges
EYELETS = list(range(33, 49))

# Which original colourway gives the cleanest light and shade for each part's detail map.
DETAIL_SOURCE = {"upper": "Beach", "tabs": "Beach", "laces": "Beach", "lining": "Beach",
                 "heel": "Beach", "midsole": "Beach", "outsole": "Beach"}

CT = {5126: np.float32, 5125: np.uint32, 5123: np.uint16}
NC = {"SCALAR": 1, "VEC2": 2, "VEC3": 3, "VEC4": 4}


def source():
    CACHE.mkdir(exist_ok=True)
    path = CACHE / "MaterialsVariantsShoe.glb"
    if not path.exists():
        print("downloading", SRC_URL)
        path.write_bytes(urllib.request.urlopen(SRC_URL, timeout=120).read())
    data = path.read_bytes()
    if hashlib.sha256(data).hexdigest() != SRC_SHA256:
        sys.exit("The source model changed upstream; check PIECES before using it.")
    return data


def read_glb(b):
    n = struct.unpack("<I", b[12:16])[0]
    j = json.loads(b[20:20 + n])
    off = 20 + n
    bin_ = b[off + 8:off + 8 + struct.unpack("<I", b[off:off + 4])[0]]

    def acc(i):
        a = j["accessors"][i]
        bv = j["bufferViews"][a["bufferView"]]
        o = bv.get("byteOffset", 0) + a.get("byteOffset", 0)
        k = NC[a["type"]]
        arr = np.frombuffer(bin_, dtype=CT[a["componentType"]], count=a["count"] * k, offset=o)
        return arr.reshape(a["count"], k) if k > 1 else arr

    def image(name):
        for im in j["images"]:
            if im["name"] == name:
                bv = j["bufferViews"][im["bufferView"]]
                o = bv.get("byteOffset", 0)
                return np.asarray(Image.open(io.BytesIO(bin_[o:o + bv["byteLength"]])).convert("RGB"))
        raise KeyError(name)

    prim = j["meshes"][0]["primitives"][0]
    m = np.array(j["nodes"][2]["matrix"], dtype=np.float64).reshape(4, 4).T
    pos = acc(prim["attributes"]["POSITION"]).astype(np.float64)
    pos = (np.c_[pos, np.ones(len(pos))] @ m.T)[:, :3]
    return dict(
        pos=pos,
        nor=acc(prim["attributes"]["NORMAL"]).astype(np.float64),
        uv=acc(prim["attributes"]["TEXCOORD_0"]).astype(np.float64),
        idx=acc(prim["indices"]).astype(np.int64).reshape(-1, 3),
        maps={k: image(f"{k}.jpg") for k in ["diffuseBeach", "diffuseStreet", "diffuseMidnight",
                                              "normal", "occlusionRougnessMetalness"]},
    )


def components(idx, nverts):
    """Connected sets of triangles that share a vertex, in a fixed order."""
    parent = np.arange(nverts)

    def find(x):
        while parent[x] != x:
            parent[x] = parent[parent[x]]
            x = parent[x]
        return x

    for a, b, c in idx:
        ra = find(a)
        parent[find(b)] = ra
        parent[find(c)] = ra
    roots = np.array([find(v) for v in range(nverts)])
    return np.unique(roots[idx[:, 0]], return_inverse=True)[1]


def owner_map(uv, idx, tri_label, size):
    """Which label owns each texel: triangles rasterised in UV space, gaps filled from the nearest."""
    own = np.full((size, size), -1, np.int32)
    pts = np.round(uv[idx] * size - 0.5).astype(np.int32)
    for t in range(len(idx)):
        cv2.fillConvexPoly(own, pts[t], int(tri_label[t]))
    covered = own >= 0
    from scipy.ndimage import distance_transform_edt
    _, (iy, ix) = distance_transform_edt(~covered, return_indices=True)
    return own[iy, ix], covered


def copy_patch(img, dst, dy, dx, feather=10):
    """Replace box dst=(x0, y0, x1, y1) with the same-size box moved by (dx, dy), feathered."""
    x0, y0, x1, y1 = dst
    out = img.astype(np.float32).copy()
    src = img[y0 + dy:y1 + dy, x0 + dx:x1 + dx].astype(np.float32)
    h, w = y1 - y0, x1 - x0
    wy = np.clip(np.minimum(np.arange(h), np.arange(h)[::-1]) / feather, 0, 1)
    wx = np.clip(np.minimum(np.arange(w), np.arange(w)[::-1]) / feather, 0, 1)
    a = (wy[:, None] * wx[None, :])[..., None]
    out[y0:y1, x0:x1] = out[y0:y1, x0:x1] * (1 - a) + src * a
    return np.clip(out, 0, 255).astype(np.uint8)


def best_offset(img, dst, search):
    """The (dy, dx) whose patch best continues the knit around box dst (normalised correlation)."""
    x0, y0, x1, y1 = dst
    ring = 24
    g = cv2.cvtColor(img, cv2.COLOR_RGB2GRAY).astype(np.float32)
    ref = g[y0 - ring:y1 + ring, x0 - ring:x1 + ring].copy()
    mask = np.ones_like(ref)
    mask[ring:-ring, ring:-ring] = 0  # compare only the ring around the box
    best = (-2, 0, 0)
    for dy, dx in search:
        cand = g[y0 - ring + dy:y1 + ring + dy, x0 - ring + dx:x1 + ring + dx]
        if cand.shape != ref.shape:
            continue
        a = ref[mask > 0]
        b = cand[mask > 0]
        a = a - a.mean()
        b = b - b.mean()
        r = float((a * b).sum() / (np.sqrt((a * a).sum() * (b * b).sum()) + 1e-6))
        if r > best[0]:
            best = (r, dy, dx)
    return best


def srgb_to_linear(c):
    c = c / 255.0
    return np.where(c <= 0.04045, c / 12.92, ((c + 0.055) / 1.055) ** 2.4)


def linear_to_srgb(c):
    c = np.clip(c, 0, 1)
    return np.where(c <= 0.0031308, c * 12.92, 1.055 * np.power(c, 1 / 2.4) - 0.055)


def webp(arr, quality, size=None):
    im = Image.fromarray(arr)
    if size and im.size[0] != size:
        im = im.resize((size, size), Image.LANCZOS)
    buf = io.BytesIO()
    im.save(buf, "WEBP", quality=quality, method=6)
    return buf.getvalue()


def main():
    src = read_glb(source())
    pos, nor, uv, idx, maps = src["pos"], src["nor"], src["uv"], src["idx"], src["maps"]
    comp = components(idx, len(pos))
    assert comp.max() == 82, "unexpected piece count"
    piece_part = np.full(83, -1)
    for p, name in enumerate(PART_NAMES):
        piece_part[PIECES[name]] = p
    assert set(np.where(piece_part < 0)[0]) == set(STRIPES), "every piece needs a part"

    size = maps["normal"].shape[0]
    piece_own, covered = owner_map(uv, idx, comp, size)
    part_own = piece_part[piece_own]  # -1 where a stripe owns the texel

    # --- 1. The heel logo: the colours that differ between the three colourways on the patch.
    d = np.stack([maps[k].astype(np.int16) for k in ["diffuseBeach", "diffuseStreet", "diffuseMidnight"]])
    spread = (d.max(axis=0) - d.min(axis=0)).max(axis=2)
    heel = np.isin(piece_own, PIECES["heel"]) & covered
    logo = (heel & (spread > 18)).astype(np.uint8)
    logo = cv2.dilate(logo, np.ones((3, 3), np.uint8), iterations=6)
    print("heel logo texels:", int(logo.sum()))
    for k in maps:
        maps[k] = cv2.inpaint(np.ascontiguousarray(maps[k]), logo, 7, cv2.INPAINT_TELEA)

    # --- 2. The lettering on the outer midsole: foam from further up the same strip.
    # (only the normal map carries it; the other maps keep their own baked shading)
    foam_box = (1730, 740, 1822, 1020)
    maps["normal"] = copy_patch(maps["normal"], foam_box, dy=-280, dx=0)

    # --- 3. The stitched marks on the tongue: knit from nearby, matched to the pattern.
    for box in [(338, 628, 502, 748), (352, 868, 418, 908)]:
        h = box[3] - box[1]
        search = [(dy, dx) for dy in list(range(h + 6, h + 120, 2)) + list(range(-h - 120, -h - 6, 2))
                  for dx in range(-24, 25, 2)]
        r, dy, dx = best_offset(maps["normal"], box, search)
        print(f"tongue patch {box}: offset ({dx}, {dy}), match {r:.2f}")
        # The marks are in the normal map only; the occlusion map keeps the laces' baked shadows.
        maps["normal"] = copy_patch(maps["normal"], box, dy=dy, dx=dx, feather=12)

    # --- 4. ORM: fabric is not metal; only the eyelets keep their metalness.
    orm = maps["occlusionRougnessMetalness"].copy()
    eyelet = np.isin(piece_own, EYELETS)
    orm[..., 2] = np.where(eyelet, orm[..., 2], 0)

    # --- 5. Detail map: each part's light and shade around 1.0, stored as detail / 2 in sRGB.
    detail = np.ones((size, size), np.float32)
    for p, name in enumerate(PART_NAMES):
        lin = srgb_to_linear(maps[f"diffuse{DETAIL_SOURCE[name]}"].astype(np.float32))
        lum = lin @ np.array([0.2126, 0.7152, 0.0722], np.float32)
        sel = part_own == p
        mean = float(lum[sel & covered].mean())
        detail[sel] = lum[sel] / mean
        print(f"{name:8s} detail: mean luminance {mean:.3f}, spread {detail[sel & covered].std():.3f}")
    detail = np.clip(detail, 0, 1.98)
    detail_rgb = np.repeat((linear_to_srgb(detail / 2) * 255 + 0.5).astype(np.uint8)[..., None], 3, axis=2)

    # --- 6. Geometry: drop the stripes, compact, scale, tag parts.
    keep_t = piece_part[comp] >= 0
    tri = idx[keep_t]
    used = np.unique(tri)
    remap = np.full(len(pos), -1)
    remap[used] = np.arange(len(used))
    tri = remap[tri]
    P = pos[used]
    s = LENGTH / (P[:, 0].max() - P[:, 0].min())
    P = (P - [(P[:, 0].max() + P[:, 0].min()) / 2, P[:, 1].min(), (P[:, 2].max() + P[:, 2].min()) / 2]) * s
    N = nor[used]
    N = N / np.linalg.norm(N, axis=1, keepdims=True)
    UV = uv[used]
    vpart = np.zeros(len(used), np.float32)
    vpart[tri.ravel()] = np.repeat(piece_part[comp[keep_t]], 3)
    print(f"vertices {len(P)}, triangles {len(tri)}, size {np.round(P.max(0) - P.min(0), 3)}")

    images = [
        ("detail", webp(detail_rgb, 88)),
        ("normal", webp(maps["normal"], 90)),
        ("orm", webp(orm, 86, size=1024)),
    ]
    write_glb(OUT, P.astype(np.float32), N.astype(np.float32), UV.astype(np.float32),
              tri.astype(np.uint16), vpart, images)
    print(f"wrote {OUT.relative_to(WEB)} ({OUT.stat().st_size / 1e6:.2f} MB)")

    if "--sheet" in sys.argv:
        sheet = np.concatenate([cv2.resize(m, (768, 768)) for m in (detail_rgb, maps["normal"], orm)], axis=1)
        Image.fromarray(sheet).save(CACHE / "maps-sheet.png")
        print("wrote", CACHE / "maps-sheet.png")


def write_glb(path, P, N, UV, tri, vpart, images):
    chunks, views, accessors = [], [], []

    def add(data, target=None):
        while sum(len(c) for c in chunks) % 4:
            chunks.append(b"\0")
        off = sum(len(c) for c in chunks)
        chunks.append(data)
        v = {"buffer": 0, "byteOffset": off, "byteLength": len(data)}
        if target:
            v["target"] = target
        views.append(v)
        return len(views) - 1

    def accessor(arr, kind, ctype, target, minmax=False):
        a = {"bufferView": add(arr.tobytes(), target), "componentType": ctype,
             "count": int(arr.shape[0] if arr.ndim > 1 else arr.size), "type": kind}
        if minmax:
            a["min"] = arr.min(axis=0).tolist()
            a["max"] = arr.max(axis=0).tolist()
        accessors.append(a)
        return len(accessors) - 1

    attrs = {
        "POSITION": accessor(P, "VEC3", 5126, 34962, minmax=True),
        "NORMAL": accessor(N, "VEC3", 5126, 34962),
        "TEXCOORD_0": accessor(UV, "VEC2", 5126, 34962),
        "_PART": accessor(vpart, "SCALAR", 5126, 34962),
    }
    indices = accessor(tri.ravel(), "SCALAR", 5123, 34963)
    img_json = [{"name": n, "mimeType": "image/webp", "bufferView": add(data)} for n, data in images]
    textures = [{"sampler": 0, "extensions": {"EXT_texture_webp": {"source": i}}} for i in range(len(images))]
    gltf = {
        "asset": {
            "version": "2.0",
            "generator": "JIANOVA scripts/model/build-shoe.py",
            "copyright": "Shoe model (c) 2021 Shopify, CC BY 4.0 "
                         "(https://creativecommons.org/licenses/by/4.0/). Modified for JIANOVA: "
                         "stripes, heel logo and lettering removed; parts tagged for recolouring.",
        },
        "extensionsUsed": ["EXT_texture_webp"],
        "extensionsRequired": ["EXT_texture_webp"],
        "scene": 0,
        "scenes": [{"nodes": [0]}],
        "nodes": [{"name": "shoe", "mesh": 0}],
        "meshes": [{"name": "shoe", "primitives": [{"attributes": attrs, "indices": indices, "material": 0}]}],
        "materials": [{
            "name": "shoe",
            "pbrMetallicRoughness": {
                "baseColorTexture": {"index": 0},
                "metallicRoughnessTexture": {"index": 2},
                "metallicFactor": 1,
                "roughnessFactor": 1,
            },
            "normalTexture": {"index": 1},
            "occlusionTexture": {"index": 2},
        }],
        "samplers": [{"magFilter": 9729, "minFilter": 9987, "wrapS": 33071, "wrapT": 33071}],
        "textures": textures,
        "images": img_json,
        "accessors": accessors,
        "bufferViews": views,
        "buffers": [{"byteLength": 0}],
    }
    binary = b"".join(chunks)
    binary += b"\0" * (-len(binary) % 4)
    gltf["buffers"][0]["byteLength"] = len(binary)
    js = json.dumps(gltf, separators=(",", ":")).encode()
    js += b" " * (-len(js) % 4)
    path.parent.mkdir(parents=True, exist_ok=True)
    with open(path, "wb") as f:
        f.write(struct.pack("<III", 0x46546C67, 2, 12 + 8 + len(js) + 8 + len(binary)))
        f.write(struct.pack("<II", len(js), 0x4E4F534A) + js)
        f.write(struct.pack("<II", len(binary), 0x004E4942) + binary)


if __name__ == "__main__":
    main()

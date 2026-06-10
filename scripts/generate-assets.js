/**
 * Generates the app icon set (icon, adaptive icon foreground, splash glyph)
 * as PNGs with zero external dependencies — pure Node + zlib.
 *
 * The artwork is a geometric beer mug with foam on a deep-stout background,
 * rendered per-pixel with signed-distance functions for smooth anti-aliasing.
 *
 * Run: node scripts/generate-assets.js
 */
'use strict';

const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

// ---------------------------------------------------------------------------
// Minimal PNG encoder (RGBA, 8-bit, no interlace)
// ---------------------------------------------------------------------------

const CRC_TABLE = (() => {
  const table = new Int32Array(256);
  for (let n = 0; n < 256; n += 1) {
    let c = n;
    for (let k = 0; k < 8; k += 1) {
      c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    }
    table[n] = c;
  }
  return table;
})();

function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i += 1) {
    c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  }
  return (c ^ 0xffffffff) >>> 0;
}

function pngChunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const typeBuf = Buffer.from(type, 'ascii');
  const crcBuf = Buffer.alloc(4);
  crcBuf.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])), 0);
  return Buffer.concat([len, typeBuf, data, crcBuf]);
}

function encodePng(width, height, rgba) {
  const signature = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // color type RGBA
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;

  const stride = width * 4;
  const raw = Buffer.alloc((stride + 1) * height);
  for (let y = 0; y < height; y += 1) {
    raw[y * (stride + 1)] = 0; // filter: none
    rgba.copy(raw, y * (stride + 1) + 1, y * stride, (y + 1) * stride);
  }
  const idat = zlib.deflateSync(raw, { level: 9 });
  return Buffer.concat([
    signature,
    pngChunk('IHDR', ihdr),
    pngChunk('IDAT', idat),
    pngChunk('IEND', Buffer.alloc(0)),
  ]);
}

// ---------------------------------------------------------------------------
// Tiny SDF rasterizer
// ---------------------------------------------------------------------------

const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
const lerp = (a, b, t) => a + (b - a) * t;

function hexToRgb(hex) {
  const v = parseInt(hex.slice(1), 16);
  return [(v >> 16) & 0xff, (v >> 8) & 0xff, v & 0xff];
}

function mixRgb(a, b, t) {
  return [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)];
}

function sdCircle(px, py, cx, cy, r) {
  return Math.hypot(px - cx, py - cy) - r;
}

function sdRoundRect(px, py, cx, cy, hw, hh, r) {
  const qx = Math.abs(px - cx) - hw + r;
  const qy = Math.abs(py - cy) - hh + r;
  const ox = Math.max(qx, 0);
  const oy = Math.max(qy, 0);
  return Math.hypot(ox, oy) + Math.min(Math.max(qx, qy), 0) - r;
}

function sdRing(px, py, cx, cy, rMid, halfWidth) {
  return Math.abs(sdCircle(px, py, cx, cy, rMid)) - halfWidth;
}

/**
 * Renders one square asset.
 * @param size       canvas size in px
 * @param withBg     paint the dark stout background (true for the main icon)
 * @param glyphScale scale of the mug around the canvas center (adaptive
 *                   icons need the glyph inside the ~66% safe zone)
 */
function render(size, withBg, glyphScale) {
  const px = new Float64Array(size * size * 4); // premultiplied-ish float canvas

  const BG_CENTER = hexToRgb('#3A2412');
  const BG_EDGE = hexToRgb('#150F0A');
  const GOLD_TOP = hexToRgb('#F8D26A');
  const GOLD_BOTTOM = hexToRgb('#D2851F');
  const HANDLE = hexToRgb('#C9821F');
  const FOAM = hexToRgb('#FFF6E3');
  const HIGHLIGHT = hexToRgb('#FFE9A8');
  const RING = hexToRgb('#E8A33D');

  // Glyph geometry in unit space (0..1), transformed by glyphScale.
  const T = (v) => (0.5 + (v - 0.5) * glyphScale) * size;
  const S = (v) => v * glyphScale * size;

  const bodyCx = T(0.48);
  const bodyCy = T(0.56);
  const bodyHw = S(0.145);
  const bodyHh = S(0.2);
  const bodyR = S(0.045);
  const bodyTop = bodyCy - bodyHh;
  const bodyBottom = bodyCy + bodyHh;
  const bodyRight = bodyCx + bodyHw;

  const handleCx = bodyRight + S(0.052);
  const handleCy = T(0.565);
  const handleRMid = S(0.085);
  const handleHalf = S(0.024);

  const foam = [
    [T(0.385), T(0.345), S(0.075)],
    [T(0.475), T(0.322), S(0.088)],
    [T(0.565), T(0.345), S(0.072)],
    [T(0.615), T(0.372), S(0.05)],
  ];
  const drip = [T(0.41), T(0.415), S(0.027)];
  const bubbles = [
    [T(0.545), T(0.55), S(0.013)],
    [T(0.495), T(0.625), S(0.01)],
    [T(0.575), T(0.685), S(0.011)],
    [T(0.45), T(0.5), S(0.009)],
  ];

  const set = (i, rgb, a) => {
    if (a <= 0) return;
    const inv = 1 - a;
    px[i] = rgb[0] * a + px[i] * inv;
    px[i + 1] = rgb[1] * a + px[i + 1] * inv;
    px[i + 2] = rgb[2] * a + px[i + 2] * inv;
    px[i + 3] = Math.min(255, 255 * a + px[i + 3] * inv);
  };

  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      const i = (y * size + x) * 4;

      if (withBg) {
        const t = clamp(Math.hypot(x - size * 0.5, y - size * 0.42) / (size * 0.62), 0, 1);
        const bg = mixRgb(BG_CENTER, BG_EDGE, t);
        px[i] = bg[0];
        px[i + 1] = bg[1];
        px[i + 2] = bg[2];
        px[i + 3] = 255;

        // Subtle gold keyline ring.
        const dRing = sdRing(x, y, size * 0.5, size * 0.5, size * 0.452, size * 0.006);
        set(i, RING, clamp(0.5 - dRing, 0, 1) * 0.35);
      }

      // Handle (drawn first; the body overpaints the joint).
      const dHandle = sdRing(x, y, handleCx, handleCy, handleRMid, handleHalf);
      set(i, HANDLE, clamp(0.5 - dHandle, 0, 1));

      // Mug body with a vertical gold gradient.
      const dBody = sdRoundRect(x, y, bodyCx, bodyCy, bodyHw, bodyHh, bodyR);
      if (dBody < 1) {
        const tv = clamp((y - bodyTop) / Math.max(1, bodyBottom - bodyTop), 0, 1);
        set(i, mixRgb(GOLD_TOP, GOLD_BOTTOM, tv), clamp(0.5 - dBody, 0, 1));
      }

      // Glass highlights.
      const dHl1 = sdRoundRect(x, y, bodyCx - bodyHw * 0.58, bodyCy + S(0.005), S(0.02), bodyHh * 0.78, S(0.018));
      set(i, HIGHLIGHT, clamp(0.5 - dHl1, 0, 1) * 0.55);
      const dHl2 = sdRoundRect(x, y, bodyCx - bodyHw * 0.18, bodyCy + S(0.005), S(0.011), bodyHh * 0.74, S(0.01));
      set(i, HIGHLIGHT, clamp(0.5 - dHl2, 0, 1) * 0.3);

      // Rising bubbles.
      for (const [bx, by, br] of bubbles) {
        set(i, HIGHLIGHT, clamp(0.5 - sdCircle(x, y, bx, by, br), 0, 1) * 0.55);
      }

      // Foam cap + drip.
      const dCap = sdRoundRect(x, y, bodyCx, bodyTop + S(0.012), bodyHw, S(0.026), S(0.024));
      set(i, FOAM, clamp(0.5 - dCap, 0, 1));
      for (const [fx, fy, fr] of foam) {
        set(i, FOAM, clamp(0.5 - sdCircle(x, y, fx, fy, fr), 0, 1));
      }
      set(i, FOAM, clamp(0.5 - sdCircle(x, y, drip[0], drip[1], drip[2]), 0, 1));
    }
  }

  const out = Buffer.alloc(size * size * 4);
  for (let i = 0; i < px.length; i += 1) {
    out[i] = Math.round(clamp(px[i], 0, 255));
  }
  return encodePng(size, size, out);
}

// ---------------------------------------------------------------------------

const assetsDir = path.join(__dirname, '..', 'assets');
fs.mkdirSync(assetsDir, { recursive: true });

const targets = [
  { file: 'icon.png', size: 1024, withBg: true, scale: 1 },
  { file: 'adaptive-icon.png', size: 1024, withBg: false, scale: 0.8 },
  { file: 'splash-icon.png', size: 1024, withBg: false, scale: 0.72 },
];

for (const t of targets) {
  const png = render(t.size, t.withBg, t.scale);
  fs.writeFileSync(path.join(assetsDir, t.file), png);
  console.log(`wrote assets/${t.file} (${png.length} bytes)`);
}

/**
 * A set of color utilities: contrast, OKLAB, hex, RGB, etc.
 *
 * Reference:
 * https://github.com/mattdesl/canvas-sketch-util/blob/master/math.js
 * https://github.com/nschloe/colorio
 */

import { clamp } from "./math.js";

// red, green, and blue coefficients
var rc = 0.2126;
var gc = 0.7152;
var bc = 0.0722;
// low-gamma adjust coefficient
var lowc = 1 / 12.92;

const adjustGamma = (a) => Math.pow((a + 0.055) / 1.055, 2.4);

export const luma = (n, a = ~~((n / 100) * 255)) => rgbToHex([a, a, a]);

export const blend = (c0, c1, opacity) => {
  c0 = hexToRGB(c0);
  c1 = hexToRGB(c1);
  for (var i = 0; i < 3; i++) {
    c1[i] = c1[i] * opacity + c0[i] * (1 - opacity);
  }
  return rgbToHex(c1);
};

export const relativeLuminance = (rgb) => {
  if (typeof rgb == "string") rgb = hexToRGB(rgb);
  var rsrgb = rgb[0] / 255;
  var gsrgb = rgb[1] / 255;
  var bsrgb = rgb[2] / 255;
  var r = rsrgb <= 0.03928 ? rsrgb * lowc : adjustGamma(rsrgb);
  var g = gsrgb <= 0.03928 ? gsrgb * lowc : adjustGamma(gsrgb);
  var b = bsrgb <= 0.03928 ? bsrgb * lowc : adjustGamma(bsrgb);
  return r * rc + g * gc + b * bc;
};

// // Extracted from @tmcw / wcag-contrast
// // https://github.com/tmcw/wcag-contrast
export const contrastRatio = (colorA, colorB) => {
  var a = relativeLuminance(colorA);
  var b = relativeLuminance(colorB);
  var l1 = Math.max(a, b);
  var l2 = Math.min(a, b);
  return (l1 + 0.05) / (l2 + 0.05);
};

export const hexToRGB = (str) => {
  var hex = str.replace("#", "");
  // NOTE: This can be removed for brevity if you stick with 6-character codes
  if (hex.length === 3) {
    hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2];
  }
  var num = parseInt(hex, 16);
  return [num >> 16, (num >> 8) & 255, num & 255];
};

export function rgbToHex(rgb) {
  var r = clamp(~~rgb[0], 0, 255);
  var g = clamp(~~rgb[1], 0, 255);
  var b = clamp(~~rgb[2], 0, 255);
  return "#" + (b | (g << 8) | (r << 16) | (1 << 24)).toString(16).slice(1);
}

const gammaToLinear = (c) =>
  c < 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
const linearToGamma = (c) =>
  c > 0.0031308 ? 1.055 * Math.pow(c, 1 / 2.4) - 0.055 : 12.92 * c;

export function oklabToRGB([l, a, b]) {
  let L = Math.pow(l + 0.3963377774 * a + 0.2158037573 * b, 3);
  let M = Math.pow(l - 0.1055613458 * a - 0.0638541728 * b, 3);
  let S = Math.pow(l - 0.0894841775 * a - 1.291485548 * b, 3);
  return [
    clamp(
      ~~(
        255 *
        linearToGamma(+4.0767245293 * L - 3.3072168827 * M + 0.2307590544 * S)
      ),
      0,
      255
    ),
    clamp(
      ~~(
        255 *
        linearToGamma(-1.2681437731 * L + 2.6093323231 * M - 0.341134429 * S)
      ),
      0,
      255
    ),
    clamp(
      ~~(
        255 *
        linearToGamma(-0.0041119885 * L - 0.7034763098 * M + 1.7068625689 * S)
      ),
      0,
      255
    ),
  ];
}

export const rgbToOklab = (rgb) => {
  if (typeof rgb === "string") rgb = hexToRGB(rgb);
  let [r, g, b] = rgb;
  r = gammaToLinear(r / 255);
  g = gammaToLinear(g / 255);
  b = gammaToLinear(b / 255);
  let L = Math.cbrt(0.412165612 * r + 0.536275208 * g + 0.0514575653 * b);
  let M = Math.cbrt(0.211859107 * r + 0.6807189584 * g + 0.107406579 * b);
  let S = Math.cbrt(0.0883097947 * r + 0.2818474174 * g + 0.6302613616 * b);
  return [
    0.2104542553 * L + 0.793617785 * M - 0.0040720468 * S,
    1.9779984951 * L - 2.428592205 * M + 0.4505937099 * S,
    0.0259040371 * L + 0.7827717662 * M - 0.808675766 * S,
  ];
};

export function Lch(L, c, h) {
  const a = (h / 180) * Math.PI;
  c /= 100;
  L /= 100;
  return rgbToHex(
    oklabToRGB([L, c ? c * Math.cos(a) : 0, c ? c * Math.sin(a) : 0])
  );
}

const normalizeHue = (hue) => ((hue = hue % 360) < 0 ? hue + 360 : hue);

export const LabToLch = ([l, a, b]) => {
  let c = Math.sqrt(a * a + b * b);
  let res = [l, c, c ? normalizeHue((Math.atan2(b, a) * 180) / Math.PI) : 0];
  res[0] *= 100;
  res[1] *= 100;
  return res;
};

export const getBestColors = (
  colors,
  others,
  min = 1,
  thresholds = [3, 2.5, 2]
) => {
  for (let i = 0; i < thresholds.length; i++) {
    const best = colors.filter((c) =>
      others.every((b) => contrastRatio(c, b) >= thresholds[i])
    );
    if (best.length >= min) return best;
  }
};

/**
 * A set of math utilities. Mostly taken from canvas-sketch-util.
 *
 * Reference:
 * https://github.com/mattdesl/canvas-sketch-util/blob/master/math.js
 */

export const clamp = (value, min, max) => Math.max(Math.min(value, max), min);
export const clamp01 = (v) => clamp(v, 0, 1);

export const lerp = (min, max, t) => min * (1 - t) + max * t;

export const inverseLerp = (min, max, t) => (t - min) / (max - min);

export const smoothstep = (min, max, t) => {
  t = clamp01((t - min) / (max - min));
  return t * t * (3 - 2 * t);
};

export function lerpArray(min, max, t, out = []) {
  for (var i = 0; i < min.length; i++) {
    out[i] = lerp(min[i], max[i], t);
  }
  return out;
}

export function lerpFrames(values, t) {
  t = clamp(t, 0, 1);
  var len = values.length - 1;
  var whole = t * len;
  var frame = ~~whole;
  var fract = whole - frame;
  var nextFrame = Math.min(frame + 1, len);
  var a = values[frame % values.length];
  var b = values[nextFrame % values.length];
  return lerpArray(a, b, fract);
}

export const mod = (a, b) => ((a % b) + b) % b;

export const stepped = (t, list) =>
  list[clamp(~~(t * list.length), 0, list.length - 1)];

export const mapRange = (value, inputMin, inputMax, outputMin, outputMax) =>
  lerp(outputMin, outputMax, inverseLerp(inputMin, inputMax, value));

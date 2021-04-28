/**
 * A set of Vector math utilities. Mostly taken from gl-matrix and other places.
 */

export const cross = (out, a, b) => {
  var ax = a[0],
    ay = a[1],
    az = a[2],
    bx = b[0],
    by = b[1],
    bz = b[2];
  out[0] = ay * bz - az * by;
  out[1] = az * bx - ax * bz;
  out[2] = ax * by - ay * bx;
  return out;
};

export const length = (a) => Math.hypot(a[0], a[1], a[2]);

export const copy = (out, a) => set(out, a[0], a[1], a[2]);

export const set = (out, x, y, z) => {
  out[0] = x;
  out[1] = y;
  out[2] = z;
  return out;
};

export const sub = (out, a, b) =>
  set(out, a[0] - b[0], a[1] - b[1], a[2] - b[2]);

export const scale = (out, a, b) => set(out, a[0] * b, a[1] * b, a[2] * b);

export const add = (out, a, b) =>
  set(out, a[0] + b[0], a[1] + b[1], a[2] + b[2]);

export const scaleAndAdd = (out, a, b, scale) =>
  set(out, a[0] + b[0] * scale, a[1] + b[1] * scale, a[2] + b[2] * scale);

export const normalize = (out, a) => {
  let len = dot(a, a);
  if (len > 0) len = 1 / Math.sqrt(len);
  return scale(out, a, len);
};

export const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];

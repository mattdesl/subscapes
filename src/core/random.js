/**
 * A set of random utilities.
 *
 * The randomizer is built in two parts:
 *
 * - Uses two murmur2 32-bit hashes with different seeds
 *   on the set of input bytes (i.e. the token hash) to get a 64-bit value
 * - Uses PCG to get a random 0..1 value, extracted from Jacob Rus' notebook
 *
 * See here for more:
 * https://gist.github.com/mattdesl/779daf4c9fa72e21733f9db928f993aa
 * https://github.com/mattdesl/canvas-sketch-util/blob/master/random.js
 */

// Note that the index order [0, 1, 2, 3] is little-endian
const eps = Math.pow(2, -32),
  m0 = 0x7f2d,
  m1 = 0x4c95,
  m2 = 0xf42d,
  m3 = 0x5851, // 6364136223846793005
  a0 = 0x814f,
  a1 = 0xf767,
  a2 = 0x7b7e,
  a3 = 0x1405; // 1442695040888963407

const state = new Uint16Array(4);
const dv = new DataView(state.buffer);

let _nextGaussian = null;
let _hasNextGaussian = false;

// random value between 0..1
export const value = () => {
  // Advance internal state
  const s0 = state[0],
    s1 = state[1],
    s2 = state[2],
    s3 = state[3],
    new0 = (a0 + m0 * s0) | 0,
    new1 = (a1 + m0 * s1 + (m1 * s0 + (new0 >>> 16))) | 0,
    new2 = (a2 + m0 * s2 + m1 * s1 + (m2 * s0 + (new1 >>> 16))) | 0,
    new3 = a3 + m0 * s3 + (m1 * s2 + m2 * s1) + (m3 * s0 + (new2 >>> 16));
  (state[0] = new0), (state[1] = new1), (state[2] = new2);
  state[3] = new3;

  // Calculate output function (XSH RR), uses old state
  const xorshifted =
      (s3 << 21) + (((s3 >> 2) ^ s2) << 5) + (((s2 >> 2) ^ s1) >> 11),
    out_int32 =
      (xorshifted >>> (s3 >> 11)) | (xorshifted << (-(s3 >> 11) & 31));
  return eps * (out_int32 >>> 0);
};

// internally gets a 32-bit from tokenData hash bytes
const hash32 = (bytes, seed = 0) => {
  // murmur2 32bit
  // https://github.com/garycourt/murmurhash-js/blob/master/murmurhash2_gc.js
  const K = 16;
  const mask = 65535;
  const maskByte = 0xff;
  var m = 0x5bd1e995;
  var l = bytes.length,
    h = seed ^ l,
    i = 0,
    k;
  while (l >= 4) {
    k =
      (bytes[i] & maskByte) |
      ((bytes[++i] & maskByte) << 8) |
      ((bytes[++i] & maskByte) << 16) |
      ((bytes[++i] & maskByte) << 24);
    k = (k & mask) * m + ((((k >>> K) * m) & mask) << K);
    k ^= k >>> 24;
    k = (k & mask) * m + ((((k >>> K) * m) & mask) << K);
    h = ((h & mask) * m + ((((h >>> K) * m) & mask) << K)) ^ k;
    l -= 4;
    ++i;
  }
  switch (l) {
    case 3:
      h ^= (bytes[i + 2] & maskByte) << K;
    case 2:
      h ^= (bytes[i + 1] & maskByte) << 8;
    case 1:
      h ^= bytes[i] & maskByte;
      h = (h & mask) * m + ((((h >>> K) * m) & mask) << K);
  }
  h ^= h >>> 13;
  h = (h & mask) * m + ((((h >>> K) * m) & mask) << K);
  h ^= h >>> 15;
  return h >>> 0;
};

// sets the seed to a tokenData hash string "0x..."
export const set_seed = (hash) => {
  _hasNextGaussian = false;
  _nextGaussian = null;
  const nBytes = ~~((hash.length - 2) / 2);
  const bytes = [];
  for (let j = 0; j < nBytes; j++) {
    const e0 = 2 + 2 * j;
    bytes.push(parseInt(hash.slice(e0, e0 + 2), 16));
  }

  // to keep it simple, we just use 32bit murmur2 with two different seeds
  const seed_a = 1690382925;
  const seed_b = 72970470;
  const lower = hash32(bytes, seed_a);
  const upper = hash32(bytes, seed_b);
  dv.setUint32(0, lower);
  dv.setUint32(4, upper);
};

// random boolean with 50% uniform chance
export const boolean = () => value() > 0.5;

// random chance
export const chance = (n = 0.5) => value() < n;

// random value between min (inclusive) and max (exclusive)
export const range = (min, max) => {
  if (max === undefined) {
    max = min;
    min = 0;
  }
  return value() * (max - min) + min;
};

// random value between min (inclusive) and max (exclusive), then floored
export const rangeFloor = (min, max) => Math.floor(range(min, max));

// pick a random element in the given array
export const pick = (array) =>
  array.length ? array[rangeFloor(array.length)] : undefined;

// shuffle an array
export const shuffle = (arr) => {
  var rand;
  var tmp;
  var len = arr.length;
  var ret = [...arr];
  while (len) {
    rand = ~~(value() * len--);
    tmp = ret[len];
    ret[len] = ret[rand];
    ret[rand] = tmp;
  }
  return ret;
};

// random point in a uniform 2D disc with given radius
export function insideCircle(radius = 1, out = []) {
  var theta = value() * 2.0 * Math.PI;
  var r = radius * Math.sqrt(value());
  out[0] = r * Math.cos(theta);
  out[1] = r * Math.sin(theta);
  return out;
}

// weighted randomness, specify weights array and the return value is an index
export const weighted = (weights) => {
  var totalWeight = 0;
  var i;

  for (i = 0; i < weights.length; i++) {
    totalWeight += weights[i];
  }

  var random = value() * totalWeight;
  for (i = 0; i < weights.length; i++) {
    if (random < weights[i]) {
      return i;
    }
    random -= weights[i];
  }
  return 0;
};

// random gaussian distribution
export const gaussian = (mean = 0, standardDerivation = 1) => {
  // https://github.com/openjdk-mirror/jdk7u-jdk/blob/f4d80957e89a19a29bb9f9807d2a28351ed7f7df/src/share/classes/java/util/Random.java#L496
  if (_hasNextGaussian) {
    _hasNextGaussian = false;
    var result = _nextGaussian;
    _nextGaussian = null;
    return mean + standardDerivation * result;
  } else {
    var v1 = 0;
    var v2 = 0;
    var s = 0;
    do {
      v1 = value() * 2 - 1; // between -1 and 1
      v2 = value() * 2 - 1; // between -1 and 1
      s = v1 * v1 + v2 * v2;
    } while (s >= 1 || s === 0);
    var multiplier = Math.sqrt((-2 * Math.log(s)) / s);
    _nextGaussian = v2 * multiplier;
    _hasNextGaussian = true;
    return mean + standardDerivation * (v1 * multiplier);
  }
};

// Generates a pure random hash, useful for testing
// i.e. not deterministic!
export function getRandomHash() {
  let result = "0x";
  for (let i = 64; i > 0; --i)
    result += "0123456789abcdef"[~~(Math.random() * 16)];
  return result;
}

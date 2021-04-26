// helper functions
const setctx = (ctx, composite, color, alpha) => {
  ctx.globalCompositeOperation = composite;
  ctx.globalAlpha = alpha;
  ctx.fillStyle = ctx.strokeStyle = color;
};

export const toScreenPoint = (p, tx, ty, sx, sy) => [
  tx + p[0] * sx,
  ty + p[1] * sy,
];

function getMinMaxY(projectedPaths, projectedBasePolygon) {
  // Figure out min/max Y for recentering
  let minScreenY = Infinity;
  let maxScreenY = -Infinity;
  projectedPaths.forEach((p) => {
    p[0].forEach((line) => {
      line.forEach((pt) => {
        minScreenY = Math.min(minScreenY, pt[1]);
        maxScreenY = Math.max(maxScreenY, pt[1]);
      });
    });
  });
  projectedBasePolygon.forEach((pt) => {
    minScreenY = Math.min(minScreenY, pt[1]);
    maxScreenY = Math.max(maxScreenY, pt[1]);
  });
  return [minScreenY, maxScreenY];
}

export function fitter(projectedPaths, projectedBasePolygon, width, height) {
  const [minScreenY, maxScreenY] = getMinMaxY(
    projectedPaths,
    projectedBasePolygon
  );

  // aspect ratio fitter
  let tx,
    ty,
    sx = width,
    sy = height;
  if (1 > width / height) {
    sy = sx;
  } else {
    sx = sy;
  }
  tx = (width - sx) * 0.5;
  ty = (height - sy) * 0.5;

  // recenter based on projected paths
  const ky0 = minScreenY * sy;
  const ky1 = maxScreenY * sy;
  ty += (sy - ky1 - ky0) / 2;

  return [tx, ty, sx, sy];
}

export default function render(subscapes, opts = {}) {
  let [
    background,
    colors,
    baseColor,
    mode,
    alpha,
    lineWidthFactor,
    projectedPaths,
    projectedBasePolygon,
    projectedBasePaths,
  ] = subscapes;

  const SRC_OVER = "source-over";

  const {
    context,
    width,
    height,
    lineJoin = "round",
    lineCap = "round",
    clear = true,
  } = opts;

  if (!context) throw new Error("Must specify { context } attribute");
  if (!width || !height) {
    throw new Error("Must specify { width, height } attributes and != 0");
  }

  const dim = Math.min(width, height);
  const lineWidth = dim * lineWidthFactor;

  const [tx, ty, sx, sy] = fitter(
    projectedPaths,
    projectedBasePolygon,
    width,
    height
  );

  context.lineJoin = lineJoin;
  context.lineCap = lineCap;

  // clear canvas
  if (clear) {
    context.clearRect(0, 0, width, height);
  }

  // draw background color
  setctx(context, SRC_OVER, background, 1);
  context.fillRect(0, 0, width, height);

  // draw core subscapes terrain
  draw(projectedPaths);

  // fill the base polygon so that we 'clip' the lines that might be visible
  setctx(context, SRC_OVER, background, 1);
  context.beginPath();
  projectedBasePolygon.forEach((p) =>
    context.lineTo(...toScreenPoint(p, tx, ty, sx, sy))
  );
  context.closePath();
  context.fill();

  // some subscapes have a base fill color, so fill if needed
  if (baseColor) {
    setctx(context, mode, baseColor, alpha);
    context.fill();
  }

  // finally draw the ridge lines within the base
  draw(projectedBasePaths);

  function draw(curPaths) {
    curPaths.forEach(([paths, color, thickness]) => {
      const curLineWidth = thickness * lineWidth;
      context.lineWidth = curLineWidth;
      context.beginPath();
      paths.forEach((path) => {
        path.forEach((p, i) => {
          const x = tx + p[0] * sx;
          const y = ty + p[1] * sy;
          if (i === 0) context.moveTo(x, y);
          else context.lineTo(x, y);
          // Special case especially for iOS is to create
          // a path that is 'long enough' to form a visible point
          if (path.length === 1) {
            const jitter = curLineWidth / 20;
            context.lineTo(x - jitter, y - jitter);
            context.lineTo(x + jitter, y + jitter);
          }
        });
      });
      setctx(context, mode, color, alpha);
      context.stroke();
    });
  }
}

// import convert from "convert-length";
import { fitter, toScreenPoint } from "./render";

export default function serialize(subscapes, opts = {}) {
  let { width = 512, height = 512, margin = 0 } = opts;

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

  const dim = Math.min(width, height);
  const lineWidth = dim * lineWidthFactor;

  const [tx, ty, sx, sy] = fitter(
    projectedPaths,
    projectedBasePolygon,
    width,
    height
  );

  const { lineJoin = "round", lineCap = "round" } = opts;

  // width += margin * 2;
  // height += margin * 2;

  const outerWidth = margin * 2 + width;
  const outerHeight = margin * 2 + height;

  const units = "px";

  const corePaths = [];

  let basePolyData = projectedBasePolygon
    .map((p, i) => {
      const xy = toScreenPoint(p, tx, ty, sx, sy);
      return [i === 0 ? "M" : "L", ...xy].join(" ");
    })
    .join("");

  // close the path
  basePolyData = basePolyData + "Z";

  const elements = [
    // background
    margin
      ? `<rect x="0" y="0" width="${outerWidth}" height="${outerHeight}" fill="white" />`
      : "",
    `<rect x="0" y="0" width="${width}" height="${height}" fill="${background}" />`,
    // main lines
    `<g class="${mode}" transform="">
    ${draw(projectedPaths)}
          </g>`,
    // base polygon to fill out background
    `<g><path d="${basePolyData}" stroke="none" fill="${background}" /></g>`,
    // another one to handle any blending
    baseColor
      ? `<g class="${mode}"><path d="${basePolyData}" stroke="none" fill="${baseColor}" opacity="${alpha}" /></g>`
      : "",
    // ridge lines
    `<g class="${mode}">
    ${draw(projectedBasePaths)}
          </g>`,
  ]
    .filter(Boolean)
    .map((s) => `      ${s}`)
    .join("\n");

  const graphics = `  <g stroke-linecap=${JSON.stringify(
    lineCap
  )} stroke-linejoin=${JSON.stringify(lineJoin)}>
${elements}
    </g>`;

  return `<?xml version="1.0" standalone="no"?>
  <!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN" 
      "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd">
  <svg width="${outerWidth}${units}" height="${outerHeight}${units}"
      xmlns="http://www.w3.org/2000/svg" version="1.1" viewBox="0 0 ${outerWidth} ${outerHeight}">
  <style>
    .multiply path { mix-blend-mode: multiply; }
    .screen path { mix-blend-mode: screen; }
  </style>
  <g transform="translate(${margin} ${margin})">
    ${graphics}
  </g>
  </svg>`;

  function draw(curPaths) {
    return curPaths
      .map(([paths, color, thickness]) => {
        const curLineWidth = thickness * lineWidth;
        const svgPath = [];
        paths.forEach((path) => {
          path.forEach((p, i) => {
            const x = tx + p[0] * sx;
            const y = ty + p[1] * sy;
            if (i === 0) svgPath.push(["M", x, y]);
            else svgPath.push(["L", x, y]);
            // Special case especially for iOS is to create
            // a path that is 'long enough' to form a visible point
            if (path.length === 1) {
              const jitter = curLineWidth / 20;
              svgPath.push(
                ["L", x - jitter, y - jitter],
                ["L", x + jitter, y + jitter]
              );
            }
          });
        });
        const d = svgPath.map((s) => s.join(" ")).join("");
        return `<path d=${JSON.stringify(
          d
        )} fill="none" stroke="${color}" opacity="${alpha}" stroke-width="${curLineWidth}" />`;
      })
      .map((s) => `      ${s}`)
      .join("\n");
  }
}

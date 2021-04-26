import { fetch, compile, idToHash } from "./core.js";
import render from "./render.js";
import Web3 from "web3";
import ora from "ora";
import chalk from "chalk";
import { promisify } from "util";
import fs from "fs";
import path from "path";
import minimist from "minimist";
import mkdirp from "mkdirp";
import Conf from "conf";
import serialize from "./serialize";

const DEFAULT_RESOLUTION = 42;
const DEFAULT_SIZE = 2048;
const INFURA_PROJECT_ID = "569220dd1f86497882844120d441afa9";
const local = false;

const writeFile = promisify(fs.writeFile);
const readFile = promisify(fs.readFile);

async function fetchFromBlockchain() {
  const web3 = new Web3(
    new Web3.providers.HttpProvider(
      `https://mainnet.infura.io/v3/${INFURA_PROJECT_ID}`
    )
  );
  return fetch(web3);
}

async function run(argv = {}) {
  const cwd = process.cwd();
  let {
    cache = true,
    log = true,
    dir = cwd,
    format = "png",
    name,
    width,
    height,
    resolution,
    id,
  } = argv;

  const hash = idToHash(id);

  if (width != null) {
    width = parseInt(width, 10);
  }
  if (height != null) {
    height = parseInt(height, 10);
  }
  if (width == null && height == null) {
    width = height = DEFAULT_SIZE;
  } else if (width == null || height == null) {
    if (width == null) width = height;
    else height = width;
  }

  if (!format) format = "png";
  format = format.toLowerCase();
  const formats = ["png", "jpg", "svg"];
  if (!formats.includes(format)) {
    return bail(new Error(`Invalid format ${format}, must be png, jpg, svg`));
  }

  const mimeType = {
    png: "image/png",
    jpg: "image/jpeg",
    svg: "image/svg+xml",
  }[format];

  const ext = `.${format}`;

  if (!name) name = `${hash}${ext}`;
  const outFile = path.resolve(dir, name);
  await mkdirp(path.dirname(outFile));

  const subdivisions =
    resolution != null ? parseInt(resolution, 10) : DEFAULT_RESOLUTION;

  let spinner;

  if (log) spinner = ora().start();

  let code, Subscapes;

  let config;
  if (cache) {
    config = new Conf();
    code = config.get("code");
  }

  if (!code) {
    await info("Fetching");
    try {
      code = await fetchFromBlockchain();
      if (cache) config.set("code", code);
    } catch (err) {
      bail(err);
    }
  }

  await info("Rendering");
  try {
    Subscapes = compile(code);
  } catch (err) {
    bail(err);
  }

  const subscapes = Subscapes(hash, true, subdivisions);

  let buf;
  if (format === "svg") {
    buf = serialize(subscapes, { width, height });
  } else {
    const { createCanvas } = require("canvas");
    const canvas = createCanvas(width, height);
    const context = canvas.getContext("2d");
    render(subscapes, { context, width, height });
    buf = canvas.toBuffer(mimeType);
  }

  try {
    await writeFile(outFile, buf);
  } catch (err) {
    bail(err);
  }

  if (spinner) {
    spinner.succeed(`Saved ${chalk.bold(path.relative(cwd, outFile))}`);
  }

  function bail(error) {
    if (spinner) spinner.fail(error.message);
    throw error;
  }

  async function info(text) {
    if (spinner) {
      spinner.text = text;
      spinner.render();
    }
    return new Promise((resolve) => process.nextTick(resolve));
  }
}

const argv = minimist(process.argv.slice(2), {
  string: ["dir", "name", "id", "format"],
  boolean: ["log"],
  default: {
    log: true,
  },
  alias: {
    id: "i",
    width: "w",
    height: "h",
    dir: "d",
    name: "n",
    format: "f",
    resolution: "r",
  },
});

run(argv);

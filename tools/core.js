import hashes from "./hashes";

// Script on blockchain transaction
const TRANSACTION_HASH =
  "0x0d16bc2905299da0695af1edab2368c2cef2a2a44b1ff090a9cea17dbc0f573a";
// ArtBlocks method ID for script
const AB_METHODID = "0xacad0124";

export async function fetch(web3) {
  const result = await web3.eth.getTransaction(TRANSACTION_HASH);
  const decoded = web3.eth.abi.decodeParameters(
    ["uint256", "string"],
    result.input.slice(AB_METHODID.length)
  );
  return decoded["1"];
}

export function compile(src) {
  const script = `
  (() => {
    const RUN = false;
    return ${src}
  })()`;
  return eval(script);
}

export function generate(src, hash) {
  const script = `
  (() => {
    const tokenData = ${JSON.stringify(hash)};
    return ${src}
  })()`;
  return eval(script);
}

export function getRandomHash() {
  let result = "0x";
  for (let i = 64; i > 0; --i)
    result += "0123456789abcdef"[~~(Math.random() * 16)];
  return result;
}

export function idToHash(id) {
  if (id == null) return getRandomHash();
  id = String(id);
  id = id.replace(/^\#/, "");
  if (id === "?") id = String(Math.floor(Math.random() * 650));
  if (id.startsWith("0x")) return id;
  let num = parseInt(id, 10);
  if (!isNaN(num)) {
    if (num < 650) {
      num += 53000000;
    }
    if (num < 53000000 || num > 53000649) {
      throw new Error(`id ${id} out of range 0-649`);
    }
    let index = num - 53000000;
    const h = hashes[index];
    if (!h) throw new Error(`invalid id ${id}`);
    return h;
  } else {
    throw new Error(`id ${id} is not a number`);
  }
}

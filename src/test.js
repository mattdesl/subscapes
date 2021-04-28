import * as random from "./core/random.js";

const hash = random.getRandomHash();
random.set_seed(hash);

console.log(hash);
console.log(random.value());
console.log(random.pick([25, 10]));
console.log(random.weighted([100, 50, 25, 10]));

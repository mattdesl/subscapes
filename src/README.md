# src

The un-minified source code for Subscapes is not currently published, to maintain artistic IP, until a suitable license can be sorted out.

However, I've published here a few of the un-minified utility modules used within the Subscapes module, to help others build similar compact & on-chain JavaScript artworks.

## bundling

Bundling was done with [rollup](https://rollupjs.org/) to produce a very compact JavaScript closure:

```sh
rollup --format=iife --file=dist/index.js src/main.js
```

## minification

Minification was done by combining `babel-minify` with `terser` on the bundled JavaScript, see here:

https://gist.github.com/mattdesl/38058dafb94d6518fc18e76e414ca5ef
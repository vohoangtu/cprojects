// Compile-time dev flag injected by the bundler (esbuild/tsup `define`).
// Ambient declaration keeps library source free of `process`, so consumers
// need no @types/node and the library stays SSR-safe.
declare const __DEV__: boolean;

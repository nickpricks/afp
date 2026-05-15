/** Compile-time exhaustiveness check; throws if reached at runtime. */
export function assertNever(x: never): never {
  throw new Error(`Unexpected value reached assertNever: ${JSON.stringify(x)}`);
}

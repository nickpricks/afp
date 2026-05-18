/**
 * Compile-time exhaustiveness check; throws if reached at runtime.
 * Use as the `default` arm of a switch over a discriminated union — TypeScript
 * fails to compile if a new variant is added without handling.
 *
 * Do NOT silence with `x as never` — that defeats the check and turns the
 * compile error into a runtime crash that only fires on the missed branch.
 */
export function assertNever(x: never): never {
  throw new Error(`Unexpected value reached assertNever: ${JSON.stringify(x)}`);
}

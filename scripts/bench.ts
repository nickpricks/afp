import { Glob } from 'bun';
import { stat } from 'node:fs/promises';
import { join } from 'node:path';

/** Runs a command and returns { stdout, stderr, durationMs } */
async function timedRun(cmd: string[]): Promise<{ stdout: string; stderr: string; durationMs: number }> {
  const start = performance.now();
  const proc = Bun.spawn(cmd, { stdout: 'pipe', stderr: 'pipe' });
  const [stdout, stderr] = await Promise.all([
    new Response(proc.stdout).text(),
    new Response(proc.stderr).text(),
  ]);
  await proc.exited;
  return { stdout, stderr, durationMs: performance.now() - start };
}

/** Formats bytes into human-readable KB */
function formatKB(bytes: number): string {
  return `${(bytes / 1024).toFixed(1)} KB`;
}

/** Formats milliseconds into seconds */
function formatSec(ms: number): string {
  return `${(ms / 1000).toFixed(1)}s`;
}

async function main() {
  console.log('\nAFP Build Bench');
  console.log('─'.repeat(45));

  // 1. Build time
  const build = await timedRun(['bun', 'run', 'build']);
  console.log(`Build time        ${formatSec(build.durationMs)}`);

  // 2. Bundle size
  const distAssets = join(process.cwd(), 'dist', 'assets');
  let totalBytes = 0;
  let largestBytes = 0;
  let largestName = '';

  const glob = new Glob('*.{js,css}');
  for await (const file of glob.scan(distAssets)) {
    const filePath = join(distAssets, file);
    const info = await stat(filePath);
    totalBytes += info.size;
    if (info.size > largestBytes) {
      largestBytes = info.size;
      largestName = file;
    }
  }

  console.log(`Bundle (total)    ${formatKB(totalBytes)}`);
  console.log(`  largest chunk   ${formatKB(largestBytes)} (${largestName})`);

  // 3. Unit test duration
  const unit = await timedRun(['bunx', 'vitest', 'run']);
  const unitMatch = unit.stdout.match(/(\d+)\s+passed/);
  const unitCount = unitMatch ? unitMatch[1] : '?';
  console.log(`Unit tests        ${formatSec(unit.durationMs)} (${unitCount} tests)`);

  // 4. E2E test duration
  const e2e = await timedRun(['bunx', 'playwright', 'test']);
  const e2eMatch = e2e.stdout.match(/(\d+)\s+passed/);
  const e2eCount = e2eMatch ? e2eMatch[1] : '?';
  console.log(`E2E tests         ${formatSec(e2e.durationMs)} (${e2eCount} tests)`);

  console.log('─'.repeat(45));
}

main();

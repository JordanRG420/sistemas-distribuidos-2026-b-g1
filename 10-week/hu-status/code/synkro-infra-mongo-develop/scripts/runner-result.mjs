// Interpret only the supported runner's CLI result, never its private ledger.
export function runnerResult(output, expected, command = 'update') {
  if (!['applied', 'unchanged'].includes(expected)) throw new Error('invalid runner expectation');
  if (command === 'status') {
    if (expected !== 'unchanged' || !/\bis up to date\.?\s*$/m.test(output) ||
      /\bchangesets? (?:has|have) not been applied\b/.test(output)) {
      throw new Error('Sales runner did not prove an up-to-date restoration target');
    }
    return 0;
  }
  const summaries = [...output.matchAll(/^Run:\s+(\d+)\s*$/gm)];
  const applied = summaries.length === 1 ? Number(summaries[0][1]) : NaN;
  if (command !== 'update' || !Number.isSafeInteger(applied) ||
    (expected === 'applied' ? applied < 1 : applied !== 0) ||
    !output.includes('PASS preflight:') || !output.includes('PASS postflight:')) {
    throw new Error('Sales runner did not prove expected changes and both validation phases');
  }
  return applied;
}

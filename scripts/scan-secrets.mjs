import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';

const files = execFileSync('git', ['ls-files', '--cached', '--others', '--exclude-standard', '-z'])
  .toString()
  .split('\0')
  .filter(Boolean)
  .filter(file => !/\.(?:png|jpe?g|gif|ico|mp3|wav|mp4|mov|zip|pdf|woff2?)$/i.test(file));

const checks = [
  ['private key', /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/],
  ['AWS access key', /\b(?:AKIA|ASIA)[A-Z0-9]{16}\b/],
  ['GitHub token', /\bgh[pousr]_[A-Za-z0-9_]{30,}\b/],
  ['DoorSignal integration key', /\bdsk_[a-f0-9]{64}\b/],
  ['JWT', /\beyJ[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{20,}\b/],
];

const findings = [];
for (const file of files) {
  let contents;
  try { contents = readFileSync(file, 'utf8'); } catch { continue; }
  for (const [name, pattern] of checks) {
    if (pattern.test(contents)) findings.push(`${file}: possible ${name}`);
  }
}

if (findings.length) {
  console.error(findings.join('\n'));
  process.exit(1);
}
console.log(`Secret scan passed for ${files.length} source files.`);

const fs = require('fs');
const path = require('path');

const localEnvPath = path.join(__dirname, '..', 'src', 'environments', 'environment.local.ts');

// Skip if file already exists (local dev)
if (fs.existsSync(localEnvPath)) {
  console.log('environment.local.ts exists, skipping generation.');
  process.exit(0);
}

// Parse Environment interface to get valid string property names
const interfacePath = path.join(__dirname, '..', 'src', 'environments', 'environment.interface.ts');
const interfaceSrc = fs.readFileSync(interfacePath, 'utf-8');
const stringKeys = [...interfaceSrc.matchAll(/^\s+(\w+):\s*string;/gm)].map((m) => m[1]);

// Build SCREAMING_SNAKE_CASE → camelCase lookup
// e.g. supabaseUrl → SUPABASE_URL, supabaseAnonKey → SUPABASE_ANON_KEY
function toScreamingSnake(camel) {
  return camel.replace(/[A-Z]/g, (ch) => '_' + ch).toUpperCase();
}

const snakeToCamel = {};
for (const key of stringKeys) {
  snakeToCamel[toScreamingSnake(key)] = key;
}

const overrides = {};

// 1. Auto-match env vars whose SCREAMING_SNAKE_CASE matches an Environment string key
for (const [envVar, value] of Object.entries(process.env)) {
  if (snakeToCamel[envVar]) {
    overrides[snakeToCamel[envVar]] = value;
  }
}

// 2. ENV_ prefixed vars map directly by name (override auto-matched if both exist)
// e.g. ENV_supabaseUrl=https://... → supabaseUrl: 'https://...'
const PREFIX = 'ENV_';
for (const [key, value] of Object.entries(process.env)) {
  if (key.startsWith(PREFIX)) {
    overrides[key.slice(PREFIX.length)] = value;
  }
}

if (!overrides.supabaseUrl || !overrides.supabaseAnonKey) {
  console.warn('Warning: supabaseUrl or supabaseAnonKey not set.');
}

const entries = Object.entries(overrides)
  .map(([key, value]) => `  ${key}: '${value}',`)
  .join('\n');

const content = `import { Environment } from './environment.interface';

export const localOverrides: Partial<Environment> = {
${entries}
};
`;

fs.writeFileSync(localEnvPath, content);
console.log(
  `Generated environment.local.ts with keys: ${Object.keys(overrides).join(', ') || '(none)'}`,
);

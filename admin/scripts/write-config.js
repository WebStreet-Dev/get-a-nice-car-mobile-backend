import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const publicDir = path.join(__dirname, '..', 'public');
const configPath = path.join(publicDir, 'config.json');
const url = process.env.VITE_API_URL || 'http://localhost:3000/api/v1';

if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

fs.writeFileSync(configPath, JSON.stringify({ VITE_API_URL: url }, null, 2), 'utf8');
console.log('Wrote config.json with VITE_API_URL:', url);

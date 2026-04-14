const path = require('path');
const fs = require('fs');

// .env読み込み
const envPaths = [
  path.resolve(__dirname, '..', '.env'),
  path.resolve(process.cwd(), '.env'),
];
for (const ep of envPaths) {
  if (fs.existsSync(ep)) {
    require('dotenv').config({ path: ep, override: true });
    break;
  }
}

module.exports = {
  PORT: process.env.PORT || 3002,
  ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY,
  LINE_CHANNEL_SECRET: process.env.LINE_CHANNEL_SECRET,
  LINE_CHANNEL_ACCESS_TOKEN: process.env.LINE_CHANNEL_ACCESS_TOKEN,
  ADMIN_LINE_USER_ID: process.env.ADMIN_LINE_USER_ID,
  AI_MODEL: 'claude-sonnet-4-20250514',
};

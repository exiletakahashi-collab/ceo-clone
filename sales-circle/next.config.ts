import path from "node:path";
import type { NextConfig } from "next";

// リポジトリ直下に別アプリ（ceo-clone）の lockfile があるため、このフォルダをルートに固定する。
const root = path.resolve(".");

const nextConfig: NextConfig = {
  outputFileTracingRoot: root,
  turbopack: { root },
};

export default nextConfig;

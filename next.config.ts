import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Docker のマルチステージビルドで最小構成のイメージを作るため standalone 出力を有効化
  output: "standalone",
};

export default nextConfig;

module.exports = {
  apps: [
    {
      name: "sashvi-backend",
      cwd: "./sashvi-studio-suite-main/backend",
      script: "./node_modules/.bin/ts-node-dev.cmd",
      args: "--respawn --transpile-only -r dotenv/config src/index.ts",
      interpreter: "none",
    },
    {
      name: "sashvi-frontend",
      cwd: "./sashvi-studio-suite-main",
      script: "./node_modules/.bin/vite",
      args: "dev",
      interpreter: "node",
    },
  ],
};

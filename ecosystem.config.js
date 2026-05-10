module.exports = {
  apps: [
    {
      name: "dudoserr-bot",
      script: "dist/index.js",
      cwd: __dirname,
      interpreter: "node",
      env: {
        NODE_ENV: "production",
        TZ: "Europe/Moscow",
      },
      out_file: "./data/logs/pm2-out.log",
      error_file: "./data/logs/pm2-error.log",
      merge_logs: true,
      autorestart: true,
      max_restarts: 10,
      min_uptime: "10s",
    },
  ],
};

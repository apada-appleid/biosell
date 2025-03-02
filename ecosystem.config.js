module.exports = {
  apps: [
    {
      name: "shopgram-front",
      script: "yarn",
      args: "start",
      cwd: "/path/to/your/app", // Update this to your actual app path on the server
      env: {
        NODE_ENV: "production",
        PORT: 5010, // Set your permanent port here
      },
      watch: false,
      instances: "max", // Use 'max' to leverage all available CPU cores, or specify a number
      exec_mode: "cluster",
      autorestart: true,
      max_memory_restart: "1G",
    },
  ],
}; 
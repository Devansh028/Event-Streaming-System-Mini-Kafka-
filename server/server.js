require("dotenv").config();
const logger = require("./utils/simpleLogger");
const http = require("http");
const Redis = require("ioredis");
const app = require("./app");
const connectDB = require("./config/db");
const { initSocket, emitEvent } = require("./sockets/socketHandler");

const PORT = process.env.PORT || 5000;

const start = async () => {
  await connectDB();

  const server = http.createServer(app);
  initSocket(server);

  const redisSub = new Redis(process.env.REDIS_URL);
  await redisSub.subscribe("events");

  redisSub.on("message", (channel, message) => {
    if (channel === "events") {
      try {
        const data = JSON.parse(message);
        console.log("Sending to client:", data);
        emitEvent(data);
      } catch (err) {
        console.error("Invalid message:", message);
      }
    }
  });

  server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    logger.info(`Server running on port ${PORT}`);
  });
};

start();

process.on("SIGINT", () => {
  console.log("Shutting down...");
  process.exit();
});
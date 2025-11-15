const { spawn } = require("child_process");

let createClient;
try {
  ({ createClient } = require("redis"));
} catch (error) {
  console.warn(
    "redis package not found, falling back to redis-cli for local use.",
  );
}

let client;
let fallbackClient;

async function getClient() {
  if (createClient) {
    if (client?.isOpen) {
      return client;
    }

    if (!client) {
      const url = process.env.REDIS_URL || "redis://127.0.0.1:6379";
      client = createClient({ url });

      client.on("error", (error) => {
        console.error("Redis client error:", error);
      });
    }

    if (!client.isOpen) {
      await client.connect();
    }

    return client;
  }

  if (!fallbackClient) {
    fallbackClient = createRedisCliClient();
  }

  return fallbackClient;
}

function createRedisCliClient() {
  const url = process.env.REDIS_URL || "redis://127.0.0.1:6379";
  const state = {
    isOpen: true,
    errorHandler: null,
  };

  async function execRedisCli(args) {
    return new Promise((resolve, reject) => {
      const child = spawn("redis-cli", ["--raw", "-u", url, ...args]);
      let stdout = "";
      let stderr = "";

      child.stdout.on("data", (data) => {
        stdout += data.toString();
      });

      child.stderr.on("data", (data) => {
        stderr += data.toString();
      });

      child.on("error", (error) => {
        state.errorHandler?.(error);
        reject(error);
      });

      child.on("close", (code) => {
        if (code === 0) {
          resolve(stdout.trim());
        } else {
          const error = new Error(
            stderr || `redis-cli exited with code ${code}`,
          );
          state.errorHandler?.(error);
          reject(error);
        }
      });
    });
  }

  return {
    get isOpen() {
      return state.isOpen;
    },
    async connect() {
      state.isOpen = true;
    },
    async get(key) {
      const result = await execRedisCli(["GET", key]);
      if (!result || result === "(nil)") {
        return null;
      }

      return result;
    },
    async setEx(key, ttl, value) {
      await execRedisCli(["SETEX", key, String(ttl), value]);
    },
    async keys(pattern) {
      const result = await execRedisCli(["KEYS", pattern]);
      if (!result || result === "(empty list or set)") {
        return [];
      }

      return result.split("\n").filter(Boolean);
    },
    on(event, handler) {
      if (event === "error") {
        state.errorHandler = handler;
      }
    },
  };
}

module.exports = {
  getClient,
};

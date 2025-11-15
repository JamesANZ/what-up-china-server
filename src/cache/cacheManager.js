const { getClient } = require("./redisClient");

const DAY_IN_MS = 24 * 60 * 60 * 1000;
const DEFAULT_TTL_SECONDS = Math.floor(DAY_IN_MS / 1000);
const TTL_SECONDS =
  parseInt(process.env.CACHE_TTL_SECONDS, 10) || DEFAULT_TTL_SECONDS;

async function getSection(key) {
  const client = await getClient();
  const raw = await client.get(key);
  return raw ? JSON.parse(raw) : null;
}

async function setSection(key, data) {
  const client = await getClient();
  const payload = {
    updatedAt: new Date().toISOString(),
    data,
  };

  await client.setEx(key, TTL_SECONDS, JSON.stringify(payload));
  return payload;
}

function isFresh(section, ttl = DAY_IN_MS) {
  if (!section || !section.updatedAt) {
    return false;
  }

  const lastUpdated = new Date(section.updatedAt).getTime();
  if (Number.isNaN(lastUpdated)) {
    return false;
  }

  return Date.now() - lastUpdated <= ttl;
}

async function getAllSections() {
  const client = await getClient();
  const keys = await client.keys("*");

  const resultEntries = await Promise.all(
    keys.map(async (key) => {
      const raw = await client.get(key);
      return raw ? [key, JSON.parse(raw)] : null;
    }),
  );

  return resultEntries.reduce((acc, entry) => {
    if (!entry) {
      return acc;
    }
    const [key, value] = entry;
    acc[key] = value;
    return acc;
  }, {});
}

module.exports = {
  DAY_IN_MS,
  TTL_SECONDS,
  getSection,
  setSection,
  isFresh,
  getAllSections,
};

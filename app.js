const express = require("express");
const app = express();
const port = process.env.PORT || 3000;
const { getSection, isFresh } = require("./src/cache/cacheManager");
const CACHE_KEYS = require("./src/cache/cacheKeys");

app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  next();
});

const ROUTE_CACHE_MAP = {
  "/baidu/hot-news/": CACHE_KEYS.BAIDU_HOT_NEWS,
  "/top-news/": CACHE_KEYS.TOP_NEWS,
  "/bilibili/trending/": CACHE_KEYS.BILIBILI_TRENDING,
  "/baidu/hot-search/": CACHE_KEYS.BAIDU_REALTIME_HOT_SEARCH,
  "/toutiao/hot-board/": CACHE_KEYS.TOUTIAO_HOT_BOARD,
  "/douban/hot-movies/": CACHE_KEYS.DOUBAN_HOT_MOVIES,
};

Object.entries(ROUTE_CACHE_MAP).forEach(([path, cacheKey]) => {
  app.get(path, async (req, res) => {
    await sendCachedResponse(res, cacheKey);
  });
});

async function sendCachedResponse(res, key) {
  try {
    const cachedSection = await getSection(key);

    if (!isFresh(cachedSection)) {
      res.status(503).send({
        error: `Cached data for ${key} is unavailable or stale.`,
      });
      return;
    }

    res.send(cachedSection.data);
  } catch (error) {
    console.error(`Failed to read cache for ${key}`, error);
    res.status(500).send({
      error: `Failed to read cache for ${key}`,
    });
  }
}

app.listen(port, () => console.log(`listening at ${port}`));

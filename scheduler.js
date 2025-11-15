const CACHE_KEYS = require("./src/cache/cacheKeys");
const { setSection } = require("./src/cache/cacheManager");
const {
  getTopNews,
  getBaiduHotNews,
  getBilibiliTrending,
  getBaiduRealtimeHotSearch,
  getToutiaoHotBoard,
  getDoubanHotMovies,
} = require("./src/services/newsService");

async function refreshCache() {
  const [
    topNews,
    baiduHotNews,
    bilibiliTrending,
    baiduRealtimeHotSearch,
    toutiaoHotBoard,
    doubanHotMovies,
  ] = await Promise.all([
    getTopNews(),
    getBaiduHotNews(),
    getBilibiliTrending(),
    getBaiduRealtimeHotSearch(),
    getToutiaoHotBoard(),
    getDoubanHotMovies(),
  ]);

  await Promise.all([
    setSection(CACHE_KEYS.TOP_NEWS, topNews),
    setSection(CACHE_KEYS.BAIDU_HOT_NEWS, baiduHotNews),
    setSection(CACHE_KEYS.BILIBILI_TRENDING, bilibiliTrending),
    setSection(CACHE_KEYS.BAIDU_REALTIME_HOT_SEARCH, baiduRealtimeHotSearch),
    setSection(CACHE_KEYS.TOUTIAO_HOT_BOARD, toutiaoHotBoard),
    setSection(CACHE_KEYS.DOUBAN_HOT_MOVIES, doubanHotMovies),
  ]);

  return {
    [CACHE_KEYS.TOP_NEWS]: topNews.length,
    [CACHE_KEYS.BAIDU_HOT_NEWS]: baiduHotNews.length,
    [CACHE_KEYS.BILIBILI_TRENDING]: bilibiliTrending.length,
    [CACHE_KEYS.BAIDU_REALTIME_HOT_SEARCH]: baiduRealtimeHotSearch.length,
    [CACHE_KEYS.TOUTIAO_HOT_BOARD]: toutiaoHotBoard.length,
    [CACHE_KEYS.DOUBAN_HOT_MOVIES]: doubanHotMovies.length,
  };
}

if (require.main === module) {
  refreshCache()
    .then((summary) => {
      console.log("Cache refreshed successfully:", summary);
    })
    .catch((error) => {
      console.error("Cache refresh failed:", error);
      process.exit(1);
    });
}

module.exports = refreshCache;

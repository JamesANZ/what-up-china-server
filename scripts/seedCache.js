const CACHE_KEYS = require("../src/cache/cacheKeys");
const { setSection } = require("../src/cache/cacheManager");

async function seed() {
  const summary = await Promise.all([
    setSection(CACHE_KEYS.TOP_NEWS, [
      { title: "Sample headline A", url: "https://example.com/a" },
    ]),
    setSection(CACHE_KEYS.BAIDU_HOT_NEWS, [
      { title: "百度热搜示例", link: "https://news.example.cn/b" },
    ]),
    setSection(CACHE_KEYS.BILIBILI_TRENDING, [
      { title: "Bilibili trending demo", bvid: "BV1xx411c7mD" },
    ]),
    setSection(CACHE_KEYS.BAIDU_REALTIME_HOT_SEARCH, [
      {
        title: "实时热搜示例",
        summary: "Some description",
        url: "https://baidu.example.com/hot",
      },
    ]),
    setSection(CACHE_KEYS.TOUTIAO_HOT_BOARD, [
      { title: "今日头条热点", url: "https://toutiao.example.com" },
    ]),
    setSection(CACHE_KEYS.DOUBAN_HOT_MOVIES, [
      { title: "豆瓣热映示例", url: "https://movie.example.com", rating: 9.1 },
    ]),
  ]);

  console.log(
    "Seeded cache sections:",
    summary.map((section) => section.data.length),
  );
}

seed()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Failed to seed cache", error);
    process.exit(1);
  });

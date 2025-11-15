const request = require("superagent");
const { parse } = require("node-html-parser");

const DEFAULT_USER_AGENT =
  process.env.HTTP_USER_AGENT ||
  "what-up-china-server/1.0 (+https://github.com/James-Sangalli/what-up-china)";

const DEFAULT_NEWS_API_KEYS = [
  "6d7709b0ec234faab6e438466941c2ae",
  "15e281928b994633ab09b55784ce35cd",
  "0e9d878eeb994e5087ad30e40e5706db",
  "220c2dd1a5e549e7beab64f259af5675",
];

const NEWS_API_KEYS = (process.env.NEWS_API_KEYS || "")
  .split(",")
  .map((key) => key.trim())
  .filter(Boolean);

const ACTIVE_NEWS_API_KEYS = NEWS_API_KEYS.length
  ? NEWS_API_KEYS
  : DEFAULT_NEWS_API_KEYS;

const NEWS_API_ENDPOINT = "https://newsapi.org/v2/top-headlines";
const BILIBILI_ENDPOINT =
  "https://api.bilibili.com/x/web-interface/dynamic/region";
const BAIDU_NEWS_ENDPOINT = "https://news.baidu.com/";
const BAIDU_REALTIME_ENDPOINT =
  "https://top.baidu.com/api/board?platform=pc&tab=realtime";
const TOUTIAO_HOT_BOARD_ENDPOINT = "https://i.snssdk.com/hot-event/hot-board/";
const DOUBAN_HOT_MOVIES_ENDPOINT = "https://movie.douban.com/j/search_subjects";
const DOUBAN_DEFAULT_QUERY = {
  type: "movie",
  tag: "热门",
  sort: "recommend",
  page_limit: 10,
  page_start: 0,
};

function withUserAgent(req) {
  return req.set("User-Agent", DEFAULT_USER_AGENT);
}

function parseJsonResponse(result) {
  if (result.body && Object.keys(result.body).length) {
    return result.body;
  }

  return JSON.parse(result.text);
}

async function getTopNews(apiKeyIndex = 0) {
  if (!ACTIVE_NEWS_API_KEYS.length) {
    throw new Error("No News API keys configured.");
  }

  if (apiKeyIndex >= ACTIVE_NEWS_API_KEYS.length) {
    throw new Error("All News API keys exhausted while fetching top news.");
  }

  const apiKey = ACTIVE_NEWS_API_KEYS[apiKeyIndex];

  try {
    const result = await withUserAgent(
      request.get(NEWS_API_ENDPOINT)
    )
      .query({ country: "cn", apiKey });

    const payload =
      result.body && result.body.articles
        ? result.body
        : JSON.parse(result.text);

    return payload.articles || [];
  } catch (error) {
    const status = error.status || error.response?.status;

    if (status === 429 || error.message === "Too Many Requests") {
      return getTopNews(apiKeyIndex + 1);
    }

    throw error;
  }
}

async function getBaiduHotNews() {
  const result = await withUserAgent(request.get(BAIDU_NEWS_ENDPOINT));
  const parsedHtml = parse(result.text);
  const hotNewsSection = parsedHtml.querySelector(".hotnews");

  if (!hotNewsSection) {
    return [];
  }

  const links = hotNewsSection.querySelectorAll("a");

  return links
    .map((link) => ({
      title: link.text.trim(),
      link: link.getAttribute("href"),
    }))
    .filter((article) => article.title && article.link);
}

async function getBilibiliTrending() {
  const result = await withUserAgent(
    request.get(BILIBILI_ENDPOINT)
  ).query({ jsonp: "jsonp", ps: 10, rid: 1 });

  const payload = parseJsonResponse(result);

  return payload?.data?.archives || [];
}

async function getBaiduRealtimeHotSearch() {
  const result = await withUserAgent(request.get(BAIDU_REALTIME_ENDPOINT));
  const payload = parseJsonResponse(result);
  const cards = payload?.data?.cards || [];
  const hotListCard =
    cards.find((card) => card.component === "hotList") || cards[0] || {};

  return (hotListCard.content || [])
    .map((item) => ({
      title: item.word,
      summary: item.desc,
      url: item.url || item.rawUrl,
      hotScore: Number(item.hotScore) || null,
      image: item.img,
      tag: item.hotTag,
      tagImage: item.hotTagImg,
    }))
    .filter((item) => item.title && item.url);
}

async function getToutiaoHotBoard() {
  const result = await withUserAgent(
    request.get(TOUTIAO_HOT_BOARD_ENDPOINT)
  ).query({ origin: "toutiao_pc" });

  const payload = parseJsonResponse(result);
  const items = payload?.data || [];

  return items.map((item) => ({
    title: item.Title,
    query: item.QueryWord,
    url: item.Url,
    hotValue: Number(item.HotValue) || null,
    label: item.Label || item.LabelDesc || null,
    image: item.Image?.url,
  }));
}

async function getDoubanHotMovies() {
  const result = await withUserAgent(
    request.get(DOUBAN_HOT_MOVIES_ENDPOINT)
  ).query(DOUBAN_DEFAULT_QUERY);

  const payload = parseJsonResponse(result);
  return (payload.subjects || []).map((subject) => ({
    id: subject.id,
    title: subject.title,
    rating: subject.rate ? Number(subject.rate) : null,
    url: subject.url,
    cover: subject.cover,
    isNew: Boolean(subject.is_new),
  }));
}

module.exports = {
  getTopNews,
  getBaiduHotNews,
  getBilibiliTrending,
  getBaiduRealtimeHotSearch,
  getToutiaoHotBoard,
  getDoubanHotMovies,
};

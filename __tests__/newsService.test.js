const nock = require("nock");

describe("newsService", () => {
  const mockArticles = [{ title: "Test", url: "https://example.com" }];
  const mockBilibili = [{ id: 1, title: "Video" }];
  const mockBaiduHtml = `
    <div class="hotnews">
      <ul>
        <li><strong><a href="https://news.example.com/a">Test Headline</a></strong></li>
        <li><a href="https://news.example.com/b">Second Headline</a></li>
      </ul>
    </div>
  `;
  const mockBaiduRealtime = {
    data: {
      cards: [
        {
          component: "hotList",
          content: [
            {
              word: "热搜1",
              desc: "描述1",
              url: "https://baidu.com/1",
              hotScore: "1234",
              img: "https://img.com/1.png",
              hotTag: "爆",
            },
          ],
        },
      ],
    },
  };
  const mockToutiao = {
    data: [
      {
        Title: "今日头条热点",
        QueryWord: "测试词",
        Url: "https://toutiao.com/a",
        HotValue: "5678",
        Label: "hot",
        Image: { url: "https://img.com/tt.png" },
      },
    ],
  };
  const mockDouban = {
    subjects: [
      {
        id: "123",
        title: "豆瓣热映",
        rate: "8.5",
        url: "https://movie.douban.com/subject/123/",
        cover: "https://img.doubanio.com/a.jpg",
        is_new: true,
      },
    ],
  };

  beforeEach(() => {
    jest.resetModules();
    process.env.NEWS_API_KEYS = "test-key-1,test-key-2";
    nock.cleanAll();
  });

  afterEach(() => {
    nock.cleanAll();
  });

  afterAll(() => {
    nock.restore();
  });

  test("getTopNews returns articles on success", async () => {
    const { getTopNews } = require("../src/services/newsService");

    nock("https://newsapi.org")
      .get("/v2/top-headlines")
      .query({ country: "cn", apiKey: "test-key-1" })
      .reply(200, { articles: mockArticles });

    const response = await getTopNews();
    expect(response).toEqual(mockArticles);
  });

  test("getTopNews rotates API keys on 429 error", async () => {
    const { getTopNews } = require("../src/services/newsService");

    nock("https://newsapi.org")
      .get("/v2/top-headlines")
      .query({ country: "cn", apiKey: "test-key-1" })
      .reply(429, { message: "Too Many Requests" });

    nock("https://newsapi.org")
      .get("/v2/top-headlines")
      .query({ country: "cn", apiKey: "test-key-2" })
      .reply(200, { articles: mockArticles });

    const response = await getTopNews();
    expect(response).toEqual(mockArticles);
  });

  test("getBaiduHotNews parses titles and links", async () => {
    const { getBaiduHotNews } = require("../src/services/newsService");

    nock("https://news.baidu.com").get("/").reply(200, mockBaiduHtml);

    const response = await getBaiduHotNews();
    expect(response).toEqual([
      { title: "Test Headline", link: "https://news.example.com/a" },
      { title: "Second Headline", link: "https://news.example.com/b" },
    ]);
  });

  test("getBilibiliTrending returns archives list", async () => {
    const { getBilibiliTrending } = require("../src/services/newsService");

    nock("https://api.bilibili.com")
      .get("/x/web-interface/dynamic/region")
      .query({ jsonp: "jsonp", ps: 10, rid: 1 })
      .reply(200, { data: { archives: mockBilibili } });

    const response = await getBilibiliTrending();
    expect(response).toEqual(mockBilibili);
  });

  test("getBaiduRealtimeHotSearch parses hot board entries", async () => {
    const {
      getBaiduRealtimeHotSearch,
    } = require("../src/services/newsService");

    nock("https://top.baidu.com")
      .get("/api/board")
      .query({ platform: "pc", tab: "realtime" })
      .reply(200, mockBaiduRealtime);

    const response = await getBaiduRealtimeHotSearch();
    expect(response).toEqual([
      {
        title: "热搜1",
        summary: "描述1",
        url: "https://baidu.com/1",
        hotScore: 1234,
        image: "https://img.com/1.png",
        tag: "爆",
        tagImage: undefined,
      },
    ]);
  });

  test("getToutiaoHotBoard normalizes trending list", async () => {
    const { getToutiaoHotBoard } = require("../src/services/newsService");

    nock("https://i.snssdk.com")
      .get("/hot-event/hot-board/")
      .query({ origin: "toutiao_pc" })
      .reply(200, mockToutiao);

    const response = await getToutiaoHotBoard();
    expect(response).toEqual([
      {
        title: "今日头条热点",
        query: "测试词",
        url: "https://toutiao.com/a",
        hotValue: 5678,
        label: "hot",
        image: "https://img.com/tt.png",
      },
    ]);
  });

  test("getDoubanHotMovies reads movie subjects", async () => {
    const { getDoubanHotMovies } = require("../src/services/newsService");

    nock("https://movie.douban.com")
      .get("/j/search_subjects")
      .query({
        type: "movie",
        tag: "热门",
        sort: "recommend",
        page_limit: "10",
        page_start: "0",
      })
      .reply(200, mockDouban);

    const response = await getDoubanHotMovies();
    expect(response).toEqual([
      {
        id: "123",
        title: "豆瓣热映",
        rating: 8.5,
        url: "https://movie.douban.com/subject/123/",
        cover: "https://img.doubanio.com/a.jpg",
        isNew: true,
      },
    ]);
  });
});

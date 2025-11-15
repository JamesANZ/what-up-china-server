# what-up-china-server

The server for whatupchina.org.

The application code can be found here: https://github.com/James-Sangalli/what-up-china

## Architecture

- `app.js` exposes read-only endpoints that serve cached data from Redis.
- `scheduler.js` fetches fresh data from upstream APIs and stores it in Redis with a 24h TTL. Run it daily via Heroku Scheduler (`npm run scheduler`).
- `src/services/newsService.js` contains the API call logic so it can be tested in isolation.

### Cached Sources & Endpoints

| Source                                                   | Endpoint              |
| -------------------------------------------------------- | --------------------- |
| Baidu Hot News (news.baidu.com)                          | `/baidu/hot-news/`    |
| Baidu Realtime Hot Search API (`top.baidu.com`)          | `/baidu/hot-search/`  |
| NewsAPI China headlines                                  | `/top-news/`          |
| Bilibili regional trending feed                          | `/bilibili/trending/` |
| Toutiao Hot Board (`i.snssdk.com/hot-event/hot-board`)   | `/toutiao/hot-board/` |
| Douban hot movies (`movie.douban.com/j/search_subjects`) | `/douban/hot-movies/` |

All endpoints are read-only and respond with a 503 status when the scheduler has not yet populated the cache (e.g., immediately after a dyno restart).

## Setup

1. Provision a Redis instance (e.g. Heroku Redis) and expose the connection string as `REDIS_URL`.
2. Install dependencies: `npm install` (requires network access).
3. Run the cache refresher locally: `npm run scheduler`.
4. Start the server: `npm start` (expects cached data to exist; otherwise endpoints respond with 503).

## Testing

```
npm test
```

Tests mock all upstream API calls and verify the parsing / rotation logic.

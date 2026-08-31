import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

async function render() {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);
  return worker.fetch(
    new Request("http://localhost/", { headers: { accept: "text/html" } }),
    { ASSETS: { fetch: async () => new Response("Not found", { status: 404 }) } },
    { waitUntil() {}, passThroughOnException() {} },
  );
}

test("server-renders the focused Verci Chess leaderboard", async () => {
  const response = await render();
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);
  const html = await response.text();
  assert.match(html, /<title>Verci Chess — Community Leaderboard<\/title>/i);
  assert.match(html, /VERCI CHESS/);
  assert.match(html, /Leaderboard/);
  assert.match(html, /Enter match/);
  assert.doesNotMatch(html, /Recent games|coffee/i);
});

test("ranks only participants and weights a first result", async () => {
  const [page, stateRoute, gamesRoute] = await Promise.all([
    readFile(new URL("../app/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/api/state/route.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/api/games/route.ts", import.meta.url), "utf8"),
  ]);
  assert.doesNotMatch(page, /LaurelWreath|wreath-shimmer/);
  assert.match(page, /selectedPlayerGames/);
  assert.match(page, /PLAYER HISTORY/);
  assert.match(page, /onError=\{\(\) => setImageFailed\(true\)\}/);
  assert.match(page, /const PLAYER_PAGE_SIZE = 32/);
  assert.match(page, /onScroll=\{loadMore\}/);
  assert.match(page, /role="combobox"/);
  assert.match(stateRoute, /WHERE wins \+ losses > 0/);
  assert.match(stateRoute, /ORDER BY rating DESC/);
  assert.match(stateRoute, /FROM games g/);
  assert.match(stateRoute, /winner\.name AS winnerName/);
  assert.match(gamesRoute, /winner\.wins \+ winner\.losses === 0 \? 40 : 32/);
  assert.match(gamesRoute, /loser\.wins \+ loser\.losses === 0 \? 40 : 32/);
});

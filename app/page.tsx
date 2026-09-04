"use client";

import { FormEvent, UIEvent, useEffect, useId, useMemo, useState } from "react";

type Player = {
  id: string;
  name: string;
  image: string | null;
  rating: number;
  wins: number;
  losses: number;
  createdAt: number;
};

type Game = {
  id: string;
  winnerId: string;
  loserId: string;
  winnerBefore: number;
  winnerAfter: number;
  loserBefore: number;
  loserAfter: number;
  winnerName: string;
  winnerImage: string | null;
  loserName: string;
  loserImage: string | null;
  createdAt: number;
};

function initials(name: string) {
  return name.split(/\s+/).slice(0, 2).map((part) => part[0]).join("").toUpperCase();
}

function firstName(name: string) {
  return name.trim().split(/\s+/)[0] || name;
}

function formatGameDate(timestamp: number) {
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" }).format(new Date(timestamp));
}

function Avatar({ player, large = false }: { player: Pick<Player, "name" | "image">; large?: boolean }) {
  const [imageFailed, setImageFailed] = useState(false);
  const className = large ? "avatar avatar-large" : "avatar";
  return player.image && !imageFailed ? <img className={className} src={player.image} alt="" onError={() => setImageFailed(true)} /> : (
    <span className={`${className} avatar-fallback`} aria-hidden="true">{initials(firstName(player.name))}</span>
  );
}

const PLAYER_PAGE_SIZE = 32;

function PlayerPicker({ label, value, players, excludeId, onChange }: {
  label: string;
  value: string;
  players: Player[];
  excludeId: string;
  onChange: (id: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [visibleCount, setVisibleCount] = useState(PLAYER_PAGE_SIZE);
  const inputId = useId();
  const selected = players.find((player) => player.id === value);
  const filteredResults = useMemo(() => {
    const normalized = query.trim().toLocaleLowerCase();
    return players
      .filter((player) => player.id !== excludeId)
      .filter((player) => !normalized || player.name.toLocaleLowerCase().includes(normalized));
  }, [players, excludeId, query]);
  const visibleResults = filteredResults.slice(0, visibleCount);

  function openPicker() {
    if (!open) { setQuery(""); setVisibleCount(PLAYER_PAGE_SIZE); }
    setOpen(true);
  }

  function selectPlayer(player: Player) {
    onChange(player.id);
    setQuery("");
    setVisibleCount(PLAYER_PAGE_SIZE);
    setOpen(false);
  }

  function loadMore(event: UIEvent<HTMLDivElement>) {
    const list = event.currentTarget;
    if (list.scrollTop + list.clientHeight >= list.scrollHeight - 56) {
      setVisibleCount((current) => Math.min(current + PLAYER_PAGE_SIZE, filteredResults.length));
    }
  }

  return (
    <div className={`player-picker ${open ? "picker-open" : ""}`}>
      <label htmlFor={inputId}>{label}</label>
      <div className="picker-input-shell">
        {selected && !open ? <Avatar player={selected} /> : <span className="picker-search-icon" aria-hidden="true">⌕</span>}
        <input
          id={inputId}
          role="combobox"
          aria-autocomplete="list"
          aria-expanded={open}
          aria-controls={`${inputId}-results`}
          value={open ? query : selected ? firstName(selected.name) : query}
          placeholder={`Search ${players.length.toLocaleString()} people`}
          onFocus={openPicker}
          onClick={openPicker}
          onChange={(event) => { if (value) onChange(""); setQuery(event.target.value); setVisibleCount(PLAYER_PAGE_SIZE); setOpen(true); }}
          onKeyDown={(event) => {
            if (event.key === "Escape") { event.stopPropagation(); setOpen(false); setQuery(""); }
            if (event.key === "Enter" && open) { event.preventDefault(); if (visibleResults[0]) selectPlayer(visibleResults[0]); }
          }}
        />
        <span className="chevron" aria-hidden="true">⌄</span>
      </div>
      {open && (
        <div className="picker-menu">
          <div className="picker-results" id={`${inputId}-results`} role="listbox" aria-label={`${label} search results`} onScroll={loadMore}>
            {visibleResults.map((player) => (
              <button key={player.id} type="button" role="option" aria-selected={player.id === value} onMouseDown={(event) => event.preventDefault()} onClick={() => selectPlayer(player)}>
                <Avatar player={player} />
                <span><b>{firstName(player.name)}</b><small>{player.wins + player.losses > 0 ? `${player.rating} rating` : "New player · 1200"}</small></span>
              </button>
            ))}
            {filteredResults.length === 0 && <p>No people match “{query}”.</p>}
          </div>
          {filteredResults.length > 0 && <div className="picker-results-footer">Showing {visibleResults.length.toLocaleString()} of {filteredResults.length.toLocaleString()}</div>}
        </div>
      )}
    </div>
  );
}

export default function Home() {
  const [leaderboard, setLeaderboard] = useState<Player[]>([]);
  const [directory, setDirectory] = useState<Player[]>([]);
  const [games, setGames] = useState<Game[]>([]);
  const [winnerId, setWinnerId] = useState("");
  const [loserId, setLoserId] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedPlayerId, setSelectedPlayerId] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState("");

  async function loadState() {
    const response = await fetch("/api/state", { cache: "no-store" });
    const data = await response.json() as { leaderboard?: Player[]; directory?: Player[]; games?: Game[]; error?: string };
    if (!response.ok) throw new Error(data.error || "Unable to load the leaderboard.");
    return data;
  }

  async function refresh() {
    const data = await loadState();
    setLeaderboard(data.leaderboard || []);
    setDirectory(data.directory || []);
    setGames(data.games || []);
  }

  useEffect(() => {
    let cancelled = false;
    void loadState()
      .then((data) => {
        if (cancelled) return;
        setLeaderboard(data.leaderboard || []);
        setDirectory(data.directory || []);
        setGames(data.games || []);
      })
      .catch((error) => {
        if (!cancelled) setNotice(error instanceof Error ? error.message : "Unable to load the leaderboard.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (!modalOpen && !selectedPlayerId) return;
    document.body.classList.add("modal-active");
    const handleKey = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      setModalOpen(false);
      setSelectedPlayerId("");
    };
    document.addEventListener("keydown", handleKey);
    return () => { document.body.classList.remove("modal-active"); document.removeEventListener("keydown", handleKey); };
  }, [modalOpen, selectedPlayerId]);

  async function submitGame(event: FormEvent) {
    event.preventDefault();
    if (!winnerId || !loserId || winnerId === loserId) return;
    setSaving(true);
    setNotice("");
    const winner = directory.find((player) => player.id === winnerId);
    const loser = directory.find((player) => player.id === loserId);
    try {
      const response = await fetch("/api/games", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ winnerId, loserId }) });
      const data = await response.json() as { error?: string };
      if (!response.ok) throw new Error(data.error || "Unable to record the match.");
      await refresh();
      setModalOpen(false);
      setWinnerId("");
      setLoserId("");
      setNotice(`${winner ? firstName(winner.name) : "Winner"} beat ${loser ? firstName(loser.name) : "loser"}. Rankings updated.`);
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Unable to record the match.");
    } finally { setSaving(false); }
  }

  const topThree = leaderboard.slice(0, 3);
  const selectedPlayer = leaderboard.find((player) => player.id === selectedPlayerId);
  const selectedPlayerGames = games.filter((game) => game.winnerId === selectedPlayerId || game.loserId === selectedPlayerId);

  return (
    <main className="page-shell">
      <header className="topbar">
        <a className="wordmark" href="#top" aria-label="Verci Chess home"><span aria-hidden="true">♞</span><b>VERCI CHESS</b></a>
        <div className="topbar-actions">
          <a className="model-link" href="/board"><span aria-hidden="true">◈</span> 3D board</a>
          <button className="match-button" type="button" onClick={() => setModalOpen(true)}><span>＋</span> Enter match</button>
        </div>
      </header>

      <section className="leaderboard" id="top">
        <div className="title-row">
          <div className="title-copy"><p>VERCI COMMUNITY</p><h1>Leaderboard</h1></div>
          <span className="ranked-count"><i aria-hidden="true" />{leaderboard.length} ranked {leaderboard.length === 1 ? "player" : "players"}</span>
        </div>

        {notice && <div className="notice" role="status"><span>{notice}</span><button type="button" onClick={() => setNotice("")} aria-label="Dismiss notification">×</button></div>}

        {loading ? <div className="empty-state">Loading rankings…</div> : leaderboard.length === 0 ? (
          <div className="empty-state">
            <span className="empty-piece" aria-hidden="true">♟</span>
            <h2>No ranked players yet.</h2>
            <p>Record the first match. Both players will appear here immediately.</p>
            <button className="text-button" type="button" onClick={() => setModalOpen(true)}>Enter the first match →</button>
          </div>
        ) : (
          <>
            <div className={`podium podium-${topThree.length}`} aria-label="Top ranked players">
              {topThree.map((player, index) => (
                <button className={`podium-player rank-${index + 1}`} type="button" key={player.id} onClick={() => setSelectedPlayerId(player.id)} aria-label={`View ${firstName(player.name)}'s match history`}>
                  <Avatar player={player} large />
                  <h2>{firstName(player.name)}</h2><b>{player.rating}</b><small>{player.wins} - {player.losses}</small><i aria-hidden="true" />
                </button>
              ))}
            </div>
            <div className="ranking-table" role="table" aria-label="Chess rankings">
              <div className="ranking-head" role="row"><span role="columnheader">Rank</span><span role="columnheader">Player</span><span role="columnheader">Record</span><span role="columnheader">Rating</span></div>
              {leaderboard.map((player, index) => (
                <div className="ranking-row" role="row" tabIndex={0} key={player.id} onClick={() => setSelectedPlayerId(player.id)} onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); setSelectedPlayerId(player.id); } }} aria-label={`View ${firstName(player.name)}'s match history`}>
                  <span className={`rank-badge rank-badge-${index + 1}`} role="cell">{index + 1}</span>
                  <span className="row-player" role="cell"><Avatar player={player} /><b>{firstName(player.name)}</b></span>
                  <span className="row-record" role="cell"><b>{player.wins}</b> - <b>{player.losses}</b></span>
                  <strong role="cell">{player.rating}</strong>
                </div>
              ))}
            </div>
          </>
        )}
      </section>

      {modalOpen && (
        <div className="modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setModalOpen(false); }}>
          <section className="match-modal" role="dialog" aria-modal="true" aria-labelledby="match-title">
            <div className="modal-head"><div><p>HEAD-TO-HEAD RESULT</p><h2 id="match-title">Enter a match</h2></div><button className="close-button" type="button" onClick={() => setModalOpen(false)} aria-label="Close match form">×</button></div>
            <form onSubmit={submitGame}>
              <PlayerPicker label="Winner" value={winnerId} players={directory} excludeId={loserId} onChange={setWinnerId} />
              <div className="versus"><span /> beat <span /></div>
              <PlayerPicker label="Loser" value={loserId} players={directory} excludeId={winnerId} onChange={setLoserId} />
              <button className="submit-button" type="submit" disabled={saving || !winnerId || !loserId || winnerId === loserId}>{saving ? "Updating rankings…" : "Submit match"}</button>
              <p className="modal-note">New players start at 1200. A first result carries slightly more weight.</p>
            </form>
          </section>
        </div>
      )}

      {selectedPlayer && (
        <div className="modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setSelectedPlayerId(""); }}>
          <section className="player-modal" role="dialog" aria-modal="true" aria-labelledby="player-history-title">
            <div className="player-modal-head">
              <div className="player-identity">
                <Avatar player={selectedPlayer} large />
                <div><p>PLAYER HISTORY</p><h2 id="player-history-title">{firstName(selectedPlayer.name)}</h2></div>
              </div>
              <button className="close-button" type="button" onClick={() => setSelectedPlayerId("")} aria-label="Close player history">×</button>
            </div>
            <div className="player-stats" aria-label={`${firstName(selectedPlayer.name)} statistics`}>
              <span><small>Rating</small><b>{selectedPlayer.rating}</b></span>
              <span><small>Record</small><b>{selectedPlayer.wins} - {selectedPlayer.losses}</b></span>
              <span><small>Matches</small><b>{selectedPlayerGames.length}</b></span>
            </div>
            <div className="match-history">
              <h3>Matches</h3>
              {selectedPlayerGames.length === 0 ? <p className="no-matches">No matches recorded yet.</p> : selectedPlayerGames.map((game) => {
                const won = game.winnerId === selectedPlayer.id;
                const opponent = won
                  ? { name: game.loserName, image: game.loserImage }
                  : { name: game.winnerName, image: game.winnerImage };
                const before = won ? game.winnerBefore : game.loserBefore;
                const after = won ? game.winnerAfter : game.loserAfter;
                const change = after - before;
                return (
                  <article className="history-row" key={game.id}>
                    <span className={`result-chip ${won ? "result-win" : "result-loss"}`}>{won ? "Won" : "Lost"}</span>
                    <Avatar player={opponent} />
                    <span className="history-opponent"><b>{won ? "Beat" : "Lost to"} {firstName(opponent.name)}</b><small>{formatGameDate(game.createdAt)}</small></span>
                    <span className={`rating-change ${change >= 0 ? "rating-up" : "rating-down"}`}><b>{change >= 0 ? "+" : ""}{change}</b><small>{before} → {after}</small></span>
                  </article>
                );
              })}
            </div>
          </section>
        </div>
      )}
    </main>
  );
}

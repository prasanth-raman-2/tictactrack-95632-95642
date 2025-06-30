import React, { useState, useEffect } from "react";
import "./App.css";
import "./index.css";
import { theme } from "./theme";
import Header from "./components/Header";
import Layout from "./components/Layout";
import Board from "./components/Board";
import GameInfoPanel from "./components/GameInfoPanel";
import GameHistory from "./components/GameHistory";

/**
 * Tic Tac Toe frontend: All UI state derived from backend API.
 * The frontend does NOT store any local game, AI, or move state.
 * Every interaction fetches or updates game state through backend endpoints.
 */

// Backend base URL - can be set via environment or fallback to suggested URL for Docker/local dev.
const API_BASE = process.env.REACT_APP_API_BASE || "https://vscode-internal-8858-beta.beta01.cloud.kavia.ai:3001";

// === API Helpers ===
async function apiPost(path, data) {
  const resp = await fetch(`${API_BASE}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data || {})
  });
  if (!resp.ok) {
    const text = await resp.text();
    throw new Error(`API error: ${resp.status} | ${text}`);
  }
  return await resp.json();
}

async function apiGet(path) {
  const resp = await fetch(`${API_BASE}${path}`);
  if (!resp.ok) {
    const text = await resp.text();
    throw new Error(`API error: ${resp.status} | ${text}`);
  }
  return await resp.json();
}

// GameControls: handles new game/join and mode selection
function GameControls({
  onCreate, onJoin, joinId, setJoinId, currentGameId, selectedMode, setSelectedMode
}) {
  return (
    <div style={{ marginBottom: 18, width: "100%" }}>
      <form
        onSubmit={e => {
          e.preventDefault();
          onJoin(joinId);
        }}
        style={{
          display: "flex",
          flexDirection: "row",
          gap: 8,
          marginBottom: 10,
          alignItems: "center",
        }}
        autoComplete="off"
      >
        <input
          type="text"
          placeholder="Enter Game ID"
          value={joinId}
          onChange={e => setJoinId(e.target.value)}
          style={{
            padding: "7px 8px",
            borderRadius: 6,
            border: "1px solid var(--border-color)",
            width: 110,
            fontSize: 15,
            background: "var(--bg-secondary)",
            color: "var(--text-primary)",
          }}
          aria-label="Game ID"
          autoFocus={false}
          name="join-game-id"
        />
        <button type="submit" className="ttt-newgame" style={{ minWidth: 76 }}>
          Join Game
        </button>
      </form>
      {/* Mode selection for new game */}
      <div style={{ marginBottom: 9, display: "flex", gap: 8, justifyContent: "center" }}>
        <label style={{
          display: "flex", alignItems: "center", gap: 6, fontSize: 15, cursor: "pointer"
        }}>
          <input
            type="radio"
            name="game-mode"
            value="human"
            checked={selectedMode === "human"}
            onChange={() => setSelectedMode("human")}
            style={{ accentColor: "var(--ttt-primary)" }}
          />
          Play vs Human
        </label>
        <label style={{
          display: "flex", alignItems: "center", gap: 6, fontSize: 15, cursor: "pointer"
        }}>
          <input
            type="radio"
            name="game-mode"
            value="ai"
            checked={selectedMode === "ai"}
            onChange={() => setSelectedMode("ai")}
            style={{ accentColor: "var(--ttt-accent)" }}
          />
          Play vs AI
        </label>
      </div>
      <button className="ttt-newgame" style={{ width: "100%" }} onClick={() => onCreate(selectedMode)}>
        {currentGameId ? "Start New Game" : "Create Game"}
      </button>
      {currentGameId && (
        <div style={{ marginTop: 9, fontSize: 13, color: "#999" }}>
          <span style={{ fontWeight: 600 }}>Game ID:</span>{" "}
          <span style={{ fontFamily: "monospace", letterSpacing: 0.5 }}>{currentGameId}</span>
        </div>
      )}
    </div>
  );
}

// PUBLIC_INTERFACE
function App() {
  // Theme (can be extended later)
  const [themeMode, setThemeMode] = useState("light");
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", themeMode);
  }, [themeMode]);

  // All UI/game state from backend
  const [gameId, setGameId] = useState(null);
  const [joinGameIdInput, setJoinGameIdInput] = useState("");
  const [gameState, setGameState] = useState(null); // latest board state response object
  const [history, setHistory] = useState([]); // current game moves, as fetched from backend
  const [gameList, setGameList] = useState([]); // history of games
  const [error, setError] = useState(null);
  const [selectedMode, setSelectedMode] = useState("human"); // game mode for new game

  // Poll current game state if there is a gameId
  useEffect(() => {
    if (!gameId) {
      setGameState(null);
      setHistory([]);
      return;
    }
    let interval = null;
    // Initial fetch
    fetchGameState(gameId);
    // Polling for game state (real-time updates)
    interval = setInterval(() => {
      fetchGameState(gameId, { silent: true });
    }, 1500);
    return () => interval && clearInterval(interval);
    // eslint-disable-next-line
  }, [gameId]);

  // Load global/all-game history on mount + whenever a game completes/starts
  useEffect(() => {
    fetchHistory();
  }, []);

  // --- API: Create new game ---
  // PUBLIC_INTERFACE
  async function newGame(mode) {
    setError(null);
    try {
      const resp = await apiPost("/game/start", {
        mode: mode === "ai" ? "ai" : "human"
      });
      setGameId(resp.game_id || null);
      setJoinGameIdInput("");
      // Fetch state for new game
      setTimeout(() => resp.game_id && fetchGameState(resp.game_id), 100);
      fetchHistory(); // refresh overall game list
    } catch (e) {
      setError("Unable to start new game");
    }
  }

  // --- API: Join game by ID ---
  // PUBLIC_INTERFACE
  async function joinGame(gameIdToJoin) {
    setError(null);
    if (!gameIdToJoin) {
      setError("Please enter a game ID.");
      return;
    }
    try {
      const stateResp = await fetchGameState(gameIdToJoin);
      setGameId(gameIdToJoin);
      setJoinGameIdInput("");
      fetchHistory();
    } catch (e) {
      setError("Unable to join game. Check Game ID.");
    }
  }

  // --- API: Make a move ---
  // PUBLIC_INTERFACE
  async function handleMove(idx) {
    setError(null);
    if (!gameId || !gameState || gameState.squares?.[idx]) return;
    if (gameState.winner || gameState.draw) return;
    try {
      await apiPost("/game/move", {
        game_id: gameId,
        move: idx
      });
      await fetchGameState(gameId);
      fetchHistory();
    } catch (e) {
      setError("Unable to make move");
    }
  }

  // --- API: Get full state of game and move history ---
  // Keeps gameState and history in sync from backend
  // PUBLIC_INTERFACE
  async function fetchGameState(gameIdToFetch, opts = {}) {
    try {
      // Main board state (may include info such as squares, winner, draw, etc.)
      const stateResp = await apiGet(`/game/state?game_id=${gameIdToFetch}`);
      setGameState(stateResp);
      // Try to fetch move history for this game
      // It's assumed a /game/history or /game/moves endpoint exists, or similar (if your backend supports it)
      // If not, skip this gracefully
      try {
        const movesResp = await apiGet(`/game/moves?game_id=${gameIdToFetch}`);
        // Expects: [{desc, squares}]
        setHistory(
          Array.isArray(movesResp.moves)
            ? movesResp.moves.map((m, i) => ({
                ...m,
                desc: m.desc || `Move #${i + 1}`,
                idx: i
              }))
            : []
        );
      } catch (err) {
        setHistory([]);
      }
      return stateResp;
    } catch (e) {
      if (!opts.silent) setError("Unable to fetch game state");
    }
    return null;
  }

  // --- API: Jump to move (historical move rendering using backend-provided moves) ---
  // Since frontend does NOT implement local board logic, this triggers display of a prior move's board state
  // PUBLIC_INTERFACE
  function handleJump(moveIdx) {
    // If history available, display the squares for this move (NO local winner logic)
    if (!history || moveIdx < 0 || moveIdx >= history.length) return;
    setGameState(gs => ({
      ...(gs || {}),
      squares: history[moveIdx].squares
    }));
  }

  // --- API: Fetch game list (all games) ---
  // PUBLIC_INTERFACE
  async function fetchHistory() {
    setError(null);
    // Global game history (past games)
    try {
      const resp = await apiGet("/history/");
      setGameList(resp.history || []);
    } catch (e) {
      setGameList([]);
      setError("Unable to fetch history");
    }
  }

  // === Render ===
  const squares = gameState?.squares ?? Array(9).fill("");
  const winningLine = gameState?.winning_line || null;
  const winner = gameState?.winner || null;
  const draw = !!gameState?.draw;
  const current = gameState?.current || "X";
  // Player info is omitted by backend for simplicity (can extend to fetch names/IDs)
  const playerX = "X", playerO = "O";

  // History for the current session (moves)
  const moveHistory =
    Array.isArray(history) && history.length > 0
      ? history
      : [{ desc: "Game start", squares }];

  return (
    <div className="App" style={{ background: theme.colors.secondary, color: theme.colors.text }}>
      <Header />
      <Layout>
        {error && <div style={{ color: theme.colors.error, marginBottom: 12 }}>{error}</div>}
        {/* Game Controls */}
        <GameControls
          onCreate={newGame}
          onJoin={joinGame}
          joinId={joinGameIdInput}
          setJoinId={setJoinGameIdInput}
          currentGameId={gameId}
          selectedMode={selectedMode}
          setSelectedMode={setSelectedMode}
        />
        <main className="ttt-main">
          <section className="ttt-main-left">
            <Board squares={squares} onMove={handleMove} winningLine={winningLine} />
          </section>
          <aside className="ttt-main-right">
            <GameInfoPanel
              playerX={playerX}
              playerO={playerO}
              current={current}
              winner={winner}
              draw={draw}
            />
          </aside>
        </main>
        <GameHistory history={moveHistory} onJump={handleJump} currentMove={moveHistory.length - 1} />
        <div style={{ marginTop: 24 }}>
          <div className="ttt-history-title" style={{ fontWeight: 700 }}>Game History (All)</div>
          {Array.isArray(gameList) && gameList.length > 0 ? (
            <ul style={{ paddingLeft: 18, textAlign: "left" }}>
              {gameList.map((g, i) => (
                <li key={i}>
                  {g.date ? `${g.date}: ` : ""}
                  {g.result ? `${g.result}` : ""}
                </li>
              ))}
            </ul>
          ) : (
            <div style={{ color: "#888" }}>No past games yet.</div>
          )}
        </div>
      </Layout>
    </div>
  );
}

export default App;

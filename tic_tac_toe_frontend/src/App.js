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

/**
 * Backend base URL - can be set via environment or fallback to suggested URL for Docker/local dev.
 * All board/game state is derived from backend endpoint responses.
 */
const API_BASE = process.env.REACT_APP_API_BASE || "https://vscode-internal-8858-beta.beta01.cloud.kavia.ai:3001";

// === API Helpers ===
async function apiPost(path, data) {
  const resp = await fetch(`${API_BASE}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data || {}),
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

/**
 * GameControls: handles new game/join and mode selection
 * Now includes fields for playerName as required by the backend API
 */
function GameControls({
  onCreate, onJoin, joinId, setJoinId, currentGameId, selectedMode, setSelectedMode, playerName, setPlayerName, joinName, setJoinName
}) {
  return (
    <div style={{ marginBottom: 18, width: "100%" }}>
      {/* Join Section */}
      <form
        onSubmit={e => {
          e.preventDefault();
          onJoin(joinId, joinName);
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
        <input
          type="text"
          placeholder="Your Name"
          value={joinName}
          onChange={e => setJoinName(e.target.value)}
          style={{
            padding: "7px 8px",
            borderRadius: 6,
            border: "1px solid var(--border-color)",
            width: 110,
            fontSize: 15,
            background: "var(--bg-secondary)",
            color: "var(--text-primary)",
          }}
          aria-label="Player Name for Joining"
          name="join-player-name"
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
      {/* Player name for new game */}
      <input
        type="text"
        placeholder="Your Name"
        value={playerName}
        onChange={e => setPlayerName(e.target.value)}
        style={{
          padding: "7px 8px",
          borderRadius: 6,
          border: "1px solid var(--border-color)",
          width: "100%",
          fontSize: 15,
          background: "var(--bg-secondary)",
          color: "var(--text-primary)",
          marginBottom: 7
        }}
        aria-label="Player Name"
        name="create-player-name"
      />
      <button className="ttt-newgame" style={{ width: "100%" }} onClick={() => onCreate(selectedMode, playerName)}>
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
  // Theme setup
  const [themeMode, setThemeMode] = useState("light");
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", themeMode);
  }, [themeMode]);

  // State variables
  const [gameId, setGameId] = useState(null);
  const [joinGameIdInput, setJoinGameIdInput] = useState("");
  const [joinName, setJoinName] = useState(""); // Name for joining a game
  const [playerName, setPlayerName] = useState(""); // Name for creating a game
  const [playerSymbol, setPlayerSymbol] = useState(""); // "X"/"O"
  const [gameState, setGameState] = useState(null); // Backend board state
  const [history, setHistory] = useState([]); // Game move history from backend
  const [gameList, setGameList] = useState([]); // All games for current player
  const [error, setError] = useState(null);
  const [selectedMode, setSelectedMode] = useState("human"); // ai/human

  // Poll for current game state if there is a gameId
  useEffect(() => {
    if (!gameId) {
      setGameState(null);
      setHistory([]);
      setPlayerSymbol("");
      return;
    }
    let interval = null;
    // Initial fetch
    fetchGameState(gameId);
    interval = setInterval(() => {
      fetchGameState(gameId, { silent: true });
    }, 1500);
    return () => interval && clearInterval(interval);
    // eslint-disable-next-line
  }, [gameId]);

  useEffect(() => {
    // Fetch all games for the player; for MVP omit games_by_player and just get global for demo
    fetchHistory();
    // eslint-disable-next-line
  }, []);

  // --- API: Create new game ---
  // PUBLIC_INTERFACE
  async function newGame(mode, playerNameInput) {
    setError(null);
    if (!playerNameInput) {
      setError("Please enter your name to create a game.");
      return;
    }
    try {
      const resp = await apiPost("/game/start", {
        "mode": mode,
        "player_name": playerNameInput.trim()
      });
      setGameId(resp.game_id || null);
      setPlayerSymbol("X"); // game starter is always X
      setJoinGameIdInput("");
      setJoinName("");
      // Get current game state and history after a moment for backend to update
      setTimeout(() => resp.game_id && fetchGameState(resp.game_id), 140);
      fetchHistory();
    } catch (e) {
      setError("Unable to start new game");
    }
  }

  // --- API: Join game by ID ---
  // PUBLIC_INTERFACE
  async function joinGame(gameIdToJoin, joinNameInput) {
    setError(null);
    if (!gameIdToJoin || !joinNameInput) {
      setError("Enter both Game ID and your name to join.");
      return;
    }
    try {
      const resp = await apiPost("/game/join", {
        game_id: gameIdToJoin.trim(),
        player_name: joinNameInput.trim()
      });
      setGameId(resp.game_id);
      // Determine player symbol ("O" if joined)
      let youAreO = !!resp.players && Object.entries(resp.players).some(([sym, val]) => sym === "O" && val === joinNameInput.trim());
      setPlayerSymbol(youAreO ? "O" : "X");
      setPlayerName(joinNameInput.trim()); // for consistency
      setJoinGameIdInput("");
      setJoinName("");
      setGameState({
        // backend gives: board, next_turn, players, mode, game_id
        ...resp
      });
      fetchHistory();
    } catch (e) {
      setError("Unable to join game. Check Game ID and Name.");
    }
  }

  // --- API: Make a move ---
  // PUBLIC_INTERFACE
  async function handleMove(idx) {
    setError(null);
    if (typeof idx !== "number" || idx < 0 || idx > 8) return;
    if (!gameId || !gameState || !playerSymbol) { setError("No game, or your symbol missing."); return; }
    let row = Math.floor(idx / 3), col = idx % 3;
    if (Array.isArray(gameState.board) &&
      Array.isArray(gameState.board[row]) &&
      !!gameState.board[row][col]) return;
    if (gameState.winner || gameState.draw) return;
    try {
      // Move through backend only.
      const resp = await apiPost("/game/move", {
        game_id: gameId,
        player: playerSymbol,
        row,
        col,
      });
      // Always fetch up-to-date state from backend after making a move
      await fetchGameState(gameId); // refreshes UI by polling backend
      fetchHistory();
    } catch (e) {
      // Try to parse backend error
      let detail = "";
      try {
        // e.message might be "API error: 400 | {\"detail\":\"Not your turn.\"}"
        if (e.message && e.message.includes("{")) {
          const errBody = e.message.substring(e.message.indexOf("|") + 1).trim();
          const parsed = JSON.parse(errBody);
          detail = parsed.detail || "";
        }
      } catch (_) { /* ignore */ }
      setError("Unable to make move: " + (detail || e.message || ""));
      // ALWAYS force refresh after error (may have lost sync with backend state)
      await fetchGameState(gameId);
    }
  }

  // --- Fetch game board and status ---
  // PUBLIC_INTERFACE
  async function fetchGameState(gameIdToFetch, opts = {}) {
    try {
      // We derive state from last move history or the join/create response; move result has up-to-date info too
      // If fetching moveHistory, derive current board from last item, else fall back to game create/join/last result
      await fetchMoveHistory(gameIdToFetch); // this sets board via history automatically
      // we do NOT separately fetch state, as backend always includes board/winner/turn/draw in latest move result or history
    } catch (e) {
      if (!opts.silent) setError("Unable to fetch game state");
    }
    return null;
  }

  // --- API: Get full move history for current game ---
  // PUBLIC_INTERFACE
  async function fetchMoveHistory(gameIdToFetch) {
    try {
      // GET /history/by_game?game_id=...
      const movesResp = await apiGet(`/history/by_game?game_id=${gameIdToFetch}`);
      // Each item in move_history should provide row, col, player, board, winner, draw etc.
      // Current state's board = last move or initial (empty)
      let moveHist = Array.isArray(movesResp.move_history) ? movesResp.move_history : [];
      setHistory(moveHist.map((m, i) => ({
        ...m,
        desc: `Move #${i + 1}: ${m.player} to (${m.row},${m.col})`
      })));
      const last = moveHist.length > 0 ? moveHist[moveHist.length - 1] : null;
      if (last) {
        setGameState({
          ...last
        });
      } else {
        // fallback: fetch minimal info
        setGameState(gs => ({
          ...gs,
          board: [
            ["", "", ""],
            ["", "", ""],
            ["", "", ""],
          ],
          winner: null,
          draw: false,
          next_turn: "X",
        }));
      }
    } catch (e) {
      setHistory([]);
      setGameState(gs => ({
        ...gs,
        board: [
          ["", "", ""],
          ["", "", ""],
          ["", "", ""],
        ],
        winner: null,
        draw: false,
        next_turn: "X",
      }));
    }
  }

  // --- API: Jump to move (historical move rendering) ---
  // PUBLIC_INTERFACE
  function handleJump(moveIdx) {
    if (!history || moveIdx < 0 || moveIdx >= history.length) return;
    const move = history[moveIdx];
    setGameState({
      ...move
    });
  }

  // --- Fetch all game list (for MVP show all, not per player) ---
  // PUBLIC_INTERFACE
  async function fetchHistory() {
    setError(null);
    try {
      // For demo: list all games. For real, would use /history/games_by_player?player=...
      // We'll call /history/games_by_player if playerName set, else skip
      if (playerName) {
        const resp = await apiGet(`/history/games_by_player?player=${encodeURIComponent(playerName)}`);
        setGameList(resp.games || []);
      } else {
        // fallback: omit listing if unknown who the user is
        setGameList([]);
      }
    } catch (e) {
      setGameList([]);
      setError("Unable to fetch game history");
    }
  }

  // === Render mapping for board ===
  // Backend provides board as 2D array (3x3).
  const squaresFlat = Array.isArray(gameState?.board)
    ? gameState.board.flat().map(x => x || "")
    : Array(9).fill("");
  const winner = gameState?.winner || null;
  const draw = !!gameState?.draw;
  const current = gameState?.next_turn || "X";
  // Show player names if available in backend state
  const playerX = (gameState?.players && gameState?.players["X"]) || "X";
  const playerO = (gameState?.players && gameState?.players["O"]) || "O";

  // === Determine if it is truly user's turn (based ON BACKEND STATE!) ===
  const isPlayersTurn = (
    // We can only decide if we know both the player's symbol and current turn
    !!playerSymbol && !winner && !draw && current === playerSymbol &&
    (
      // For multiplayer: check name matches symbol in backend, if possible
      !gameState?.players ||
      (playerSymbol === "X"
        ? playerX === playerName
        : playerO === playerName)
    )
  );

  // History for UI GameHistory component
  const moveHistory =
    Array.isArray(history) && history.length > 0
      ? history
      : [{ desc: "Game start", squares: squaresFlat }];

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
          playerName={playerName}
          setPlayerName={setPlayerName}
          joinName={joinName}
          setJoinName={setJoinName}
        />
        <main className="ttt-main">
          <section className="ttt-main-left">
            <Board
              squares={squaresFlat}
              onMove={isPlayersTurn ? handleMove : null}
              winningLine={null}
              isPlayersTurn={isPlayersTurn}
              current={current}
              playerSymbol={playerSymbol}
              gameState={gameState}
            />
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
          <div className="ttt-history-title" style={{ fontWeight: 700 }}>Game History (Your Games)</div>
          {Array.isArray(gameList) && gameList.length > 0 ? (
            <ul style={{ paddingLeft: 18, textAlign: "left" }}>
              {gameList.map((g, i) => (
                <li key={i}>
                  {g.game_id ? <span style={{ fontFamily: "monospace" }}>{g.game_id}</span> : ""}
                  {g.result ? `: ${g.result}` : ""}
                  {/* optionally show mode */}
                  {g.mode ? ` [${g.mode}]` : ""}
                </li>
              ))}
            </ul>
          ) : (
            <div style={{ color: "#888" }}>No games yet.</div>
          )}
        </div>
      </Layout>
    </div>
  );
}

export default App;

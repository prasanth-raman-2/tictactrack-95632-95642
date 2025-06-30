import React, { useState, useEffect } from 'react';
import './App.css';
import './index.css';
import { theme } from './theme';
import Header from './components/Header';
import Layout from './components/Layout';
import Board from './components/Board';
import GameInfoPanel from './components/GameInfoPanel';
import GameHistory from './components/GameHistory';

/**
 * Tic Tac Toe frontend: Connects to FastAPI backend via RESTful API for gameplay, state, and history.
 * Robust error handling and API config included.
 */

// Backend base URL - can be set via environment or fallback to suggested URL for Docker/local dev.
const API_BASE = process.env.REACT_APP_API_BASE || "https://vscode-internal-8858-beta.beta01.cloud.kavia.ai:3001";

// === API Helpers ===
async function apiPost(path, data) {
  const resp = await fetch(`${API_BASE}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data || {}),
  });
  if (!resp.ok) {
    throw new Error(`API error: ${resp.status}`);
  }
  return await resp.json();
}

async function apiGet(path) {
  const resp = await fetch(`${API_BASE}${path}`);
  if (!resp.ok) {
    throw new Error(`API error: ${resp.status}`);
  }
  return await resp.json();
}

// PUBLIC_INTERFACE
function App() {
  // === Theme handling (light only per spec, allow future toggle) ===
  const [themeMode, setThemeMode] = useState('light');
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', themeMode);
  }, [themeMode]);
  // --- End theme

  // === Game state ===
  const [squares, setSquares] = useState(Array(9).fill(""));
  const [playerX, setPlayerX] = useState(""); // Future: support for real player info
  const [playerO, setPlayerO] = useState("");
  const [current, setCurrent] = useState("X");
  const [winner, setWinner] = useState(null);
  const [draw, setDraw] = useState(false);
  const [winningLine, setWinningLine] = useState(null);
  const [moveDesc, setMoveDesc] = useState([]);
  const [step, setStep] = useState(0);
  const [gameHistory, setGameHistory] = useState([]);
  const [error, setError] = useState(null);
  const [gameId, setGameId] = useState(null);

  // --- API: fetch latest game state ---
  async function fetchGameState(id) {
    try {
      const stateResp = await apiGet(`/game/state?game_id=${id}`);
      setSquares(stateResp.squares || Array(9).fill(""));
      setCurrent(stateResp.current || "X");
      setWinner(stateResp.winner || null);
      setDraw(stateResp.draw || false);
      setWinningLine(stateResp.winning_line || null);
    } catch (e) {
      setError("Unable to update board from backend");
    }
  }

  // --- API: Start a new game ---
  // PUBLIC_INTERFACE
  async function newGame() {
    setError(null);
    try {
      const resp = await apiPost("/game/start", {}); // Optionally add players
      setGameId(resp.game_id || null);
      setStep(0);
      setMoveDesc([{ desc: "Game start", squares: resp.squares || Array(9).fill("") }]);
      if (resp.game_id) {
        await fetchGameState(resp.game_id);
      } else {
        setSquares(resp.squares || Array(9).fill(""));
        setCurrent(resp.current || "X");
        setWinner(resp.winner || null);
        setDraw(resp.draw || false);
        setWinningLine(resp.winning_line || null);
      }
      fetchHistory();
    } catch (e) {
      setError("Unable to start new game");
    }
  }

  // --- API: Make a move and always fetch board latest from backend ---
  // PUBLIC_INTERFACE
  async function handleMove(idx) {
    setError(null);
    if (winner || draw || squares[idx] !== "") return;
    try {
      const body = {
        game_id: gameId,
        move: idx,
        player: current,
      };
      await apiPost("/game/move", body);
      // Always re-fetch real board state from backend!
      await fetchGameState(gameId);
      setStep(s => s + 1);
      setMoveDesc(moves =>
        moves.concat([
          {
            desc: `Move #${step + 1}: ${current} to (${1 + (idx % 3)}, ${1 + Math.floor(idx / 3)})`,
            squares: [...squares.slice(0, idx), current, ...squares.slice(idx + 1)],
          },
        ])
      );
      fetchHistory();
    } catch (e) {
      setError("Unable to make move");
    }
  }

  // --- API: Go to move in history (only current session, local stack) ---
  // PUBLIC_INTERFACE
  function handleJump(moveIdx) {
    setStep(moveIdx);
    const move = moveDesc[moveIdx] || { squares: Array(9).fill("") };
    setSquares(move.squares);
    // Winner/draw detection from move or API could be fancier
  }

  // --- API: Game history ---
  // PUBLIC_INTERFACE
  async function fetchHistory() {
    setError(null);
    try {
      const resp = await apiGet("/history/");
      setGameHistory(resp.history || []);
    } catch (e) {
      setGameHistory([]);
      setError("Unable to fetch history");
    }
  }

  // --- Fetch history on load ---
  useEffect(() => {
    fetchHistory();
  }, []);

  // --- Auto-start a game on initial load ---
  useEffect(() => {
    newGame();
    // eslint-disable-next-line
  }, []);

  // === Render ===
  return (
    <div className="App" style={{ background: theme.colors.secondary, color: theme.colors.text }}>
      <Header />
      <Layout>
        {error && <div style={{ color: theme.colors.error, marginBottom: 12 }}>{error}</div>}
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
            <button className="ttt-newgame" onClick={newGame}>New Game</button>
          </aside>
        </main>
        <GameHistory
          history={moveDesc.length > 1 ? moveDesc : [{ desc: "Game start", squares }]}
          onJump={handleJump}
          currentMove={step}
        />
        <div style={{ marginTop: 24 }}>
          <div className="ttt-history-title" style={{ fontWeight: 700 }}>Game History (All)</div>
          {Array.isArray(gameHistory) && gameHistory.length > 0 ? (
            <ul style={{ paddingLeft: 18, textAlign: "left" }}>
              {gameHistory.map((g, i) => (
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

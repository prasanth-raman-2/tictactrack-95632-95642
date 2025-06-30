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
 * Modern, minimalistic Tic Tac Toe app with theme support and component layout.
 * Integrates Board, InfoPanel, and History per requirements.
 */

// Helper to check winner (for local demo/logic stub)
const LINES = [
  [0,1,2],[3,4,5],[6,7,8],
  [0,3,6],[1,4,7],[2,5,8],
  [0,4,8],[2,4,6]
];
function calculateWinner(squares) {
  for (let line of LINES) {
    const [a,b,c] = line;
    if (squares[a] && squares[a]===squares[b] && squares[a]===squares[c]) {
      return {player: squares[a], line};
    }
  }
  if (squares.every(Boolean)) return {player: null, line: null, draw: true};
  return null;
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
  const [playerX, setPlayerX] = useState(""); // for registration, not yet implemented
  const [playerO, setPlayerO] = useState("");
  const [history, setHistory] = useState([
    { squares: Array(9).fill(""), desc: "Game start" }
  ]);
  const [step, setStep] = useState(0);
  const current = step % 2 === 0 ? "X" : "O";
  const squares = history[step].squares;
  const result = calculateWinner(squares);
  const winner = result?.player;
  const draw = result?.draw;
  const winningLine = result?.line;

  // === Move handler ===
  // PUBLIC_INTERFACE
  function handleMove(idx) {
    if (squares[idx] || winner || draw) return;
    const next = squares.slice();
    next[idx] = current;
    setHistory(h =>
      h.slice(0, step + 1).concat([{
        squares: next,
        desc: `Move #${step + 1}: ${current} to (${1 + (idx % 3)}, ${1 + Math.floor(idx/3)})`
      }])
    );
    setStep(step + 1);
  }

  // PUBLIC_INTERFACE
  function handleJump(move) {
    setStep(move);
  }

  // PUBLIC_INTERFACE
  function newGame() {
    setHistory([{ squares: Array(9).fill(""), desc: "Game start" }]);
    setStep(0);
  }

  // === Render ===
  return (
    <div className="App" style={{ background: theme.colors.secondary, color: theme.colors.text }}>
      <Header />
      <Layout>
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
          history={history}
          onJump={handleJump}
          currentMove={step}
        />
      </Layout>
    </div>
  );
}

export default App;

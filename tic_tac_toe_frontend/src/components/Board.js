import React from "react";

// PUBLIC_INTERFACE
export default function Board({ squares, onMove, winningLine }) {
  /**
   * The tic-tac-toe board. Squares is an array of 9 ("" | "X" | "O").
   * onMove(idx) is called when empty square idx is clicked.
   * winningLine: optional [indices...] for highlight
   */
  function renderSquare(i) {
    const highlight = winningLine && winningLine.includes(i);
    return (
      <button
        className={`ttt-square${highlight ? " ttt-win" : ""}`}
        key={i}
        onClick={() => onMove(i)}
        disabled={Boolean(squares[i])}
        aria-label={`Board square ${i + 1}: ${squares[i] || 'empty'}`}
      >
        {squares[i]}
      </button>
    );
  }
  return (
    <div className="ttt-board">
      {[0, 1, 2].map(row =>
        <div key={row} className="ttt-board-row">
          {[0, 1, 2].map(col => renderSquare(row * 3 + col))}
        </div>
      )}
    </div>
  );
}

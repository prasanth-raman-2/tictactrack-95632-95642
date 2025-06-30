import React from "react";

// PUBLIC_INTERFACE
export default function GameHistory({ history, onJump, currentMove }) {
  /**
   * Game history: renders list of moves (array of {squares, desc}), jump to move.
   * onJump(moveIdx) moves user to that point in history.
   */
  return (
    <div className="ttt-history">
      <div className="ttt-history-title">History</div>
      <ol className="ttt-history-list">
        {history.map((move, idx) => (
          <li key={idx}>
            <button
              className={`ttt-history-btn${idx === currentMove ? " ttt-history-btn-current" : ""}`}
              onClick={() => onJump(idx)}
              disabled={idx === currentMove}
            >
              {move.desc || `Move #${idx}`}
            </button>
          </li>
        ))}
      </ol>
    </div>
  );
}

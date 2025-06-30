import React from "react";

/**
 * Board renders the tic-tac-toe board, squares is ["", "X", ...].
 * Only allows click/moves if all:
 *   - No winner
 *   - That square is empty
 *   - onMove is provided (which is ONLY when it's really your turn, enforced by App)
 */
/**
 * PUBLIC_INTERFACE
 * Board component renders the tic-tac-toe board using the current backend state (squares).
 * The moveRefreshTick prop is supplied for guaranteed re-rendering after moves.
 */
export default function Board({
  squares,
  onMove,
  winningLine,
  isPlayersTurn = true,
  current,
  playerSymbol,
  gameState,
  moveRefreshTick, // Used to force rerender on move (value is ignored)
}) {
  function renderSquare(i) {
    const highlight = winningLine && winningLine.includes(i);
    const squareTaken = Boolean(squares[i]);
    // Only clickable/active if it's player's turn, onMove is available, and square is empty, no winner/draw
    const isDisabled = (
      !onMove ||
      squareTaken ||
      (gameState && (gameState.winner || gameState.draw))
    );
    return (
      <button
        className={`ttt-square${highlight ? " ttt-win" : ""}`}
        key={i}
        onClick={() => { if (!isDisabled && onMove) onMove(i); }}
        disabled={isDisabled}
        aria-label={`Board square ${i + 1}: ${squares[i] || 'empty'}`}
        style={!isDisabled && onMove ? { cursor: "pointer" } : undefined}
        title={isDisabled
          ? (!onMove ? "Not your turn" : squareTaken ? "Already played" : "Game ended")
          : "Click to move"
        }
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

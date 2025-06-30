import React from "react";

// PUBLIC_INTERFACE
export default function GameInfoPanel({ playerX, playerO, current, winner, draw }) {
  /**
   * Game info: shows player names, current turn, winner, draw.
   */
  let status = "";
  if (winner) {
    status = (winner === "draw")
      ? "Draw!"
      : `Winner: ${winner === "X" ? playerX || "X" : playerO || "O"}`;
  } else if (draw) {
    status = "Draw!";
  } else {
    status = `Turn: ${current === "X" ? playerX || "X" : playerO || "O"} (${current})`;
  }
  return (
    <aside className="ttt-info-panel">
      <div className="ttt-info-title">Game Info</div>
      <div className="ttt-info-status">{status}</div>
      <div className="ttt-info-players">
        <span>X: {playerX || "?"}</span><br/>
        <span>O: {playerO || "?"}</span>
      </div>
    </aside>
  );
}

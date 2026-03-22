import { useEffect, useRef, useState } from "react";
import { getSocket, getSession } from "../nakama";
import { MatchData, GameState } from "../App";

const OpCode = { MOVE: 1, STATE: 2 };

export default function Game({
  matchData,
  gameState,
  onGameEnd,
}: {
  matchData: MatchData;
  gameState: GameState | null;
  onGameEnd: () => void;
}) {
  const [timeLeft, setTimeLeft] = useState(30);
  const timerRef = useRef<any>(null);
  const session = getSession();
  const socket = getSocket();
  const myUserId = session?.user_id ?? "";

  useEffect(() => {
    if (!gameState) return;
    if (timerRef.current) clearInterval(timerRef.current);
    if (!gameState.gameOver && gameState.turnDeadline > 0) {
      timerRef.current = setInterval(() => {
        const left = Math.max(0, Math.ceil((gameState.turnDeadline - Date.now()) / 1000));
        setTimeLeft(left);
      }, 500);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [gameState]);

  async function sendMove(position: number) {
    if (!socket || !gameState) return;
    if (gameState.turn !== myUserId) return;
    if (gameState.board[position] !== "") return;
    if (gameState.gameOver) return;

    const data = new TextEncoder().encode(JSON.stringify({ position }));
    await socket.sendMatchState(matchData.matchId, OpCode.MOVE, data);
  }

  function getWinnerText() {
    if (!gameState?.winner) return "";
    if (gameState.winner === "draw") return "It's a draw!";
    if (gameState.winner === myUserId) return "You win! 🎉";
    return "You lose!";
  }

  const myMark = gameState?.marks?.[myUserId] ?? "?";
  const isMyTurn = gameState?.turn === myUserId;

  return (
    <div className="card">
      <div className="game-header">
        <span>You: <strong>{myMark}</strong></span>
        {!gameState?.gameOver && (
          <span className={isMyTurn ? "turn-active" : ""}>
            {isMyTurn ? `Your turn (${timeLeft}s)` : "Opponent's turn"}
          </span>
        )}
      </div>

      <div className="board">
        {(gameState?.board ?? Array(9).fill("")).map((cell: string, i: number) => (
          <button
            key={i}
            className={`cell ${cell === "X" ? "x" : cell === "O" ? "o" : ""}`}
            onClick={() => sendMove(i)}
            disabled={!isMyTurn || !!cell || !!gameState?.gameOver}
          >
            {cell}
          </button>
        ))}
      </div>

      {gameState?.gameOver && (
        <div className="game-over">
          <h2>{getWinnerText()}</h2>
          <button onClick={onGameEnd}>Play Again</button>
        </div>
      )}
    </div>
  );
}
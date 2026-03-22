import { useState } from "react";
import { authenticate, getSocket, getSession } from "./nakama";
import Game from "./components/Game";
import "./App.css";

type Screen = "login" | "matchmaking" | "game";

export interface MatchData {
  matchId: string;
}

export interface GameState {
  board: string[];
  turn: string;
  marks: { [userId: string]: string };
  winner: string | null;
  gameOver: boolean;
  turnDeadline: number;
}

export default function App() {
  const [screen, setScreen] = useState<Screen>("login");
  const [nickname, setNickname] = useState("");
  const [status, setStatus] = useState("");
  const [matchData, setMatchData] = useState<MatchData | null>(null);
  const [gameState, setGameState] = useState<GameState | null>(null);

  async function handleLogin() {
    if (!nickname.trim()) return;
    try {
      setStatus("Connecting...");
      await authenticate(nickname.trim());
      setScreen("matchmaking");
      setStatus("");
    } catch (e) {
      setStatus("Connection failed. Is Nakama running?");
    }
  }

  async function handleFindGame() {
    const socket = getSocket();
    const session = getSession();
    if (!socket || !session) return;

    setStatus("Finding a player...");

    socket.onmatchdata = (data) => {
      console.log("Match data op_code:", data.op_code);
      if (data.op_code === 2) {
        try {
          const decoded = new TextDecoder().decode(data.data);
          console.log("Game state:", decoded);
          const state: GameState = JSON.parse(decoded);
          setGameState(state);
        } catch (e) {
          console.error("Parse error:", e);
        }
      }
    };

    socket.onmatchmakermatched = async (matched) => {
      try {
        const match = await socket.joinMatch(
          matched.match_id ?? "",
          matched.token ?? ""
        );
        console.log("Joined match:", match.match_id);

        setMatchData({ matchId: match.match_id });
        setScreen("game");
        setStatus("");

        // Request state after short delay in case broadcast was missed
        setTimeout(async () => {
          try {
            const data = new TextEncoder().encode(JSON.stringify({ type: "request_state" }));
            await socket.sendMatchState(match.match_id, 99, data);
            console.log("Requested state");
          } catch (e) {
            console.log("State request error:", e);
          }
        }, 1000);

      } catch (e) {
        setStatus("Failed to join match: " + e);
      }
    };

    await socket.addMatchmaker("*", 2, 2);
  }

  function handleGameEnd() {
    setMatchData(null);
    setGameState(null);
    setScreen("matchmaking");
  }

  if (screen === "login") {
    return (
      <div className="container">
        <h1>Tic Tac Toe</h1>
        <div className="card">
          <h2>Who are you?</h2>
          <input
            type="text"
            placeholder="Nickname"
            value={nickname}
            onChange={e => setNickname(e.target.value)}
            onKeyDown={e => e.key === "Enter" && handleLogin()}
          />
          <button onClick={handleLogin}>Continue</button>
          {status && <p className="status">{status}</p>}
        </div>
      </div>
    );
  }

  if (screen === "matchmaking") {
    return (
      <div className="container">
        <h1>Tic Tac Toe</h1>
        <div className="card">
          <button onClick={handleFindGame}>Find Game</button>
          {status && <p className="status">{status}</p>}
        </div>
      </div>
    );
  }

  return (
    <div className="container">
      <Game
        matchData={matchData!}
        gameState={gameState}
        onGameEnd={handleGameEnd}
      />
    </div>
  );
}
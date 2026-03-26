import { Client, Session, Socket } from "@heroiclabs/nakama-js";

const host = import.meta.env.VITE_NAKAMA_HOST || "lila-tictactoe-production.up.railway.app";
const port = import.meta.env.VITE_NAKAMA_PORT || "7350";
const useSSL = import.meta.env.VITE_NAKAMA_SSL === "true";

export const client = new Client(
  "defaultkey",
  "lila-tictactoe-production.up.railway.app",
  "443",
  true
);

let session: Session | null = null;
let socket: Socket | null = null;

export function getSession() { return session; }
export function getSocket() { return socket; }

export async function authenticate(nickname: string): Promise<Session> {
  const deviceId = localStorage.getItem("deviceId") || crypto.randomUUID();
  localStorage.setItem("deviceId", deviceId);

  session = await client.authenticateDevice(deviceId, true, nickname);
  localStorage.setItem("session", JSON.stringify(session));

  socket = client.createSocket(useSSL, false);
  await socket.connect(session, true);

  return session;
}

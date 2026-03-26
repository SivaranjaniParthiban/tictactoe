import { Client, Session, Socket } from "@heroiclabs/nakama-js";

const host = import.meta.env.VITE_NAKAMA_HOST;
const port = import.meta.env.VITE_NAKAMA_PORT;
const useSSL = import.meta.env.VITE_NAKAMA_SSL === "true";

export const client = new Client("defaultkey", host, port, useSSL);
```

Also make sure you **re-deployed to Vercel** after the change — Vite bakes env vars at build time, so a code change alone isn't enough if the env vars weren't set in Vercel's dashboard too.

Go to **Vercel → lila-tictactoe → Settings → Environment Variables** and add:
```
VITE_NAKAMA_HOST = lila-tictactoe-production.up.railway.app
VITE_NAKAMA_PORT = 443
VITE_NAKAMA_SSL  = true

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

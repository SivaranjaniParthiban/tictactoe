# 🎮 Lila Tic Tac Toe

A real-time multiplayer Tic Tac Toe game built with a modern full-stack setup using **React (TypeScript)** and **Nakama game server**.

---

## 🚀 Features

* 👥 Real-time multiplayer gameplay
* 🔌 WebSocket-based communication via Nakama
* 🎯 Matchmaking system
* 🧠 Turn-based game logic
* 🌐 Deployed frontend (Vercel) + backend (Railway)

---

## 🛠️ Tech Stack

**Frontend**

* React + TypeScript
* Vite
* CSS

**Backend**

* Nakama (Game Server)
* PostgreSQL (Railway)

**Deployment**

* Vercel (Frontend)
* Railway (Backend + DB)

---

## ⚙️ How It Works

1. User enters a nickname
2. App authenticates using Nakama (device auth)
3. WebSocket connection is established
4. Player joins matchmaking
5. Game starts when 2 players match
6. Moves sync in real-time

---

## 📦 Setup Instructions

### 1. Clone the repo

```bash
git clone https://github.com/SivaranjaniParthiban/lila-tictactoe.git
cd lila-tictactoe/frontend
```

### 2. Install dependencies

```bash
npm install
```

### 3. Run locally

```bash
npm run dev
```

---

## 🔑 Environment Config

Update Nakama server URL in:

```ts
nakama.ts
```

Example:

```ts
new Client("defaultkey", "your-backend-url", "443", true);
```

---

## 🌍 Live Demo

Frontend: https://lila-tictactoe-eta.vercel.app
Backend: https://lila-tictactoe-production.up.railway.app



## 💡 Future Improvements

* 🧑‍🤝‍🧑 Friend invite system
* 🏆 Leaderboard
* 🎨 Better UI/UX
* 📱 Mobile responsiveness

---

## 👩‍💻 Author

Sivaranjani Parthiban
GitHub: https://github.com/SivaranjaniParthiban

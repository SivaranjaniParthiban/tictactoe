function checkWinner(board: string[]): string | null {
  const lines = [
    [0,1,2],[3,4,5],[6,7,8],
    [0,3,6],[1,4,7],[2,5,8],
    [0,4,8],[2,4,6],
  ];
  for (let i = 0; i < lines.length; i++) {
    const a = lines[i][0], b = lines[i][1], c = lines[i][2];
    if (board[a] && board[a] === board[b] && board[a] === board[c]) {
      return board[a];
    }
  }
  let full = true;
  for (let i = 0; i < board.length; i++) {
    if (board[i] === "") { full = false; break; }
  }
  return full ? "draw" : null;
}

function broadcastState(dispatcher: nkruntime.MatchDispatcher, state: any): void {
  const payload = JSON.stringify({
    board: state.board,
    turn: state.turn,
    marks: state.marks,
    winner: state.winner,
    gameOver: state.gameOver,
    turnDeadline: state.turnDeadline,
  });
  dispatcher.broadcastMessage(2, payload, null, null, true);
}

function updateLeaderboard(nk: nkruntime.Nakama, winnerId: string, loserId: string): void {
  try {
    nk.leaderboardRecordWrite("tictactoe_wins", winnerId, "", 1, 0, {});
    nk.leaderboardRecordWrite("tictactoe_losses", loserId, "", 1, 0, {});
  } catch (e) {}
}

function matchInit(ctx: nkruntime.Context, logger: nkruntime.Logger, nk: nkruntime.Nakama, params: {[key: string]: string}): {state: nkruntime.MatchState, tickRate: number, label: string} {
  logger.info("Match initialised");
  return {
    state: {
      board: ["","","","","","","","",""],
      marks: {},
      turn: "",
      players: {},
      winner: null,
      gameOver: false,
      turnDeadline: 0,
    },
    tickRate: 5,
    label: "tictactoe",
  };
}

function matchJoinAttempt(ctx: nkruntime.Context, logger: nkruntime.Logger, nk: nkruntime.Nakama, dispatcher: nkruntime.MatchDispatcher, tick: number, state: nkruntime.MatchState, presence: nkruntime.Presence, metadata: {[key: string]: any}): {state: nkruntime.MatchState, accept: boolean, rejectMessage?: string} {
  const s = state as any;
  if (Object.keys(s.players).length >= 2) {
    return { state: s, accept: false, rejectMessage: "Match is full" };
  }
  return { state: s, accept: true };
}

function matchJoin(ctx: nkruntime.Context, logger: nkruntime.Logger, nk: nkruntime.Nakama, dispatcher: nkruntime.MatchDispatcher, tick: number, state: nkruntime.MatchState, presences: nkruntime.Presence[]): {state: nkruntime.MatchState} {
  const s = state as any;
  for (let i = 0; i < presences.length; i++) {
    const p = presences[i];
    s.players[p.userId] = p;
    logger.info("Player joined: " + p.userId);
  }
  const playerIds = Object.keys(s.players);
  if (playerIds.length === 2) {
    s.marks[playerIds[0]] = "X";
    s.marks[playerIds[1]] = "O";
    s.turn = playerIds[0];
    s.turnDeadline = Date.now() + 30000;
    broadcastState(dispatcher, s);
    logger.info("Game starting!");
  }
  return { state: s };
}

function matchLeave(ctx: nkruntime.Context, logger: nkruntime.Logger, nk: nkruntime.Nakama, dispatcher: nkruntime.MatchDispatcher, tick: number, state: nkruntime.MatchState, presences: nkruntime.Presence[]): {state: nkruntime.MatchState} {
  const s = state as any;
  for (let i = 0; i < presences.length; i++) {
    delete s.players[presences[i].userId];
  }
  const remaining = Object.keys(s.players);
  if (!s.gameOver && remaining.length === 1) {
    s.winner = remaining[0];
    s.gameOver = true;
    broadcastState(dispatcher, s);
  }
  return { state: s };
}

function matchLoop(ctx: nkruntime.Context, logger: nkruntime.Logger, nk: nkruntime.Nakama, dispatcher: nkruntime.MatchDispatcher, tick: number, state: nkruntime.MatchState, messages: nkruntime.MatchMessage[]): {state: nkruntime.MatchState} | null {
  const s = state as any;
  const playerIds = Object.keys(s.players);

  if (playerIds.length === 0) return null;
  if (playerIds.length < 2) return { state: s };
  if (s.gameOver) return null;

  // Turn timer
  if (s.turnDeadline > 0 && Date.now() > s.turnDeadline) {
    const loser = s.turn;
    const markIds = Object.keys(s.marks);
    let winner = "";
    for (let i = 0; i < markIds.length; i++) {
      if (markIds[i] !== loser) { winner = markIds[i]; break; }
    }
    s.winner = winner;
    s.gameOver = true;
    broadcastState(dispatcher, s);
    updateLeaderboard(nk, winner, loser);
    return { state: s };
  }

  // Process moves
  for (let i = 0; i < messages.length; i++) {
    const message = messages[i];
    if (message.opCode !== 1) continue;

    const senderId = message.sender.userId;
    if (senderId !== s.turn) continue;

    let data: any;
    try {
      data = JSON.parse(nk.binaryToString(message.data));
    } catch (e) {
      continue;
    }

    const pos = data.position;
    if (pos === undefined || pos < 0 || pos > 8 || s.board[pos] !== "") continue;

    s.board[pos] = s.marks[senderId];

    const result = checkWinner(s.board);
    if (result) {
      if (result === "draw") {
        s.winner = "draw";
      } else {
        const markIds = Object.keys(s.marks);
        let winnerId = "";
        let loserId = "";
        for (let j = 0; j < markIds.length; j++) {
          if (s.marks[markIds[j]] === result) winnerId = markIds[j];
          else loserId = markIds[j];
        }
        s.winner = winnerId;
        updateLeaderboard(nk, winnerId, loserId);
      }
      s.gameOver = true;
    } else {
      const markIds = Object.keys(s.marks);
      for (let j = 0; j < markIds.length; j++) {
        if (markIds[j] !== senderId) { s.turn = markIds[j]; break; }
      }
      s.turnDeadline = Date.now() + 30000;
    }

    broadcastState(dispatcher, s);
  }

  return { state: s };
}

function matchTerminate(ctx: nkruntime.Context, logger: nkruntime.Logger, nk: nkruntime.Nakama, dispatcher: nkruntime.MatchDispatcher, tick: number, state: nkruntime.MatchState, graceSeconds: number): {state: nkruntime.MatchState} {
  return { state: state };
}

function matchSignal(ctx: nkruntime.Context, logger: nkruntime.Logger, nk: nkruntime.Nakama, dispatcher: nkruntime.MatchDispatcher, tick: number, state: nkruntime.MatchState): {state: nkruntime.MatchState} {
  return { state: state };
}

function matchmakerMatched(ctx: nkruntime.Context, logger: nkruntime.Logger, nk: nkruntime.Nakama, matches: nkruntime.MatchmakerResult[]): string | void {
  try {
    const matchId = nk.matchCreate("tictactoe", {});
    logger.info("Match created: " + matchId);
    return matchId;
  } catch (e) {
    logger.error("Failed to create match: " + e);
  }
}

function InitModule(ctx: nkruntime.Context, logger: nkruntime.Logger, nk: nkruntime.Nakama, initializer: nkruntime.Initializer): Error | void {
  try {
    nk.leaderboardCreate("tictactoe_wins", false, "desc", "incr", "", false);
    nk.leaderboardCreate("tictactoe_losses", false, "desc", "incr", "", false);
  } catch (e) {
    logger.warn("Leaderboards may already exist");
  }

  initializer.registerMatch("tictactoe", {
    matchInit: matchInit,
    matchJoinAttempt: matchJoinAttempt,
    matchJoin: matchJoin,
    matchLeave: matchLeave,
    matchLoop: matchLoop,
    matchTerminate: matchTerminate,
    matchSignal: matchSignal,
  });

  initializer.registerMatchmakerMatched(matchmakerMatched);

  logger.info("TicTacToe module loaded!");
}
function checkWinner(board) {
  var lines = [[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]];
  for (var i = 0; i < lines.length; i++) {
    var a = lines[i][0], b = lines[i][1], c = lines[i][2];
    if (board[a] && board[a] === board[b] && board[a] === board[c]) return board[a];
  }
  for (var i = 0; i < board.length; i++) {
    if (board[i] === "") return null;
  }
  return "draw";
}

function broadcastState(dispatcher, state) {
  var payload = JSON.stringify({
    board: state.board,
    turn: state.turn,
    marks: state.marks,
    winner: state.winner,
    gameOver: state.gameOver,
    turnDeadline: state.turnDeadline
  });
  dispatcher.broadcastMessage(2, payload, null, null, true);
}

function updateLeaderboard(nk, winnerId, loserId) {
  try {
    nk.leaderboardRecordWrite("tictactoe_wins", winnerId, "", 1, 0, {});
    nk.leaderboardRecordWrite("tictactoe_losses", loserId, "", 1, 0, {});
  } catch (e) {}
}

function matchInit(ctx, logger, nk, params) {
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
      started: false
    },
    tickRate: 5,
    label: "tictactoe"
  };
}

function matchJoinAttempt(ctx, logger, nk, dispatcher, tick, state, presence, metadata) {
  var s = state;
  if (Object.keys(s.players).length >= 2) {
    return { state: s, accept: false, rejectMessage: "Match is full" };
  }
  return { state: s, accept: true };
}

function matchJoin(ctx, logger, nk, dispatcher, tick, state, presences) {
  var s = state;
  for (var i = 0; i < presences.length; i++) {
    var p = presences[i];
    s.players[p.userId] = p;
    logger.info("Player joined: " + p.userId);
  }
  var playerIds = Object.keys(s.players);
  if (playerIds.length === 2) {
    s.marks[playerIds[0]] = "X";
    s.marks[playerIds[1]] = "O";
    s.turn = playerIds[0];
    s.turnDeadline = Date.now() + 30000;
    s.started = false;
    broadcastState(dispatcher, s);
    logger.info("Game starting!");
  }
  return { state: s };
}

function matchLeave(ctx, logger, nk, dispatcher, tick, state, presences) {
  var s = state;
  for (var i = 0; i < presences.length; i++) {
    delete s.players[presences[i].userId];
  }
  var remaining = Object.keys(s.players);
  if (!s.gameOver && remaining.length === 1) {
    s.winner = remaining[0];
    s.gameOver = true;
    broadcastState(dispatcher, s);
  }
  return { state: s };
}

function matchLoop(ctx, logger, nk, dispatcher, tick, state, messages) {
  var s = state;
  var playerIds = Object.keys(s.players);

  if (playerIds.length === 0) return null;
  if (playerIds.length < 2) return { state: s };
  if (s.gameOver) return null;

  if (!s.started) {
    s.started = true;
    broadcastState(dispatcher, s);
    return { state: s };
  }

  for (var i = 0; i < messages.length; i++) {
    if (messages[i].opCode === 99) {
      broadcastState(dispatcher, s);
    }
  }

  if (s.turnDeadline > 0 && Date.now() > s.turnDeadline) {
    var loser = s.turn;
    var markIds = Object.keys(s.marks);
    var winner = "";
    for (var i = 0; i < markIds.length; i++) {
      if (markIds[i] !== loser) { winner = markIds[i]; break; }
    }
    s.winner = winner;
    s.gameOver = true;
    broadcastState(dispatcher, s);
    updateLeaderboard(nk, winner, loser);
    return { state: s };
  }

  for (var i = 0; i < messages.length; i++) {
    var message = messages[i];
    if (message.opCode !== 1) continue;
    var senderId = message.sender.userId;
    if (senderId !== s.turn) continue;
    var data;
    try {
      data = JSON.parse(nk.binaryToString(message.data));
    } catch (e) {
      continue;
    }
    var pos = data.position;
    if (pos === undefined || pos < 0 || pos > 8 || s.board[pos] !== "") continue;
    s.board[pos] = s.marks[senderId];
    var result = checkWinner(s.board);
    if (result) {
      if (result === "draw") {
        s.winner = "draw";
      } else {
        var markIds2 = Object.keys(s.marks);
        var winnerId = "";
        var loserId = "";
        for (var j = 0; j < markIds2.length; j++) {
          if (s.marks[markIds2[j]] === result) winnerId = markIds2[j];
          else loserId = markIds2[j];
        }
        s.winner = winnerId;
        updateLeaderboard(nk, winnerId, loserId);
      }
      s.gameOver = true;
    } else {
      var markIds3 = Object.keys(s.marks);
      for (var j = 0; j < markIds3.length; j++) {
        if (markIds3[j] !== senderId) { s.turn = markIds3[j]; break; }
      }
      s.turnDeadline = Date.now() + 30000;
    }
    broadcastState(dispatcher, s);
  }

  return { state: s };
}

function matchTerminate(ctx, logger, nk, dispatcher, tick, state, graceSeconds) {
  return { state: state };
}

function matchSignal(ctx, logger, nk, dispatcher, tick, state) {
  return { state: state };
}

function matchmakerMatched(ctx, logger, nk, matches) {
  try {
    var matchId = nk.matchCreate("tictactoe", {});
    logger.info("Match created: " + matchId);
    return matchId;
  } catch (e) {
    logger.error("Failed to create match: " + e);
  }
}

function InitModule(ctx, logger, nk, initializer) {
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
    matchSignal: matchSignal
  });
  initializer.registerMatchmakerMatched(matchmakerMatched);
  logger.info("TicTacToe module loaded!");
}
/* ============================================================
   NUMBER BLITZ — script.js
   Activity 5: Game Database Connectivity Prototype

   Structure of this file:
     1. DB        — the storage layer (save / retrieve / delete)
     2. Game      — the game logic (questions, scoring, timer)
     3. UI        — screen switching and rendering
     4. Wiring    — button event listeners
   ============================================================ */


/* ============================================================
   1. DB — DATA STORAGE LAYER
   ------------------------------------------------------------
   Storage option used: Browser localStorage
   Collection name:     player_scores
   Stored as:           a JSON array of record objects

   Record structure (one row of player_scores):
     player_id    TEXT    unique identifier of the record
     player_name  TEXT    name entered by the player
     score        NUMBER  points earned in the round
     level        NUMBER  highest level reached
     remarks      TEXT    result label derived from the score
     created_at   TEXT    ISO date and time the record was saved
   ============================================================ */

const DB = {

  COLLECTION: "player_scores",

  /* Generate a unique identifier for each record.
     Combines the timestamp with a random suffix so two records
     saved in the same second can never collide. */
  newId() {
    const stamp = Date.now().toString(36);
    const random = Math.random().toString(36).slice(2, 7);
    return "PLR-" + stamp + "-" + random;
  },

  /* RETRIEVE — read every saved record out of storage.
     Returns an empty array if nothing has been saved yet. */
  getAll() {
    try {
      const raw = localStorage.getItem(this.COLLECTION);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch (err) {
      console.error("Could not read player_scores:", err);
      return [];
    }
  },

  /* SAVE — append one new record to the collection.
     Returns the saved record, or null if the write failed. */
  save(playerName, score, level, remarks) {
    try {
      const record = {
        player_id:   this.newId(),
        player_name: playerName,
        score:       score,
        level:       level,
        remarks:     remarks,
        created_at:  new Date().toISOString()
      };

      const records = this.getAll();      // read current data
      records.push(record);               // add the new row
      localStorage.setItem(this.COLLECTION, JSON.stringify(records)); // write back

      return record;
    } catch (err) {
      console.error("Could not save record:", err);
      return null;
    }
  },

  /* RETRIEVE (sorted) — highest score first, then most recent. */
  getRanked(limit) {
    const records = this.getAll().sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      return new Date(b.created_at) - new Date(a.created_at);
    });
    return limit ? records.slice(0, limit) : records;
  },

  /* DELETE — clear the whole collection. */
  clear() {
    try {
      localStorage.removeItem(this.COLLECTION);
      return true;
    } catch (err) {
      console.error("Could not clear player_scores:", err);
      return false;
    }
  }
};


/* ============================================================
   2. GAME — GAME LOGIC
   ============================================================ */

const ROUND_SECONDS = 60;
const WRONG_PENALTY = 3;    // seconds lost for a wrong answer
const LEVEL_EVERY   = 5;    // correct answers needed to level up

const Game = {
  playerName: "",
  score: 0,
  level: 1,
  correct: 0,
  wrong: 0,
  timeLeft: ROUND_SECONDS,
  answer: 0,
  timerId: null,
  locked: false,

  reset(name) {
    this.playerName = name;
    this.score = 0;
    this.level = 1;
    this.correct = 0;
    this.wrong = 0;
    this.timeLeft = ROUND_SECONDS;
    this.locked = false;
  },

  /* Build one question. Difficulty grows with the level. */
  makeQuestion() {
    const lvl = this.level;
    let a, b, op, answer;

    if (lvl === 1) {
      op = Math.random() < 0.5 ? "+" : "-";
      a = rand(2, 20);
      b = rand(2, 20);
    } else if (lvl === 2) {
      op = pick(["+", "-", "x"]);
      a = op === "x" ? rand(2, 9) : rand(10, 40);
      b = op === "x" ? rand(2, 9) : rand(5, 30);
    } else {
      op = pick(["+", "-", "x", "x"]);
      a = op === "x" ? rand(3, 12) : rand(20, 80);
      b = op === "x" ? rand(3, 12) : rand(10, 60);
    }

    if (op === "-" && b > a) { const t = a; a = b; b = t; }  // keep it positive

    if (op === "+") answer = a + b;
    else if (op === "-") answer = a - b;
    else answer = a * b;

    this.answer = answer;

    return {
      text: a + " " + op + " " + b,
      choices: this.makeChoices(answer)
    };
  },

  /* Three wrong answers that sit close to the correct one. */
  makeChoices(answer) {
    const set = new Set([answer]);
    while (set.size < 4) {
      const drift = rand(1, Math.max(5, Math.round(Math.abs(answer) * 0.2)));
      const wrong = Math.random() < 0.5 ? answer + drift : answer - drift;
      if (wrong !== answer && wrong >= 0) set.add(wrong);
    }
    return shuffle([...set]);
  },

  /* Score an answer. Returns true when it was correct. */
  submit(choice) {
    if (choice === this.answer) {
      this.correct++;
      this.score += 10 * this.level;
      if (this.correct % LEVEL_EVERY === 0) this.level++;
      return true;
    }
    this.wrong++;
    this.timeLeft = Math.max(0, this.timeLeft - WRONG_PENALTY);
    return false;
  },

  /* Result label saved into the remarks field. */
  remarks() {
    if (this.score >= 400) return "Excellent";
    if (this.score >= 250) return "Very good";
    if (this.score >= 120) return "Good";
    if (this.score > 0)    return "Needs practice";
    return "No points scored";
  }
};

function rand(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function pick(list) {
  return list[Math.floor(Math.random() * list.length)];
}

function shuffle(list) {
  for (let i = list.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [list[i], list[j]] = [list[j], list[i]];
  }
  return list;
}


/* ============================================================
   3. UI — SCREENS AND RENDERING
   ============================================================ */

const el = (id) => document.getElementById(id);

function showScreen(id) {
  document.querySelectorAll(".screen").forEach((s) => s.classList.remove("is-active"));
  el(id).classList.add("is-active");
  window.scrollTo(0, 0);
}

function renderHud() {
  el("hudScore").textContent = Game.score;
  el("hudLevel").textContent = Game.level;
  el("hudTime").textContent = Game.timeLeft;

  const pct = (Game.timeLeft / ROUND_SECONDS) * 100;
  el("timeFill").style.width = pct + "%";

  const low = Game.timeLeft <= 10;
  el("timeFill").classList.toggle("is-low", low);
  document.querySelector(".hud__cell--time").classList.toggle("is-low", low);
}

function renderQuestion() {
  const q = Game.makeQuestion();
  el("question").textContent = q.text;

  const box = el("choices");
  box.innerHTML = "";

  q.choices.forEach((value) => {
    const btn = document.createElement("button");
    btn.className = "choice";
    btn.type = "button";
    btn.textContent = value;
    btn.addEventListener("click", () => handleAnswer(btn, value));
    box.appendChild(btn);
  });
}

function handleAnswer(button, value) {
  if (Game.locked) return;
  Game.locked = true;

  const pointsOnOffer = 10 * Game.level;
  const wasRight = Game.submit(value);
  const note = el("feedback");

  if (wasRight) {
    button.classList.add("is-right");
    note.textContent = "Correct, +" + pointsOnOffer + " points";
    note.className = "feedback is-right";
  } else {
    button.classList.add("is-wrong");
    note.textContent = "Wrong, the answer was " + Game.answer + " (−" + WRONG_PENALTY + "s)";
    note.className = "feedback is-wrong";
  }

  renderHud();

  setTimeout(() => {
    Game.locked = false;
    if (Game.timeLeft > 0) {
      note.innerHTML = "&nbsp;";
      note.className = "feedback";
      renderQuestion();
    }
  }, 480);
}

function startRound() {
  el("playerChip").textContent = "Playing as " + Game.playerName;
  el("feedback").innerHTML = "&nbsp;";
  el("feedback").className = "feedback";

  renderHud();
  renderQuestion();
  showScreen("screen-play");

  clearInterval(Game.timerId);
  Game.timerId = setInterval(() => {
    Game.timeLeft--;
    renderHud();
    if (Game.timeLeft <= 0) endRound();
  }, 1000);
}

function endRound() {
  clearInterval(Game.timerId);

  el("finalScore").textContent   = Game.score;
  el("finalName").textContent    = Game.playerName;
  el("finalLevel").textContent   = Game.level;
  el("finalCorrect").textContent = Game.correct;
  el("finalRemark").textContent  = Game.remarks();

  showScreen("screen-over");

  /* --- SAVE the record to storage --- */
  const saved = DB.save(Game.playerName, Game.score, Game.level, Game.remarks());
  const note = el("saveNote");

  if (saved) {
    note.textContent = "Record saved as " + saved.player_id;
    note.className = "savenote is-saved";
  } else {
    note.textContent = "Record could not be saved. Storage may be blocked in this browser.";
    note.className = "savenote is-failed";
  }
}

/* --- RETRIEVE the records and display them --- */
function renderRecords() {
  const records = DB.getRanked(10);
  const board = el("board");
  board.innerHTML = "";

  el("boardEmpty").hidden = records.length > 0;

  records.forEach((r, i) => {
    const when = new Date(r.created_at).toLocaleString();
    const li = document.createElement("li");
    li.className = "board__row";
    li.innerHTML =
      '<span class="board__rank">' + (i + 1) + '</span>' +
      '<span class="board__name">' + escapeHtml(r.player_name) +
        '<span class="board__sub">Level ' + r.level + ' · ' + escapeHtml(r.remarks) + ' · ' + when + '</span>' +
      '</span>' +
      '<span class="board__score">' + r.score + '</span>';
    board.appendChild(li);
  });

  el("rawData").textContent = JSON.stringify(DB.getAll(), null, 2) || "[]";
  showScreen("screen-records");
}

function escapeHtml(text) {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}


/* ============================================================
   4. WIRING — EVENT LISTENERS
   ============================================================ */

el("btnStart").addEventListener("click", () => {
  const name = el("playerName").value.trim();

  if (!name) {
    el("nameError").hidden = false;
    el("playerName").focus();
    return;
  }

  el("nameError").hidden = true;
  Game.reset(name);
  startRound();
});

el("playerName").addEventListener("keydown", (e) => {
  if (e.key === "Enter") el("btnStart").click();
});

el("btnAgain").addEventListener("click", () => {
  Game.reset(Game.playerName);
  startRound();
});

el("btnViewRecords").addEventListener("click", renderRecords);
el("btnToRecords").addEventListener("click", renderRecords);
el("btnBack").addEventListener("click", () => showScreen("screen-start"));

el("btnClear").addEventListener("click", () => {
  if (confirm("Delete every saved record? This cannot be undone.")) {
    DB.clear();
    renderRecords();
  }
});

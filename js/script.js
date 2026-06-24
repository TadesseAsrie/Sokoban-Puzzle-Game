/**
 * Sokoban Puzzle Game Engine
 * Completely modular, architecture-separated vanilla implementation
 */

// 1. Immutable Level Definitions Matrix Config
// Legend Tokens:
// W = Wall, F = Floor, T = Target, B = Box, P = Player, X = Box on Target, O = Player on Target
const SOKOBAN_LEVELS = [
  [
    // Level 1
    ["W", "W", "W", "W", "W", "W"],
    ["W", "F", "F", "F", "W", "W"],
    ["W", "F", "B", "T", "F", "W"],
    ["W", "P", "B", "T", "F", "W"],
    ["W", "F", "F", "F", "W", "W"],
    ["W", "W", "W", "W", "W", "W"],
  ],
  [
    // Level 2
    ["W", "W", "W", "W", "W", "W", "W"],
    ["W", "W", "W", "F", "F", "T", "W"],
    ["W", "F", "P", "B", "F", "F", "W"],
    ["W", "F", "W", "B", "F", "T", "W"],
    ["W", "F", "F", "F", "W", "W", "W"],
    ["W", "W", "W", "W", "W", "W", "W"],
  ],
  [
    // Level 3
    ["W", "W", "W", "W", "W", "W", "W"],
    ["W", "T", "T", "F", "W", "F", "W"],
    ["W", "F", "B", "B", "F", "F", "W"],
    ["W", "F", "F", "P", "W", "F", "W"],
    ["W", "W", "W", "W", "W", "W", "W"],
  ],
  [
    // Level 4
    ["W", "W", "W", "W", "W", "W", "W", "W"],
    ["W", "F", "F", "T", "W", "F", "F", "W"],
    ["W", "F", "B", "F", "B", "F", "F", "W"],
    ["W", "W", "F", "P", "F", "W", "T", "W"],
    ["W", "F", "F", "F", "F", "W", "W", "W"],
    ["W", "W", "W", "W", "W", "W", "W", "W"],
  ],
  [
    // Level 5
    ["W", "W", "W", "W", "W", "W", "W"],
    ["W", "T", "F", "P", "F", "T", "W"],
    ["W", "F", "B", "W", "B", "F", "W"],
    ["W", "F", "F", "F", "F", "F", "W"],
    ["W", "W", "W", "W", "W", "W", "W"],
  ],
  [
    // Level 6
    ["W", "W", "W", "W", "W", "W", "W", "W"],
    ["W", "W", "W", "T", "T", "W", "W", "W"],
    ["W", "F", "F", "B", "F", "F", "F", "W"],
    ["W", "F", "B", "P", "B", "F", "F", "W"],
    ["W", "W", "F", "T", "F", "W", "W", "W"],
    ["W", "W", "W", "W", "W", "W", "W", "W"],
  ],
  [
    // Level 7
    ["W", "W", "W", "W", "W", "W", "W", "W"],
    ["W", "T", "T", "T", "F", "W", "W", "W"],
    ["W", "F", "B", "B", "B", "F", "F", "W"],
    ["W", "F", "F", "P", "F", "F", "F", "W"],
    ["W", "W", "W", "W", "W", "W", "W", "W"],
  ],
  [
    // Level 8
    ["W", "W", "W", "W", "W", "W", "W", "W", "W"],
    ["W", "T", "F", "F", "W", "F", "F", "T", "W"],
    ["W", "F", "B", "F", "B", "F", "B", "F", "W"],
    ["W", "F", "F", "F", "P", "F", "F", "F", "W"],
    ["W", "W", "W", "W", "W", "W", "W", "W", "W"],
  ],
  [
    // Level 9
    ["W", "W", "W", "W", "W", "W", "W", "W"],
    ["W", "T", "T", "T", "T", "W", "W", "W"],
    ["W", "B", "B", "B", "B", "F", "F", "W"],
    ["W", "F", "F", "P", "F", "F", "F", "W"],
    ["W", "W", "W", "W", "W", "W", "W", "W"],
  ],
  [
    // Level 10
    ["W", "W", "W", "W", "W", "W", "W", "W", "W"],
    ["W", "T", "T", "T", "W", "T", "T", "T", "W"],
    ["W", "F", "B", "F", "B", "F", "B", "F", "W"],
    ["W", "F", "F", "F", "P", "F", "F", "F", "W"],
    ["W", "W", "W", "W", "W", "W", "W", "W", "W"],
  ],
];

// 2. Synthesized Sound Effects Engine (Web Audio API)
const AudioEngine = {
  ctx: null,
  muted: false,

  init() {
    // Deferred initialization to satisfy browser autoplay security rules
    if (!this.ctx) {
      this.ctx = new (window.AudioContext || window.webkitAudioContext)();
    }
  },

  playTone(freq, type, duration, vol) {
    if (this.muted) return;
    this.init();
    try {
      const osc = this.ctx.createOscillator();
      const gainNode = this.ctx.createGain();

      osc.type = type;
      osc.frequency.setValueAtTime(freq, this.ctx.currentTime);

      gainNode.gain.setValueAtTime(vol, this.ctx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(
        0.00001,
        this.ctx.currentTime + duration,
      );

      osc.connect(gainNode);
      gainNode.connect(this.ctx.destination);

      osc.start();
      osc.stop(this.ctx.currentTime + duration);
    } catch (e) {
      console.warn("Audio Context blocked or unsupported");
    }
  },

  move() {
    this.playTone(150, "triangle", 0.08, 0.2);
  },
  push() {
    this.playTone(90, "sawtooth", 0.15, 0.25);
  },
  levelComplete() {
    const now = this.ctx ? this.ctx.currentTime : 0;
    this.playTone(330, "sine", 0.1, 0.3);
    setTimeout(() => this.playTone(440, "sine", 0.1, 0.3), 120);
    setTimeout(() => this.playTone(660, "sine", 0.25, 0.3), 240);
  },
  gameComplete() {
    let notes = [261.63, 329.63, 392.0, 523.25];
    notes.forEach((freq, idx) => {
      setTimeout(() => this.playTone(freq, "sine", 0.3, 0.3), idx * 150);
    });
  },
};

// 3. Central Application & Logic Controller Matrix
class SokobanGame {
  constructor() {
    this.currentLevelIndex = 0;
    this.grid = []; // Runtime dynamic grid layout mapping
    this.playerPos = { r: 0, c: 0 };
    this.moves = 0;
    this.isPaused = false;

    // Timer Mechanics
    this.timerInterval = null;
    this.secondsElapsed = 0;

    // Cumulative Metrics Tracking
    this.stats = {
      played: 0,
      completed: 0,
      totalMoves: 0,
    };

    this.initElements();
    this.loadSettingsAndStats();
    this.buildLevelDropdown();
    this.bindEvents();
    this.loadLevel(this.currentLevelIndex);
  }

  initElements() {
    this.boardEl = document.getElementById("game-board");
    this.levelDisplay = document.getElementById("level-display");
    this.moveDisplay = document.getElementById("move-display");
    this.timerDisplay = document.getElementById("timer-display");
    this.bestDisplay = document.getElementById("best-display");
    this.levelSelect = document.getElementById("level-select");

    // Control Handles
    this.themeToggle = document.getElementById("theme-toggle");
    this.muteToggle = document.getElementById("mute-toggle");
    this.prevBtn = document.getElementById("prev-btn");
    this.nextBtn = document.getElementById("next-btn");
    this.restartBtn = document.getElementById("restart-btn");
    this.pauseToggle = document.getElementById("pause-toggle");
    this.pauseOverlay = document.getElementById("pause-overlay");
    this.resumeBtn = document.getElementById("resume-btn");
    this.resetProgressBtn = document.getElementById("reset-progress-btn");
    this.statsBtn = document.getElementById("stats-btn");

    // Modals
    this.winModal = document.getElementById("win-modal");
    this.modalMoves = document.getElementById("modal-moves");
    this.modalTime = document.getElementById("modal-time");
    this.modalNextBtn = document.getElementById("modal-next-btn");

    this.completeModal = document.getElementById("complete-modal");
    this.totalMovesEl = document.getElementById("total-moves");
    this.totalTimeEl = document.getElementById("total-time");
    this.playAgainBtn = document.getElementById("play-again-btn");

    this.statsModal = document.getElementById("stats-modal");
    this.statsCloseBtn = document.getElementById("stats-close-btn");
  }

  buildLevelDropdown() {
    this.levelSelect.innerHTML = "";
    SOKOBAN_LEVELS.forEach((_, index) => {
      const opt = document.createElement("option");
      opt.value = index;
      opt.textContent = `Level ${index + 1}`;
      this.levelSelect.appendChild(opt);
    });
  }

  loadSettingsAndStats() {
    // Dark/Light Theme Config Loader
    const savedTheme = localStorage.getItem("sokoban_theme") || "dark-theme";
    document.body.className = savedTheme;

    // Mute state
    const savedMute = localStorage.getItem("sokoban_muted") === "true";
    AudioEngine.muted = savedMute;
    this.muteToggle.textContent = savedMute ? "🔇" : "🔊";

    // Game Track Level Indices
    const savedLevelIndex = localStorage.getItem("sokoban_current_level");
    if (savedLevelIndex !== null) {
      this.currentLevelIndex = parseInt(savedLevelIndex, 10);
    }

    // Base Statistics Matrix Loader
    const savedStats = localStorage.getItem("sokoban_stats");
    if (savedStats) {
      this.stats = { ...this.stats, ...JSON.parse(savedStats) };
    }
  }

  saveStats() {
    localStorage.setItem("sokoban_stats", JSON.stringify(this.stats));
  }

  loadLevel(index) {
    if (index < 0 || index >= SOKOBAN_LEVELS.length) return;
    this.currentLevelIndex = index;
    localStorage.setItem("sokoban_current_level", this.currentLevelIndex);

    this.levelSelect.value = index;

    // Re-clone nested map array structure deeply
    const baseMap = SOKOBAN_LEVELS[index];
    this.grid = baseMap.map((row) => [...row]);

    // Clear State
    this.moves = 0;
    this.secondsElapsed = 0;
    this.isPaused = false;
    this.pauseOverlay.classList.add("hidden");
    this.winModal.classList.add("hidden");
    this.completeModal.classList.add("hidden");

    // Scan Core Coordinates
    for (let r = 0; r < this.grid.length; r++) {
      for (let c = 0; c < this.grid[r].length; c++) {
        if (this.grid[r][c] === "P" || this.grid[r][c] === "O") {
          this.playerPos = { r, c };
        }
      }
    }

    this.stats.played++;
    this.saveStats();

    this.updateScoreboardHeaders();
    this.renderBoard();
    this.startTimer();

    // Focus container board grid for dynamic execution safety
    this.boardEl.focus();
  }

  updateScoreboardHeaders() {
    this.levelDisplay.textContent = `${this.currentLevelIndex + 1}/${SOKOBAN_LEVELS.length}`;
    this.moveDisplay.textContent = this.moves;
    this.timerDisplay.textContent = this.formatTime(this.secondsElapsed);

    // Fetch Top Local Best Score Metric
    const best = localStorage.getItem(
      `sokoban_best_lvl_${this.currentLevelIndex}`,
    );
    this.bestDisplay.textContent = best ? `${best} moves` : "--";
  }

  renderBoard() {
    const rows = this.grid.length;
    const cols = this.grid[0].length;

    this.boardEl.style.gridTemplateRows = `repeat(${rows}, 1fr)`;
    this.boardEl.style.gridTemplateColumns = `repeat(${cols}, 1fr)`;
    this.boardEl.innerHTML = "";

    // Component UI Block Tokens mapping
    const TokenUI = {
      W: { class: "wall", char: "🧱" },
      F: { class: "floor", char: "" },
      T: { class: "target", char: "🎯" },
      B: { class: "box", char: "📦" },
      P: { class: "player", char: "🤠" },
      X: { class: "box-on-target", char: "📦" },
      O: { class: "player-on-target", char: "🤠" },
    };

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const token = this.grid[r][c];
        const tileData = TokenUI[token] || TokenUI["F"];

        const tileDiv = document.createElement("div");
        tileDiv.className = `tile ${tileData.class}`;
        tileDiv.textContent = tileData.char;
        tileDiv.dataset.row = r;
        tileDiv.dataset.col = c;

        this.boardEl.appendChild(tileDiv);
      }
    }
  }

  // 4. Input Directional Collision Processing Mechanics
  handleMove(dr, dc) {
    if (this.isPaused || !this.grid.length) return;

    const srcRow = this.playerPos.r;
    const srcCol = this.playerPos.c;
    const targetRow = srcRow + dr;
    const targetCol = srcCol + dc;

    // Board boundary validation safeguard
    if (
      targetRow < 0 ||
      targetRow >= this.grid.length ||
      targetCol < 0 ||
      targetCol >= this.grid[0].length
    )
      return;

    const targetCell = this.grid[targetRow][targetCol];

    // Case A: Next block space is standard walkable Floor or empty Target
    if (targetCell === "F" || targetCell === "T") {
      this.executePlayerStep(srcRow, srcCol, targetRow, targetCol, targetCell);
      AudioEngine.move();
    }
    // Case B: Next cell block is an obstacled pushable Box or matched Box
    else if (targetCell === "B" || targetCell === "X") {
      const pushRow = targetRow + dr;
      const pushCol = targetCol + dc;

      if (
        pushRow < 0 ||
        pushRow >= this.grid.length ||
        pushCol < 0 ||
        pushCol >= this.grid[0].length
      )
        return;

      const pushCell = this.grid[pushRow][pushCol];

      // Validate space directly behind box is clear or targeted
      if (pushCell === "F" || pushCell === "T") {
        // Relocate box item unit state
        this.grid[pushRow][pushCol] = pushCell === "T" ? "X" : "B";

        // Advance player configuration forward into vacated box slot grid space
        this.executePlayerStep(
          srcRow,
          srcCol,
          targetRow,
          targetCol,
          targetCell,
        );
        AudioEngine.push();
      } else {
        return; // Double blocks or solid wall prevents push execution path
      }
    } else {
      return; // Solid wall structural asset hit
    }

    this.moves++;
    this.stats.totalMoves++;
    this.updateScoreboardHeaders();
    this.animateTileMovement(targetRow, targetCol);
    this.checkWinCondition();
  }

  executePlayerStep(sR, sC, tR, tC, targetCellType) {
    // Revert departure profile cell states
    const sourceCell = this.grid[sR][sC];
    this.grid[sR][sC] = sourceCell === "O" ? "T" : "F";

    // Assign destination layout metrics
    if (targetCellType === "F" || targetCellType === "B") {
      this.grid[tR][tC] = "P";
    } else if (targetCellType === "T" || targetCellType === "X") {
      this.grid[tR][tC] = "O";
    }

    this.playerPos = { r: tR, c: tC };
    this.renderBoard();
  }

  animateTileMovement(r, c) {
    const targetTile = this.boardEl.querySelector(
      `[data-row='${r}'][data-col='${c}']`,
    );
    if (targetTile) {
      targetTile.style.transform = "scale(0.95)";
      setTimeout(() => (targetTile.style.transform = "scale(1)"), 100);
    }
  }

  checkWinCondition() {
    // Level completion evaluated by validating that no standard unplaced "B" boxes exist
    let unsolvedBoxes = 0;
    for (let r = 0; r < this.grid.length; r++) {
      for (let c = 0; c < this.grid[r].length; c++) {
        if (this.grid[r][c] === "B") {
          unsolvedBoxes++;
        }
      }
    }

    if (unsolvedBoxes === 0) {
      this.handleLevelClearSuccess();
    }
  }

  handleLevelClearSuccess() {
    this.stopTimer();
    this.stats.completed++;
    this.saveStats();

    // Evaluate and set personal record metrics
    const bestKey = `sokoban_best_lvl_${this.currentLevelIndex}`;
    const previousBest = localStorage.getItem(bestKey);
    if (!previousBest || this.moves < parseInt(previousBest, 10)) {
      localStorage.setItem(bestKey, this.moves);
    }

    if (this.currentLevelIndex === SOKOBAN_LEVELS.length - 1) {
      // Master Campaign Completion Sequence reached
      AudioEngine.gameComplete();
      this.showGameCompleteModal();
    } else {
      AudioEngine.levelComplete();
      this.showWinModal();
    }
  }

  // 5. Timer Utilities Engine
  startTimer() {
    this.stopTimer();
    this.timerInterval = setInterval(() => {
      if (!this.isPaused) {
        this.secondsElapsed++;
        this.timerDisplay.textContent = this.formatTime(this.secondsElapsed);
      }
    }, 1000);
  }

  stopTimer() {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
  }

  formatTime(totalSecs) {
    const mins = Math.floor(totalSecs / 60);
    const secs = totalSecs % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  }

  togglePause() {
    this.isPaused = !this.isPaused;
    if (this.isPaused) {
      this.pauseOverlay.classList.remove("hidden");
      this.pauseToggle.textContent = "Resume";
    } else {
      this.pauseOverlay.classList.add("hidden");
      this.pauseToggle.textContent = "Pause";
      this.boardEl.focus();
    }
  }

  // 6. Presentation Modal Triggers
  showWinModal() {
    this.modalMoves.textContent = this.moves;
    this.modalTime.textContent = this.formatTime(this.secondsElapsed);
    this.winModal.classList.remove("hidden");
    this.modalNextBtn.focus();
  }

  showGameCompleteModal() {
    this.totalMovesEl.textContent = this.stats.totalMoves;
    this.totalTimeEl.textContent = this.formatTime(this.secondsElapsed);
    this.completeModal.classList.remove("hidden");
    this.playAgainBtn.focus();
  }

  showStatsDashboard() {
    document.getElementById("stat-played").textContent = this.stats.played;
    document.getElementById("stat-completed").textContent =
      this.stats.completed;
    document.getElementById("stat-total-moves").textContent =
      this.stats.totalMoves;
    this.statsModal.classList.remove("hidden");
    this.statsCloseBtn.focus();
  }

  // 7. Event Core Registration Mapping Hooks
  bindEvents() {
    // Keyboard mapping controls
    window.addEventListener("keydown", (e) => {
      if (
        ["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "Space"].includes(
          e.code,
        ) &&
        document.activeElement === this.boardEl
      ) {
        e.preventDefault(); // Mitigate core screen viewport bouncing artifacting
      }

      // Deferred interaction audio initializer hook
      AudioEngine.init();

      switch (e.key.toLowerCase()) {
        case "arrowup":
        case "w":
          this.handleMove(-1, 0);
          break;
        case "arrowdown":
        case "s":
          this.handleMove(1, 0);
          break;
        case "arrowleft":
        case "a":
          this.handleMove(0, -1);
          break;
        case "arrowright":
        case "d":
          this.handleMove(0, 1);
          break;
        case "r":
          this.loadLevel(this.currentLevelIndex);
          break;
      }
    });

    // Dropdown Selector Change Hook
    this.levelSelect.addEventListener("change", (e) => {
      this.loadLevel(parseInt(e.target.value, 10));
    });

    // Global Nav Command Triggers
    this.prevBtn.addEventListener("click", () => {
      if (this.currentLevelIndex > 0)
        this.loadLevel(this.currentLevelIndex - 1);
    });
    this.nextBtn.addEventListener("click", () => {
      if (this.currentLevelIndex < SOKOBAN_LEVELS.length - 1)
        this.loadLevel(this.currentLevelIndex + 1);
    });
    this.restartBtn.addEventListener("click", () =>
      this.loadLevel(this.currentLevelIndex),
    );
    this.pauseToggle.addEventListener("click", () => this.togglePause());
    this.resumeBtn.addEventListener("click", () => this.togglePause());

    this.resetProgressBtn.addEventListener("click", () => {
      if (
        confirm(
          "Are you absolutely sure you want to clear your high scores, lifetime statistics, and map progression details?",
        )
      ) {
        localStorage.clear();
        this.currentLevelIndex = 0;
        this.stats = { played: 0, completed: 0, totalMoves: 0 };
        this.loadLevel(0);
      }
    });

    // Statistics Views Hook
    this.statsBtn.addEventListener("click", () => this.showStatsDashboard());
    this.statsCloseBtn.addEventListener("click", () =>
      this.statsModal.classList.add("hidden"),
    );

    // Modal Command Routing Hook Actions
    this.modalNextBtn.addEventListener("click", () => {
      this.winModal.classList.add("hidden");
      this.loadLevel(this.currentLevelIndex + 1);
    });
    this.playAgainBtn.addEventListener("click", () => {
      this.completeModal.classList.add("hidden");
      this.loadLevel(0);
    });

    // Theme Switch Toggle Hook Engine
    this.themeToggle.addEventListener("click", () => {
      const systemTheme = document.body.classList.contains("dark-theme")
        ? "light-theme"
        : "dark-theme";
      document.body.className = systemTheme;
      localStorage.setItem("sokoban_theme", systemTheme);
    });

    // Audio System State Mute Toggle Config
    this.muteToggle.addEventListener("click", () => {
      AudioEngine.muted = !AudioEngine.muted;
      localStorage.setItem("sokoban_muted", AudioEngine.muted);
      this.muteToggle.textContent = AudioEngine.muted ? "🔇" : "🔊";
      this.boardEl.focus();
    });

    // Mobile On-Screen D-Pad Interface Links
    const bindDpad = (id, dr, dc) => {
      document.getElementById(id).addEventListener("click", (e) => {
        e.preventDefault();
        AudioEngine.init();
        this.handleMove(dr, dc);
      });
    };
    bindDpad("pad-up", -1, 0);
    bindDpad("pad-down", 1, 0);
    bindDpad("pad-left", 0, -1);
    bindDpad("pad-right", 0, 1);
  }
}

// Instantiate Global Game Lifecycle context on parse DOM load event
window.addEventListener("DOMContentLoaded", () => {
  new SokobanGame();
});

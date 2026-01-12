// game.js
import { createTreeNode } from "./TreeMap.js";
import { characters } from "./Karakter.js";

class HexagonalBoard {
  constructor(gameMode, aiDifficulty = null) {
    this.gameMode = gameMode;
    this.resumeAIAfterNemesis = false;
    this.aiDifficulty = aiDifficulty;
    this.isAIPlayer = gameMode === "ai"; // === ini buat ai ====
    this.aiThinking = false;
    this.board = document.getElementById("game-board");
    this.buttons = [];
    this.positions = this.calculatePositions();
    this.adjacencyMap = this.calculateAdjacency();
    this.tree = [];
    this.currentTurn = "white";
    this.turnCount = 1;
    this.whiteStartPositions = [30, 31, 32, 33, 34, 35, 36];
    this.blackStartPositions = [9, 4, 1, 3, 8, 15, 0];
    this.availableCharacters = this.getAvailableCharacters();
    this.currentCards = [null, null, null];
    this.whiteRecruitmentTurns = 0;
    this.blackRecruitmentTurns = 0;
    this.maxRecruitmentTurns = 4;

    // Movement phase tracking - per character
    this.currentPhase = "move";
    this.teamCharactersToMove = [];
    this.currentCharacterIndex = 0;
    this.selectedCharacterPosition = null;
    this.movedCharacters = new Set();
    this.useSpecialAbility = true; // Default to special ability
    this.useClawGrab = false; // Toggle for CLAW LAUNCHER grab vs pull

    // NEMESIS tracking
    this.nemesisMovesRemaining = 0;
    this.isNemesisIntercept = false;
    this.leaderMovedThisTurn = false;
    this.nemesisTeam = null; // Track which team has NEMESIS
    this.characterIndexBeforeNemesis = 0; // Store position before NEMESIS interrupt
    this.charactersToMoveBeforeNemesis = []; // Store character list before NEMESIS interrupt

    this.init();
    this.displayGameInfo();
    this.updatePhaseDisplay();
  }

  // Define the lines structure
  static lines = {
    // Diagonal (top left -> bottom right)
    diagonalTopLeft: [
      [30, 31, 32, 33],
      [23, 24, 25, 26, 34],
      [16, 17, 18, 19, 27, 35],
      [9, 10, 11, 12, 20, 28, 36],
      [4, 5, 6, 13, 21, 29],
      [1, 2, 7, 14, 22],
      [0, 3, 8, 15],
    ],

    // Diagonal (top right -> bottom left)
    diagonalTopRight: [
      [36, 35, 34, 33],
      [29, 28, 27, 26, 32],
      [22, 21, 20, 19, 25, 31],
      [15, 14, 13, 12, 18, 24, 30],
      [8, 7, 6, 11, 17, 23],
      [3, 2, 5, 10, 16],
      [0, 1, 4, 9],
    ],

    // Vertical
    vertical: [
      [9, 16, 23, 30],
      [31, 24, 17, 10, 4],
      [32, 25, 18, 11, 5, 1],
      [33, 26, 19, 12, 6, 2, 0],
      [34, 27, 20, 13, 7, 3],
      [35, 28, 21, 14, 8],
      [36, 29, 22, 15],
    ],
  };

  displayGameInfo() {
    const gameModeDisplay = document.getElementById("game-mode-display");
    if (this.gameMode === "2-player") {
      gameModeDisplay.textContent = "Mode: 2 Player";
    } else {
      gameModeDisplay.textContent = `Mode: AI (${this.aiDifficulty})`;
    }
    console.log(`Game Mode: ${this.gameMode}`);
    console.log(`AI Difficulty: ${this.aiDifficulty || "N/A"}`);
  }

  getAvailableCharacters() {
    return characters.filter((char) => !char.isKing && char.id !== 17);
  }

  getRandomCharacter() {
    if (this.availableCharacters.length === 0) {
      return null;
    }
    const randomIndex = Math.floor(
      Math.random() * this.availableCharacters.length
    );
    const character = this.availableCharacters.splice(randomIndex, 1)[0];
    return character;
  }

  initializeCards() {
    for (let i = 0; i < 3; i++) {
      const character = this.getRandomCharacter();
      if (character) {
        this.currentCards[i] = character;
        this.updateCardDisplay(i, character);
      }
    }
  }

  updateCardDisplay(cardIndex, character) {
    const cardElements = document.querySelectorAll(".playing-card");
    if (cardElements[cardIndex] && character) {
      const img = cardElements[cardIndex].querySelector(".card-image");
      const description =
        cardElements[cardIndex].querySelector(".card-description");

      img.src = character.fullart;
      img.alt = character.nama;
      description.textContent = `${character.nama}: ${character.ability}`;

      cardElements[cardIndex].dataset.characterIndex = cardIndex;
    }
  }

  placeLeaders() {
    const roiChar = characters.find((char) => char.id === 19);
    if (roiChar) {
      this.placeCharacterAtPosition(roiChar, 33, "white");
    }

    const reineChar = characters.find((char) => char.id === 1);
    if (reineChar) {
      this.placeCharacterAtPosition(reineChar, 0, "black");
    }
  }

  placeCharacterAtPosition(character, position, team) {
    const button = this.buttons[position];
    const iconSrc = team === "white" ? character.white : character.black;

    const img = document.createElement("img");
    img.src = iconSrc;
    img.alt = character.nama;
    img.className = "character-icon";
    img.style.width = "100%";
    img.style.height = "100%";
    img.style.objectFit = "contain";
    img.style.position = "absolute";
    img.style.top = "0";
    img.style.left = "0";

    button.innerHTML = "";
    button.appendChild(img);
    button.classList.add("active");
    button.dataset.active = "true";

    this.tree[position].pasukanGambar = iconSrc;
    this.tree[position].pasukanID = character.id;

    if (team === "white") {
      this.tree[position].isConqueredByWhite = 1;
      this.tree[position].isConqueredByBlack = 0;
    } else {
      this.tree[position].isConqueredByBlack = 1;
      this.tree[position].isConqueredByWhite = 0;
    }

    // Track if NEMESIS was placed
    if (character.id === 18) {
      this.nemesisTeam = team;
    }
  }

  placeHermitCub(team) {
    const validPositions =
      team === "white" ? this.whiteStartPositions : this.blackStartPositions;

    const availablePositions = validPositions.filter(
      (pos) => this.tree[pos].pasukanID === null
    );

    if (availablePositions.length === 0) {
      console.log(`No available space to place CUB for ${team}`);
      return;
    }

    const randomIndex = Math.floor(Math.random() * availablePositions.length);
    const selectedPosition = availablePositions[randomIndex];

    const cubChar = characters.find((char) => char.id === 17);
    if (cubChar) {
      this.placeCharacterAtPosition(cubChar, selectedPosition, team);
      console.log(`CUB placed at position ${selectedPosition} for ${team}`);
    }
  }

  createMapTree() {
    const tree = [];
    for (let i = 0; i < this.positions.length; i++) {
      tree[i] = createTreeNode(i);
    }
    for (let i = 0; i < this.positions.length; i++) {
      const adjacentNodes = this.adjacencyMap[i];

      adjacentNodes.forEach((adjIndex, slot) => {
        if (slot < 6) {
          tree[i].children[slot] = tree[adjIndex];
        }
      });
    }
    return tree;
  }

  calculatePositions() {
    const positions = [];

    positions.push({ x: 50, y: 9, isCorner: true });

    positions.push({ x: 36.5, y: 16.5, isCorner: true });
    positions.push({ x: 50, y: 23, isCorner: false });
    positions.push({ x: 63.5, y: 16.5, isCorner: true });

    positions.push({ x: 23, y: 23, isCorner: true });
    positions.push({ x: 36.5, y: 30, isCorner: false });
    positions.push({ x: 50, y: 36.5, isCorner: false });
    positions.push({ x: 63.5, y: 30, isCorner: false });
    positions.push({ x: 77, y: 23, isCorner: true });

    positions.push({ x: 9.7, y: 30, isCorner: true });
    positions.push({ x: 23, y: 36.5, isCorner: false });
    positions.push({ x: 36.5, y: 43, isCorner: false });
    positions.push({ x: 50, y: 50, isCorner: false });
    positions.push({ x: 63.5, y: 43, isCorner: false });
    positions.push({ x: 77, y: 36.5, isCorner: false });
    positions.push({ x: 90.2, y: 30, isCorner: true });

    positions.push({ x: 9.7, y: 43, isCorner: true });
    positions.push({ x: 23, y: 50, isCorner: false });
    positions.push({ x: 36.5, y: 57, isCorner: false });
    positions.push({ x: 50, y: 63.5, isCorner: false });
    positions.push({ x: 63.5, y: 57, isCorner: false });
    positions.push({ x: 77, y: 50, isCorner: false });
    positions.push({ x: 90.2, y: 43, isCorner: true });

    positions.push({ x: 9.7, y: 57, isCorner: true });
    positions.push({ x: 23, y: 63.5, isCorner: false });
    positions.push({ x: 36.5, y: 70.1, isCorner: false });
    positions.push({ x: 50, y: 77, isCorner: false });
    positions.push({ x: 63.5, y: 70.1, isCorner: false });
    positions.push({ x: 77, y: 63.5, isCorner: false });
    positions.push({ x: 90.2, y: 57, isCorner: true });

    positions.push({ x: 9.7, y: 70.1, isCorner: true });
    positions.push({ x: 23, y: 77, isCorner: true });
    positions.push({ x: 36.5, y: 83.5, isCorner: true });
    positions.push({ x: 50, y: 90.5, isCorner: true });
    positions.push({ x: 63.5, y: 83.5, isCorner: true });
    positions.push({ x: 77, y: 77, isCorner: true });
    positions.push({ x: 90.2, y: 70.1, isCorner: true });

    return positions;
  }

  calculateAdjacency() {
    const adjacencyMap = {
      0: [1, 2, 3],
      1: [0, 2, 4, 5],
      2: [0, 1, 3, 5, 6, 7],
      3: [0, 2, 7, 8],
      4: [1, 5, 9, 10],
      5: [1, 2, 4, 6, 10, 11],
      6: [2, 5, 7, 11, 12, 13],
      7: [2, 3, 6, 8, 13, 14],
      8: [3, 7, 14, 15],

      9: [4, 10, 16],
      10: [4, 5, 9, 11, 16, 17],
      11: [5, 6, 10, 12, 17, 18],
      12: [6, 11, 13, 18, 19, 20],
      13: [6, 7, 12, 14, 20, 21],
      14: [7, 8, 13, 15, 21, 22],
      15: [8, 14, 22],

      16: [9, 10, 17, 23],
      17: [10, 11, 16, 18, 23, 24],
      18: [11, 12, 17, 19, 24, 25],
      19: [12, 18, 20, 25, 26, 27],
      20: [12, 13, 19, 21, 27, 28],
      21: [13, 14, 20, 22, 28, 29],
      22: [14, 15, 21, 29],

      23: [16, 17, 24, 30],
      24: [17, 18, 23, 25, 30, 31],
      25: [18, 19, 24, 26, 31, 32],
      26: [19, 25, 27, 32, 33, 34],
      27: [19, 20, 26, 28, 34, 35],
      28: [20, 21, 27, 29, 35, 36],
      29: [21, 22, 28, 36],

      30: [23, 24, 31],
      31: [24, 25, 30, 32],
      32: [25, 26, 31, 33],
      33: [26, 32, 34],
      34: [26, 27, 33, 35],
      35: [27, 28, 34, 36],
      36: [28, 29, 35],
    };

    return adjacencyMap;
  }

  init() {
    this.tree = this.createMapTree();
    this.createButtons();
    this.placeLeaders();
    this.attachEventListeners();
    this.initializeCards();
    this.initializePhasePanel();
    this.startMovementPhase();
  }

  initializePhasePanel() {
    const rightPanel = document.querySelector(".right-panel");

    if (!document.getElementById("phase-display")) {
      const phaseContainer = document.createElement("div");
      phaseContainer.className = "phase-indicator";
      phaseContainer.innerHTML = `
        <h3>Current Phase</h3>
        <div class="phase-display" id="phase-display">
          <div id="phase-name" class="phase-name">MOVE</div>
          <div id="move-counter" class="move-counter">Character 1 of 1</div>
        </div>
        <div class="character-turn-display" id="character-turn-display">
          <div id="current-character" class="current-character">Select a character</div>
        </div>
        <div class="ability-toggle" id="ability-toggle">
          <button id="use-special-btn" class="ability-btn active">Use Special Ability</button>
          <button id="use-normal-btn" class="ability-btn">Normal Move (1 Space)</button>
        </div>
        <div class="claw-toggle" id="claw-toggle" style="display: none;">
          <button id="claw-pull-btn" class="claw-btn active">Pull</button>
          <button id="claw-grab-btn" class="claw-btn">Grab</button>
        </div>
      `;

      const turnIndicator = rightPanel.querySelector(".turn-indicator");
      turnIndicator.after(phaseContainer);

      // Add event listeners for ability toggle buttons
      const useSpecialBtn = document.getElementById("use-special-btn");
      const useNormalBtn = document.getElementById("use-normal-btn");

      useSpecialBtn.addEventListener("click", () => {
        this.useSpecialAbility = true;
        useSpecialBtn.classList.add("active");
        useNormalBtn.classList.remove("active");

        if (this.selectedCharacterPosition !== null) {
          this.clearHighlights();
          this.buttons[this.selectedCharacterPosition].classList.add(
            "selected-character"
          );
          const availableMoves = this.getMovePositions(
            this.selectedCharacterPosition
          );
          this.highlightMovePositions(availableMoves);
        }
      });

      useNormalBtn.addEventListener("click", () => {
        this.useSpecialAbility = false;
        useNormalBtn.classList.add("active");
        useSpecialBtn.classList.remove("active");

        if (this.selectedCharacterPosition !== null) {
          this.clearHighlights();
          this.buttons[this.selectedCharacterPosition].classList.add(
            "selected-character"
          );
          const availableMoves = this.getMovePositions(
            this.selectedCharacterPosition
          );
          this.highlightMovePositions(availableMoves);
        }
      });

      // CLAW LAUNCHER toggle
      const clawPullBtn = document.getElementById("claw-pull-btn");
      const clawGrabBtn = document.getElementById("claw-grab-btn");

      clawPullBtn.addEventListener("click", () => {
        this.useClawGrab = false;
        clawPullBtn.classList.add("active");
        clawGrabBtn.classList.remove("active");

        if (this.selectedCharacterPosition !== null) {
          this.clearHighlights();
          this.buttons[this.selectedCharacterPosition].classList.add(
            "selected-character"
          );
          const availableMoves = this.getMovePositions(
            this.selectedCharacterPosition
          );
          this.highlightMovePositions(availableMoves);
        }
      });

      clawGrabBtn.addEventListener("click", () => {
        this.useClawGrab = true;
        clawGrabBtn.classList.add("active");
        clawPullBtn.classList.remove("active");

        if (this.selectedCharacterPosition !== null) {
          this.clearHighlights();
          this.buttons[this.selectedCharacterPosition].classList.add(
            "selected-character"
          );
          const availableMoves = this.getMovePositions(
            this.selectedCharacterPosition
          );
          this.highlightMovePositions(availableMoves);
        }
      });
    }
  }

  createButtons() {
    this.positions.forEach((pos, index) => {
      const button = document.createElement("button");
      button.className = "hex-button";
      if (pos.isCorner) {
        button.classList.add("corner");
      }
      button.style.left = `${pos.x}%`;
      button.style.top = `${pos.y}%`;
      button.dataset.index = index;
      button.dataset.active = "false";
      button.title = `Position ${index}`;

      this.board.appendChild(button);
      this.buttons.push(button);
    });
  }

  attachEventListeners() {
    this.buttons.forEach((button) => {
      button.addEventListener("click", (e) => this.handleButtonClick(e));
      button.addEventListener("mouseenter", (e) =>
        this.handleButtonHover(e, true)
      );
      button.addEventListener("mouseleave", (e) =>
        this.handleButtonHover(e, false)
      );
    });

    const resetBtn = document.getElementById("reset-btn");
    resetBtn.addEventListener("click", () => this.resetBoard());

    const cardElements = document.querySelectorAll(".playing-card");
    cardElements.forEach((card, index) => {
      card.addEventListener("click", () => this.handleCardClick(index));
    });
  }

  selectedCardIndex = null;

  handleCardClick(cardIndex) {
    if (this.currentPhase !== "recruit") {
      alert("You can only recruit during the recruitment phase!");
      return;
    }

    const cardElements = document.querySelectorAll(".playing-card");

    cardElements.forEach((card) => card.classList.remove("selected"));

    if (this.selectedCardIndex === cardIndex) {
      this.selectedCardIndex = null;
    } else {
      this.selectedCardIndex = cardIndex;
      cardElements[cardIndex].classList.add("selected");
    }
  }

  handleButtonHover(event, isHovering) {
    const button = event.target.closest(".hex-button");
    if (!button) return;

    const index = parseInt(button.dataset.index);
    const adjacentIndices = this.adjacencyMap[index];

    if (isHovering) {
      adjacentIndices.forEach((adjIndex) => {
        this.buttons[adjIndex].classList.add("adjacent");
      });
    } else {
      adjacentIndices.forEach((adjIndex) => {
        this.buttons[adjIndex].classList.remove("adjacent");
      });
    }
  }

  findLineForPosition(position) {
    for (const [lineType, lines] of Object.entries(HexagonalBoard.lines)) {
      for (const line of lines) {
        if (line.includes(position)) {
          return { lineType, line };
        }
      }
    }
    return null;
  }

  getPositionsInDirection(position, lineType, direction = 1) {
    const lines = HexagonalBoard.lines[lineType];
    for (const line of lines) {
      const index = line.indexOf(position);
      if (index !== -1) {
        if (direction === 1) {
          return line.slice(index + 1);
        } else {
          return line.slice(0, index).reverse();
        }
      }
    }
    return [];
  }

  isCornerPosition(position) {
    return this.positions[position].isCorner;
  }

  getLeaderPosition(team) {
    const leaderId = team === "white" ? 19 : 1;
    for (let i = 0; i < this.tree.length; i++) {
      if (this.tree[i].pasukanID === leaderId) {
        return i;
      }
    }
    return null;
  }

  // =========== UNTUK JAILER ===================
  isJailed(characterPos, team) {
    const adjacent = this.adjacencyMap[characterPos];

    for (const pos of adjacent) {
      const node = this.tree[pos];
      if (!node || node.pasukanID !== 13) continue;

      const jailerTeam = node.isConqueredByWhite === 1 ? "white" : "black";

      // Only enemy jailer affects you
      if (jailerTeam !== team) {
        return true;
      }
    }

    return false;
  }

  // =========== UNTUK PROTECTOR ===================
  isProtectedByProtector(targetPos, attackerTeam) {
    const adjacent = this.adjacencyMap[targetPos];

    for (const pos of adjacent) {
      const node = this.tree[pos];
      if (!node || node.pasukanID !== 14) continue;

      const protectorTeam = node.isConqueredByWhite === 1 ? "white" : "black";

      // Protector only blocks ENEMY abilities
      if (protectorTeam !== attackerTeam) {
        return true;
      }
    }

    return false;
  }

  // ================== untuk nemesis =================
  getNemesisPosition(team) {
    for (let i = 0; i < this.tree.length; i++) {
      if (this.tree[i].pasukanID === 18) {
        const nemesisTeam =
          this.tree[i].isConqueredByWhite === 1 ? "white" : "black";
        if (nemesisTeam === team) {
          return i;
        }
      }
    }
    return null;
  }

  triggerNemesisAfterLeaderMove(movingCharId) {
    const isLeader = movingCharId === 19 || movingCharId === 1;
    if (!isLeader) return false;

    const enemyTeam = this.currentTurn === "white" ? "black" : "white";
    const nemesisPos = this.getNemesisPosition(enemyTeam);

    if (nemesisPos === null) return false;
    if (this.nemesisTeam !== enemyTeam) return false;
    if (this.isNemesisIntercept) return false;

    // Simpan state sebelum intercept
    this.characterIndexBeforeNemesis = this.currentCharacterIndex + 1;
    this.charactersToMoveBeforeNemesis = [...this.teamCharactersToMove];

    // Aktifkan intercept
    this.isNemesisIntercept = true;
    this.nemesisMovesRemaining = 2;
    this.teamCharactersToMove = [nemesisPos, nemesisPos];
    this.currentCharacterIndex = 0;

    this.highlightCurrentCharacter();
    this.updatePhaseDisplay();

    return true; // 🔥 PENTING
  }

  runNemesisAI() {
    if (!this.isNemesisIntercept) return;
    if (this.currentTurn !== "white") return; // karena NEMESIS AI = milik black
    if (!this.isAIPlayer) return;

    console.log("🤖 AI controlling NEMESIS");

    const nemesisPos = this.teamCharactersToMove[this.currentCharacterIndex];
    if (nemesisPos == null) return;

    const moves = this.getMovePositions(nemesisPos);
    if (moves.length === 0) {
      // Skip kalau tidak bisa bergerak
      this.handleNemesisMoveDone();
      return;
    }

    // Pilih random / simple (NEMESIS tidak perlu minimax)
    const target = moves[Math.floor(Math.random() * moves.length)];

    this.moveCharacter(nemesisPos, target);
    this.checkWinLoseConditions();

    this.handleNemesisMoveDone();
  }

  handleNemesisMoveDone() {
    this.nemesisMovesRemaining--;

    if (this.nemesisMovesRemaining === 0) {
      // Selesai intercept
      this.isNemesisIntercept = false;

      this.teamCharactersToMove = this.charactersToMoveBeforeNemesis;
      this.currentCharacterIndex = this.characterIndexBeforeNemesis;

      this.checkWinLoseConditions();

      if (this.currentCharacterIndex >= this.teamCharactersToMove.length) {
        this.startRecruitmentPhase();
      } else {
        this.highlightCurrentCharacter();
        this.updatePhaseDisplay();
      }

      // 🔥 LANJUTKAN AI NORMAL
      if (
        this.resumeAIAfterNemesis &&
        this.gameMode === "ai" &&
        this.currentTurn === "black"
      ) {
        this.resumeAIAfterNemesis = false;
        setTimeout(() => this.runAI(), 300);
      }
    } else {
      // Next nemesis move
      this.currentCharacterIndex = 1;
      this.teamCharactersToMove[1] = this.getNemesisPosition("black");

      setTimeout(() => this.runNemesisAI(), 300);
    }
  }

  // =========== UNTUK VIZIER ===================
  hasVizier(team) {
    for (let i = 0; i < this.tree.length; i++) {
      if (this.tree[i].pasukanID === 15) {
        const vizierTeam =
          this.tree[i].isConqueredByWhite === 1 ? "white" : "black";
        if (vizierTeam === team) {
          return true;
        }
      }
    }
    return false;
  }

  // Movement Ability
  // FIXED: ACROBAT - Now allows 2 jumps over ANY character (ally or enemy) using all line types
  getAcrobatMoves(characterPos, team) {
    const moves = new Set();

    const addJumps = (
      currentPos,
      jumpsRemaining,
      visitedPositions = new Set()
    ) => {
      if (jumpsRemaining === 0) return;

      // Check all line types
      const allLines = [
        ...HexagonalBoard.lines.vertical,
        ...HexagonalBoard.lines.diagonalTopLeft,
        ...HexagonalBoard.lines.diagonalTopRight,
      ];

      for (const line of allLines) {
        const index = line.indexOf(currentPos);
        if (index === -1) continue;

        // Check both directions in this line
        for (const direction of [-1, 1]) {
          const adjacentIndex = index + direction;
          if (adjacentIndex < 0 || adjacentIndex >= line.length) continue;

          const adjPos = line[adjacentIndex];

          // Must be actually adjacent (not just in same line)
          if (!this.adjacencyMap[currentPos].includes(adjPos)) continue;

          const adjNode = this.tree[adjPos];

          // Must have a character (any character) to jump over
          if (adjNode.pasukanID !== null) {
            const landingIndex = adjacentIndex + direction;
            if (landingIndex >= 0 && landingIndex < line.length) {
              const landingPos = line[landingIndex];

              // Must be adjacent to the jumped character
              if (this.adjacencyMap[adjPos].includes(landingPos)) {
                const landingNode = this.tree[landingPos];

                // Landing position must be empty and not visited
                if (
                  landingNode.pasukanID === null &&
                  !visitedPositions.has(landingPos)
                ) {
                  moves.add(landingPos);
                  const newVisited = new Set(visitedPositions);
                  newVisited.add(landingPos);
                  addJumps(landingPos, jumpsRemaining - 1, newVisited);
                }
              }
            }
          }
        }
      }
    };

    addJumps(characterPos, 2, new Set([characterPos]));
    return Array.from(moves);
  }

  //WORKED
  getRoyalGuardMoves(team) {
    const leaderPos = this.getLeaderPosition(team);
    if (leaderPos === null) return [];

    const moves = new Set();
    const leaderAdjacent = this.adjacencyMap[leaderPos];

    for (const pos of leaderAdjacent) {
      if (this.tree[pos].pasukanID === null) {
        moves.add(pos);
      }
    }

    return Array.from(moves);
  }

  //WORKED
  getWandererMoves(characterPos, team) {
    const moves = new Set();

    for (let i = 0; i < this.tree.length; i++) {
      if (i === characterPos || this.tree[i].pasukanID !== null) {
        continue;
      }

      const adjacent = this.adjacencyMap[i];
      let hasAdjacentEnemy = false;

      for (const adjPos of adjacent) {
        const adjNode = this.tree[adjPos];
        if (adjNode.pasukanID !== null) {
          const isEnemy =
            (team === "white" && adjNode.isConqueredByBlack === 1) ||
            (team === "black" && adjNode.isConqueredByWhite === 1);

          if (isEnemy) {
            hasAdjacentEnemy = true;
            break;
          }
        }
      }

      if (!hasAdjacentEnemy) {
        moves.add(i);
      }
    }

    return Array.from(moves);
  }

  // 1. CAVALIER - Moves vertically 2 spaces in a straight line
  getCavalierMoves(characterPos) {
    const moves = new Set();

    // Find which vertical line contains this position
    const verticalLine = HexagonalBoard.lines.vertical.find((line) =>
      line.includes(characterPos)
    );

    if (!verticalLine) return [];

    const index = verticalLine.indexOf(characterPos);

    // Check 2 spaces up
    if (index - 2 >= 0) {
      const targetPos = verticalLine[index - 2];
      if (this.tree[targetPos].pasukanID === null) {
        moves.add(targetPos);
      }
    }

    // Check 2 spaces down
    if (index + 2 < verticalLine.length) {
      const targetPos = verticalLine[index + 2];
      if (this.tree[targetPos].pasukanID === null) {
        moves.add(targetPos);
      }
    }

    return Array.from(moves);
  }

  // FIXED: COGNEUR - Moves to occupied space and pushes (can't push from corners)
  getCogneurMoves(characterPos, team) {
    const moves = new Set();

    // First, add all empty adjacent positions (normal moves)
    const adjacent = this.adjacencyMap[characterPos];
    for (const adjPos of adjacent) {
      if (this.tree[adjPos].pasukanID === null) {
        moves.add(adjPos);
      }
    }

    // Check all line types for pushing opportunities
    const allLines = [
      ...HexagonalBoard.lines.vertical,
      ...HexagonalBoard.lines.diagonalTopLeft,
      ...HexagonalBoard.lines.diagonalTopRight,
    ];

    for (const line of allLines) {
      const index = line.indexOf(characterPos);
      if (index === -1) continue;

      // Check both directions in this line
      for (const direction of [-1, 1]) {
        const targetIndex = index + direction;
        if (targetIndex < 0 || targetIndex >= line.length) continue;

        const targetPos = line[targetIndex];

        // Must be adjacent to current position
        if (!adjacent.includes(targetPos)) continue;

        const targetNode = this.tree[targetPos];

        // If there's a piece at target position
        if (targetNode.pasukanID !== null) {
          // Check if target is not on a corner
          if (!this.isCornerPosition(targetPos)) {
            // Check if there's space behind the target to push to
            const pushIndex = targetIndex + direction;
            if (pushIndex >= 0 && pushIndex < line.length) {
              const pushPos = line[pushIndex];
              // Must be adjacent to target position
              if (
                this.adjacencyMap[targetPos].includes(pushPos) &&
                this.tree[pushPos].pasukanID === null
              ) {
                moves.add(targetPos);
              }
            }
          }
        }
      }
    }

    return Array.from(moves);
  }

  // FIXED: ILLUSIONIST - Switch places with non-adjacent character in same line
  getIllusionistMoves(characterPos, team) {
    const moves = new Set();
    const adjacent = this.adjacencyMap[characterPos];

    // Check all line types
    const allLines = [
      ...HexagonalBoard.lines.vertical,
      ...HexagonalBoard.lines.diagonalTopLeft,
      ...HexagonalBoard.lines.diagonalTopRight,
    ];

    for (const line of allLines) {
      const index = line.indexOf(characterPos);
      if (index === -1) continue;

      // Check all positions in this line
      for (let i = 0; i < line.length; i++) {
        if (i === index) continue; // Skip current position

        const targetPos = line[i];

        // Must not be adjacent and must have a character
        if (
          !adjacent.includes(targetPos) &&
          this.tree[targetPos].pasukanID !== null
        ) {
          moves.add(targetPos);
        }
      }
    }

    return Array.from(moves);
  }

  // UPDATED: CLAW LAUNCHER - Pull self to target OR Grab target to self
  getClawLauncherMoves(characterPos, team) {
    const moves = new Set();

    if (!this.useClawGrab) {
      // PULL MODE: Move in front of visible character
      const allLines = [
        ...HexagonalBoard.lines.vertical,
        ...HexagonalBoard.lines.diagonalTopLeft,
        ...HexagonalBoard.lines.diagonalTopRight,
      ];

      for (const line of allLines) {
        const index = line.indexOf(characterPos);
        if (index === -1) continue;

        // Search forward
        let firstCharacterForward = null;
        for (let i = index + 1; i < line.length; i++) {
          const pos = line[i];
          const node = this.tree[pos];

          if (node.pasukanID !== null) {
            firstCharacterForward = i;
            break;
          }
        }

        if (
          firstCharacterForward !== null &&
          firstCharacterForward > index + 1
        ) {
          moves.add(line[firstCharacterForward - 1]);
        }

        // Search backward
        let firstCharacterBackward = null;
        for (let i = index - 1; i >= 0; i--) {
          const pos = line[i];
          const node = this.tree[pos];

          if (node.pasukanID !== null) {
            firstCharacterBackward = i;
            break;
          }
        }

        if (
          firstCharacterBackward !== null &&
          firstCharacterBackward < index - 1
        ) {
          moves.add(line[firstCharacterBackward + 1]);
        }
      }
    } else {
      // GRAB MODE: Target adjacent to where claw launcher can see a character
      const allLines = [
        ...HexagonalBoard.lines.vertical,
        ...HexagonalBoard.lines.diagonalTopLeft,
        ...HexagonalBoard.lines.diagonalTopRight,
      ];

      for (const line of allLines) {
        const index = line.indexOf(characterPos);
        if (index === -1) continue;

        // Search forward for a character to grab
        for (let i = index + 1; i < line.length; i++) {
          const pos = line[i];
          const node = this.tree[pos];

          if (node.pasukanID !== null) {
            // Position right next to claw launcher towards the target
            if (i > index + 1) {
              moves.add(line[index + 1]);
            }
            break;
          }
        }

        // Search backward for a character to grab
        for (let i = index - 1; i >= 0; i--) {
          const pos = line[i];
          const node = this.tree[pos];

          if (node.pasukanID !== null) {
            // Position right next to claw launcher towards the target
            if (i < index - 1) {
              moves.add(line[index - 1]);
            }
            break;
          }
        }
      }
    }

    return Array.from(moves);
  }

  // FIXED: MANIPULATOR - Moves enemy in line of sight to adjacent empty space (NOT adjacent to manipulator)
  getManipulatorMoves(characterPos, team) {
    const moves = new Set();
    const manipulatorAdjacent = this.adjacencyMap[characterPos];

    // Check all line types
    const allLines = [
      ...HexagonalBoard.lines.vertical,
      ...HexagonalBoard.lines.diagonalTopLeft,
      ...HexagonalBoard.lines.diagonalTopRight,
    ];

    for (const line of allLines) {
      const index = line.indexOf(characterPos);
      if (index === -1) continue;

      // Search in both directions along the line
      for (let i = 0; i < line.length; i++) {
        if (i === index) continue;

        const targetPos = line[i];
        const targetNode = this.tree[targetPos];

        // Must have an enemy character and NOT be adjacent to manipulator
        if (
          targetNode.pasukanID !== null &&
          !manipulatorAdjacent.includes(targetPos)
        ) {
          const isEnemy =
            (team === "white" && targetNode.isConqueredByBlack === 1) ||
            (team === "black" && targetNode.isConqueredByWhite === 1);

          if (isEnemy) {
            // Find adjacent empty positions to this enemy
            const enemyAdjacent = this.adjacencyMap[targetPos];
            for (const adjPos of enemyAdjacent) {
              if (this.tree[adjPos].pasukanID === null) {
                moves.add(adjPos);
              }
            }
          }
        }
      }
    }

    return Array.from(moves);
  }

  // FIXED: BREWMASTER - Moves adjacent ally to adjacent empty space
  getBrewmasterMoves(characterPos, team) {
    const moves = new Set();
    const adjacent = this.adjacencyMap[characterPos];

    for (const adjPos of adjacent) {
      const adjNode = this.tree[adjPos];

      if (adjNode.pasukanID !== null) {
        const isAlly =
          (team === "white" && adjNode.isConqueredByWhite === 1) ||
          (team === "black" && adjNode.isConqueredByBlack === 1);

        if (isAlly) {
          // Find adjacent empty positions to this ally
          const allyAdjacent = this.adjacencyMap[adjPos];
          for (const allyAdjPos of allyAdjacent) {
            if (this.tree[allyAdjPos].pasukanID === null) {
              moves.add(allyAdjPos);
            }
          }
        }
      }
    }

    return Array.from(moves);
  }

  getSpecialMovePositions(characterPos) {
    const node = this.tree[characterPos];
    const character = characters.find((c) => c.id === node.pasukanID);

    if (!character) return [];

    const team = node.isConqueredByWhite === 1 ? "white" : "black";
    let specialMoves = [];

    switch (character.id) {
      case 2:
        specialMoves = this.getAcrobatMoves(characterPos, team);
        break;
      case 3:
        specialMoves = this.getCavalierMoves(characterPos);
        break;
      case 4:
        specialMoves = this.getCogneurMoves(characterPos, team);
        break;
      case 5:
        specialMoves = this.getRoyalGuardMoves(team);
        break;
      case 6:
        specialMoves = this.getIllusionistMoves(characterPos, team);
        break;
      case 7:
        specialMoves = this.getClawLauncherMoves(characterPos, team);
        break;
      case 8:
        specialMoves = this.getManipulatorMoves(characterPos, team);
        break;
      case 9:
        specialMoves = this.getWandererMoves(characterPos, team);
        break;
      case 10:
        specialMoves = this.getBrewmasterMoves(characterPos, team);
        break;
      default:
        specialMoves = this.getAvailableMovePositions(characterPos);
    }

    return specialMoves;
  }

  // New method to get moves based on current ability toggle
  getMovePositions(characterPos) {
    const node = this.tree[characterPos];
    if (!node || node.pasukanID === null) return [];
    const team = node.isConqueredByWhite === 1 ? "white" : "black";

    // 🔒 JAILER CHECK
    const jailed = this.isJailed(characterPos, team);

    if (jailed) {
      // Force NORMAL MOVE ONLY
      return this.getAvailableMovePositions(characterPos);
    }

    // Normal logic
    if (this.useSpecialAbility) {
      return this.getSpecialMovePositions(characterPos);
    } else {
      return this.getAvailableMovePositions(characterPos);
    }
  }

  getTeamCharacterPositions(team) {
    const positions = [];
    for (let i = 0; i < this.tree.length; i++) {
      if (
        team === "white" &&
        this.tree[i].isConqueredByWhite === 1 &&
        this.tree[i].pasukanID !== null
      ) {
        positions.push(i);
      } else if (
        team === "black" &&
        this.tree[i].isConqueredByBlack === 1 &&
        this.tree[i].pasukanID !== null
      ) {
        positions.push(i);
      }
    }
    return positions;
  }

  getAvailableMovePositions(fromPosition) {
    const adjacentPositions = this.adjacencyMap[fromPosition];
    return adjacentPositions.filter((pos) => this.tree[pos].pasukanID === null);
  }

  canCharacterMove(position) {
    return this.getAvailableMovePositions(position).length > 0;
  }

  // NEW: Update character positions after displacement abilities
  updateCharacterPositionsAfterDisplacement() {
    // Get fresh positions for all team characters
    const updatedPositions = this.getTeamCharacterPositions(this.currentTurn);

    // Filter out NEMESIS from regular movement
    this.teamCharactersToMove = updatedPositions.filter((pos) => {
      return this.tree[pos].pasukanID !== 18;
    });
  }

  // UPDATED: moveCharacter to handle special abilities properly and update positions
  moveCharacter(fromPosition, toPosition) {
    const node = this.tree[fromPosition];
    const character = characters.find((c) => c.id === node.pasukanID);

    if (!character) return false;

    const team = node.isConqueredByWhite === 1 ? "white" : "black";
    const targetNode = this.tree[toPosition];

    let positionsChanged = false; // Track if any character was displaced

    // Handle special abilities that involve other characters
    if (this.useSpecialAbility) {
      // ILLUSIONIST - Swap positions
      if (character.id === 6 && targetNode.pasukanID !== null) {
        const targetCharacter = characters.find(
          (c) => c.id === targetNode.pasukanID
        );
        const targetTeam =
          targetNode.isConqueredByWhite === 1 ? "white" : "black";

        // Clear both positions
        this.buttons[fromPosition].innerHTML = "";
        this.buttons[fromPosition].classList.remove(
          "active",
          "selected-character"
        );
        this.buttons[fromPosition].dataset.active = "false";
        this.tree[fromPosition].pasukanGambar = null;
        this.tree[fromPosition].pasukanID = null;
        this.tree[fromPosition].isConqueredByWhite = 0;
        this.tree[fromPosition].isConqueredByBlack = 0;

        this.buttons[toPosition].innerHTML = "";
        this.buttons[toPosition].classList.remove("active");
        this.buttons[toPosition].dataset.active = "false";
        this.tree[toPosition].pasukanGambar = null;
        this.tree[toPosition].pasukanID = null;
        this.tree[toPosition].isConqueredByWhite = 0;
        this.tree[toPosition].isConqueredByBlack = 0;

        // Place characters in swapped positions
        this.placeCharacterAtPosition(character, toPosition, team);
        this.placeCharacterAtPosition(
          targetCharacter,
          fromPosition,
          targetTeam
        );

        positionsChanged = true; // Positions changed

        // FIXED: Update both positions in the movement queue
        // Update ILLUSIONIST's current position
        if (this.currentCharacterIndex < this.teamCharactersToMove.length) {
          this.teamCharactersToMove[this.currentCharacterIndex] = toPosition;
        }

        // Update swapped ally's position if it's in the queue and hasn't moved yet
        for (
          let i = this.currentCharacterIndex + 1;
          i < this.teamCharactersToMove.length;
          i++
        ) {
          if (this.teamCharactersToMove[i] === toPosition) {
            this.teamCharactersToMove[i] = fromPosition;
            break;
          }
        }

        // ASSASSIN passive check after move
        if (character.id === 12) {
          this.checkAssassinKill(toPosition);
        }

        // DO NOT call updateCharacterPositionsAfterDisplacement for ILLUSIONIST
        // because the swapped ally should keep its original turn order
        // Only the positions need to be updated in the array (already done above)

        return true;
      }

      // COGNEUR - Push character
      if (character.id === 4 && targetNode.pasukanID !== null) {
        // Find the line and direction
        const allLines = [
          ...HexagonalBoard.lines.vertical,
          ...HexagonalBoard.lines.diagonalTopLeft,
          ...HexagonalBoard.lines.diagonalTopRight,
        ];

        for (const line of allLines) {
          const fromIndex = line.indexOf(fromPosition);
          const toIndex = line.indexOf(toPosition);

          if (fromIndex !== -1 && toIndex !== -1) {
            const direction = toIndex > fromIndex ? 1 : -1;
            const pushIndex = toIndex + direction;

            if (pushIndex >= 0 && pushIndex < line.length) {
              const pushPos = line[pushIndex];

              if (this.tree[pushPos].pasukanID === null) {
                // Move the target character to push position
                const pushedCharacter = characters.find(
                  (c) => c.id === targetNode.pasukanID
                );
                const pushedTeam =
                  targetNode.isConqueredByWhite === 1 ? "white" : "black";

                // Clear target position
                this.buttons[toPosition].innerHTML = "";
                this.buttons[toPosition].classList.remove("active");
                this.buttons[toPosition].dataset.active = "false";
                this.tree[toPosition].pasukanGambar = null;
                this.tree[toPosition].pasukanID = null;
                this.tree[toPosition].isConqueredByWhite = 0;
                this.tree[toPosition].isConqueredByBlack = 0;

                // Place pushed character at push position
                this.placeCharacterAtPosition(
                  pushedCharacter,
                  pushPos,
                  pushedTeam
                );

                positionsChanged = true; // Positions changed

                // Now move cogneur to target position
                this.buttons[fromPosition].innerHTML = "";
                this.buttons[fromPosition].classList.remove(
                  "active",
                  "selected-character"
                );
                this.buttons[fromPosition].dataset.active = "false";
                this.tree[fromPosition].pasukanGambar = null;
                this.tree[fromPosition].pasukanID = null;
                this.tree[fromPosition].isConqueredByWhite = 0;
                this.tree[fromPosition].isConqueredByBlack = 0;

                this.placeCharacterAtPosition(character, toPosition, team);

                // Update positions if displacement occurred
                if (positionsChanged) {
                  this.updateCharacterPositionsAfterDisplacement();
                }

                return true;
              }
            }
            break;
          }
        }
      }

      // CLAW LAUNCHER - Pull self or Grab target
      if (character.id === 7) {
        if (!this.useClawGrab) {
          // PULL MODE: Claw launcher moves to position
          this.buttons[fromPosition].innerHTML = "";
          this.buttons[fromPosition].classList.remove(
            "active",
            "selected-character"
          );
          this.buttons[fromPosition].dataset.active = "false";
          this.tree[fromPosition].pasukanGambar = null;
          this.tree[fromPosition].pasukanID = null;
          this.tree[fromPosition].isConqueredByWhite = 0;
          this.tree[fromPosition].isConqueredByBlack = 0;

          this.placeCharacterAtPosition(character, toPosition, team);
          return true;
        } else {
          // GRAB MODE: Target moves to position next to claw launcher
          const allLines = [
            ...HexagonalBoard.lines.vertical,
            ...HexagonalBoard.lines.diagonalTopLeft,
            ...HexagonalBoard.lines.diagonalTopRight,
          ];

          for (const line of allLines) {
            const fromIndex = line.indexOf(fromPosition);
            const toIndex = line.indexOf(toPosition);

            if (fromIndex !== -1 && toIndex !== -1) {
              // Find the target character
              let targetCharPos = null;
              let direction = 0;

              if (toIndex > fromIndex) {
                // Search forward from claw
                direction = 1;
                for (let i = fromIndex + 1; i < line.length; i++) {
                  if (this.tree[line[i]].pasukanID !== null) {
                    targetCharPos = line[i];
                    break;
                  }
                }
              } else {
                // Search backward from claw
                direction = -1;
                for (let i = fromIndex - 1; i >= 0; i--) {
                  if (this.tree[line[i]].pasukanID !== null) {
                    targetCharPos = line[i];
                    break;
                  }
                }
              }

              if (targetCharPos !== null) {
                // PROTECTOR CHECK (block grab)
                if (this.isProtectedByProtector(targetCharPos, team)) {
                  return false;
                }

                const targetCharNode = this.tree[targetCharPos];
                const targetCharacter = characters.find(
                  (c) => c.id === targetCharNode.pasukanID
                );
                const targetCharTeam =
                  targetCharNode.isConqueredByWhite === 1 ? "white" : "black";

                // Clear target's original position
                this.buttons[targetCharPos].innerHTML = "";
                this.buttons[targetCharPos].classList.remove("active");
                this.buttons[targetCharPos].dataset.active = "false";
                this.tree[targetCharPos].pasukanGambar = null;
                this.tree[targetCharPos].pasukanID = null;
                this.tree[targetCharPos].isConqueredByWhite = 0;
                this.tree[targetCharPos].isConqueredByBlack = 0;

                // Place target at toPosition (next to claw launcher)
                this.placeCharacterAtPosition(
                  targetCharacter,
                  toPosition,
                  targetCharTeam
                );

                positionsChanged = true; // Positions changed

                // Update positions if displacement occurred
                if (positionsChanged) {
                  this.updateCharacterPositionsAfterDisplacement();
                }

                // Claw launcher stays in place
                return true;
              }
              break;
            }
          }
        }
      }

      // MANIPULATOR - Move enemy character
      if (character.id === 8) {
        // Find the enemy character in line of sight
        const allLines = [
          ...HexagonalBoard.lines.vertical,
          ...HexagonalBoard.lines.diagonalTopLeft,
          ...HexagonalBoard.lines.diagonalTopRight,
        ];

        for (const line of allLines) {
          const fromIndex = line.indexOf(fromPosition);

          if (fromIndex !== -1) {
            for (let i = 0; i < line.length; i++) {
              if (i === fromIndex) continue;

              const enemyPos = line[i];
              // PROTECTOR CHECK (block manipulation)
              if (this.isProtectedByProtector(enemyPos, team)) {
                return false;
              }

              const enemyNode = this.tree[enemyPos];

              if (enemyNode.pasukanID !== null) {
                const isEnemy =
                  (team === "white" && enemyNode.isConqueredByBlack === 1) ||
                  (team === "black" && enemyNode.isConqueredByWhite === 1);

                if (isEnemy) {
                  // Check if toPosition is adjacent to this enemy
                  if (this.adjacencyMap[enemyPos].includes(toPosition)) {
                    const enemyCharacter = characters.find(
                      (c) => c.id === enemyNode.pasukanID
                    );
                    const enemyTeam =
                      enemyNode.isConqueredByWhite === 1 ? "white" : "black";

                    // Clear enemy's original position
                    this.buttons[enemyPos].innerHTML = "";
                    this.buttons[enemyPos].classList.remove("active");
                    this.buttons[enemyPos].dataset.active = "false";
                    this.tree[enemyPos].pasukanGambar = null;
                    this.tree[enemyPos].pasukanID = null;
                    this.tree[enemyPos].isConqueredByWhite = 0;
                    this.tree[enemyPos].isConqueredByBlack = 0;

                    // Place enemy at new position
                    this.placeCharacterAtPosition(
                      enemyCharacter,
                      toPosition,
                      enemyTeam
                    );

                    positionsChanged = true; // Positions changed

                    // Update positions if displacement occurred
                    if (positionsChanged) {
                      this.updateCharacterPositionsAfterDisplacement();
                    }

                    // Manipulator stays in place
                    return true;
                  }
                }
              }
            }
          }
        }
      }

      // BREWMASTER - Move adjacent ally
      if (character.id === 10) {
        const adjacent = this.adjacencyMap[fromPosition];

        for (const adjPos of adjacent) {
          const adjNode = this.tree[adjPos];

          if (adjNode.pasukanID !== null) {
            const isAlly =
              (team === "white" && adjNode.isConqueredByWhite === 1) ||
              (team === "black" && adjNode.isConqueredByBlack === 1);

            if (isAlly) {
              // PROTECTOR CHECK (block ally move)
              if (this.isProtectedByProtector(adjPos, team)) {
                return false;
              }
              // Check if toPosition is adjacent to this ally
              if (this.adjacencyMap[adjPos].includes(toPosition)) {
                const allyCharacter = characters.find(
                  (c) => c.id === adjNode.pasukanID
                );

                // Clear ally's original position
                this.buttons[adjPos].innerHTML = "";
                this.buttons[adjPos].classList.remove("active");
                this.buttons[adjPos].dataset.active = "false";
                this.tree[adjPos].pasukanGambar = null;
                this.tree[adjPos].pasukanID = null;
                this.tree[adjPos].isConqueredByWhite = 0;
                this.tree[adjPos].isConqueredByBlack = 0;

                // Place ally at new position
                this.placeCharacterAtPosition(allyCharacter, toPosition, team);

                positionsChanged = true; // Positions changed

                // Update positions if displacement occurred
                if (positionsChanged) {
                  this.updateCharacterPositionsAfterDisplacement();
                }

                // Brewmaster stays in place
                return true;
              }
            }
          }
        }
      }
    }

    // Normal move (or special abilities that just move the character normally)
    this.buttons[fromPosition].innerHTML = "";
    this.buttons[fromPosition].classList.remove("active", "selected-character");
    this.buttons[fromPosition].dataset.active = "false";
    this.tree[fromPosition].pasukanGambar = null;
    this.tree[fromPosition].pasukanID = null;
    this.tree[fromPosition].isConqueredByWhite = 0;
    this.tree[fromPosition].isConqueredByBlack = 0;

    this.placeCharacterAtPosition(character, toPosition, team);

    return true;
  }

  highlightMovePositions(positions) {
    this.buttons.forEach((btn) => btn.classList.remove("move-target"));

    positions.forEach((pos) => {
      this.buttons[pos].classList.add("move-target");
    });
  }

  clearHighlights() {
    this.buttons.forEach((btn) => {
      btn.classList.remove("move-target", "selected-character", "can-move");
    });
  }

  highlightCurrentCharacter() {
    this.clearHighlights();

    if (this.currentCharacterIndex < this.teamCharactersToMove.length) {
      const characterPos =
        this.teamCharactersToMove[this.currentCharacterIndex];
      this.buttons[characterPos].classList.add("can-move");
    }
  }

  updatePhaseDisplay() {
    const phaseNameEl = document.getElementById("phase-name");
    const moveCounterEl = document.getElementById("move-counter");
    const currentCharEl = document.getElementById("current-character");
    const abilityToggle = document.getElementById("ability-toggle");
    const clawToggle = document.getElementById("claw-toggle");

    if (phaseNameEl) {
      if (this.isNemesisIntercept) {
        phaseNameEl.textContent = "NEMESIS INTERCEPT";
        phaseNameEl.className = "phase-name nemesis";
      } else {
        phaseNameEl.textContent = this.currentPhase.toUpperCase();
        phaseNameEl.className = `phase-name ${this.currentPhase}`;
      }
    }

    if (moveCounterEl) {
      if (this.currentPhase === "move") {
        if (this.isNemesisIntercept) {
          moveCounterEl.textContent = `Intercept Move ${
            3 - this.nemesisMovesRemaining
          } of 2`;
        } else {
          const totalCharacters = this.teamCharactersToMove.length;
          const currentCharNum = this.currentCharacterIndex + 1;
          moveCounterEl.textContent = `Character ${currentCharNum} of ${totalCharacters}`;
        }
      } else {
        moveCounterEl.textContent = "Recruitment Phase";
      }
    }

    if (currentCharEl) {
      if (this.currentPhase === "move") {
        if (this.isNemesisIntercept) {
          currentCharEl.textContent = `NEMESIS is intercepting! (${this.nemesisMovesRemaining} moves remaining)`;
        } else if (
          this.currentCharacterIndex < this.teamCharactersToMove.length
        ) {
          const charPos = this.teamCharactersToMove[this.currentCharacterIndex];
          const charId = this.tree[charPos].pasukanID;
          const character = characters.find((c) => c.id === charId);
          currentCharEl.textContent = `Move: ${
            character ? character.nama : "Unknown"
          } (Pos ${charPos})`;
        } else {
          currentCharEl.textContent = "All characters have moved";
        }
      } else {
        currentCharEl.textContent =
          "Select a card, then click a valid position";
      }
    }

    // Show/hide ability toggle based on phase and NEMESIS intercept
    if (abilityToggle) {
      abilityToggle.style.display =
        this.currentPhase === "move" && !this.isNemesisIntercept
          ? "block"
          : "none";
    }

    // Show CLAW LAUNCHER toggle ONLY if current character is CLAW LAUNCHER (id: 7) AND it's the current character's turn AND not during NEMESIS intercept
    if (clawToggle) {
      if (
        this.currentPhase === "move" &&
        !this.isNemesisIntercept &&
        this.currentCharacterIndex < this.teamCharactersToMove.length
      ) {
        const charPos = this.teamCharactersToMove[this.currentCharacterIndex];
        const charId = this.tree[charPos].pasukanID;
        clawToggle.style.display = charId === 7 ? "block" : "none";
      } else {
        clawToggle.style.display = "none";
      }
    }
  }

  // FIXED: Check win/lose conditions immediately after each character moves
  checkWinLoseConditions() {
    // Check both leaders
    const whiteLeaderPos = this.getLeaderPosition("white");
    const blackLeaderPos = this.getLeaderPosition("black");

    if (whiteLeaderPos === null || blackLeaderPos === null) {
      return; // Leaders not found
    }

    // Check each leader
    this.checkLeaderLoseConditions(whiteLeaderPos, "white");
    this.checkLeaderLoseConditions(blackLeaderPos, "black");
  }

  checkLeaderLoseConditions(leaderPos, team) {
    const enemyTeam = team === "white" ? "black" : "white";

    // a. Check if adjacent to ASSASSIN (id: 12)
    const adjacent = this.adjacencyMap[leaderPos];
    for (const pos of adjacent) {
      const node = this.tree[pos];
      if (node.pasukanID === 12) {
        const assassinTeam = node.isConqueredByWhite === 1 ? "white" : "black";
        if (assassinTeam === enemyTeam) {
          alert(
            `${enemyTeam.toUpperCase()} WINS!\n${team.toUpperCase()} Leader is adjacent to enemy ASSASSIN!`
          );
          location.reload();
          return;
        }
      }
    }

    // b. Check if 2 opponent characters adjacent (FIXED: Archer cannot capture if adjacent)
    let adjacentEnemies = 0;
    let adjacentNonArcherEnemies = 0;

    for (const pos of adjacent) {
      const node = this.tree[pos];
      if (node.pasukanID !== null) {
        const nodeTeam = node.isConqueredByWhite === 1 ? "white" : "black";
        if (nodeTeam === enemyTeam) {
          adjacentEnemies++;
          // Only count if it's NOT an archer
          if (node.pasukanID !== 11) {
            adjacentNonArcherEnemies++;
          }
        }
      }
    }

    // If 2 non-archer enemies are adjacent, it's a capture
    if (adjacentNonArcherEnemies >= 2) {
      alert(
        `${enemyTeam.toUpperCase()} WINS!\n${team.toUpperCase()} Leader is captured by 2 adjacent enemies!`
      );
      location.reload();
      return;
    }

    // c. Check for ARCHER support (only with 1+ non-archer enemy adjacent AND archer 2 tiles away)
    if (
      adjacentNonArcherEnemies >= 1 &&
      this.checkArcherSupport(leaderPos, enemyTeam)
    ) {
      alert(
        `${enemyTeam.toUpperCase()} WINS!\n${team.toUpperCase()} Leader is captured with ARCHER support!`
      );
      location.reload();
      return;
    }

    // d. Check if leader can't move (all adjacent filled)
    let canMove = false;
    for (const pos of adjacent) {
      if (this.tree[pos].pasukanID === null) {
        canMove = true;
        break;
      }
    }

    if (!canMove) {
      alert(
        `${enemyTeam.toUpperCase()} WINS!\n${team.toUpperCase()} Leader cannot move!`
      );
      location.reload();
      return;
    }
  }

  // Helper function to check for ARCHER support
  checkArcherSupport(leaderPos, enemyTeam) {
    const linesToCheck = [
      ...HexagonalBoard.lines.vertical,
      ...HexagonalBoard.lines.diagonalTopRight,
      ...HexagonalBoard.lines.diagonalTopLeft,
    ];

    for (const line of linesToCheck) {
      const index = line.indexOf(leaderPos);
      if (index === -1) continue;

      // Check 2 positions away in both directions
      for (const direction of [-1, 1]) {
        const targetIndex = index + direction * 2;
        if (targetIndex >= 0 && targetIndex < line.length) {
          const targetPos = line[targetIndex];
          const node = this.tree[targetPos];

          if (node.pasukanID === 11) {
            // ARCHER id
            const archerTeam =
              node.isConqueredByWhite === 1 ? "white" : "black";
            if (archerTeam === enemyTeam) {
              return true;
            }
          }
        }
      }
    }
    return false;
  }

  moveToNextCharacter() {
    this.currentCharacterIndex++;

    // Check if we've just finished moving all regular characters
    if (this.currentCharacterIndex >= this.teamCharactersToMove.length) {
      // Check if last moved character was the leader
      const lastCharPos =
        this.teamCharactersToMove[this.teamCharactersToMove.length - 1];
      const lastCharId = this.tree[lastCharPos].pasukanID;
      const lastCharIsLeader = lastCharId === 19 || lastCharId === 1;

      // Check if the other team has NEMESIS and it belongs to them
      const enemyTeam = this.currentTurn === "white" ? "black" : "white";
      const nemesisPos = this.getNemesisPosition(enemyTeam);

      // No NEMESIS intercept, proceed to recruitment
      this.startRecruitmentPhase();
    } else {
      this.highlightCurrentCharacter();
      this.updatePhaseDisplay();

      // Reset to special ability for next character
      this.useSpecialAbility = true;
      this.useClawGrab = false;
      const useSpecialBtn = document.getElementById("use-special-btn");
      const useNormalBtn = document.getElementById("use-normal-btn");
      const clawPullBtn = document.getElementById("claw-pull-btn");
      const clawGrabBtn = document.getElementById("claw-grab-btn");
      if (useSpecialBtn && useNormalBtn) {
        useSpecialBtn.classList.add("active");
        useNormalBtn.classList.remove("active");
      }
      if (clawPullBtn && clawGrabBtn) {
        clawPullBtn.classList.add("active");
        clawGrabBtn.classList.remove("active");
      }
    }
  }

  startMovementPhase() {
    this.currentPhase = "move";
    // Get fresh character positions each time and exclude NEMESIS from normal turn
    let allCharacters = this.getTeamCharacterPositions(this.currentTurn);

    // Filter out NEMESIS from regular movement
    this.teamCharactersToMove = allCharacters.filter((pos) => {
      return this.tree[pos].pasukanID !== 18;
    });

    this.currentCharacterIndex = 0;
    this.selectedCharacterPosition = null;
    this.movedCharacters.clear();

    this.useSpecialAbility = true;
    this.useClawGrab = false;
    this.isNemesisIntercept = false;
    this.nemesisMovesRemaining = 0;
    this.vizierBonusUsed = false;

    // Reset ability toggle buttons
    const useSpecialBtn = document.getElementById("use-special-btn");
    const useNormalBtn = document.getElementById("use-normal-btn");
    const clawPullBtn = document.getElementById("claw-pull-btn");
    const clawGrabBtn = document.getElementById("claw-grab-btn");
    if (useSpecialBtn && useNormalBtn) {
      useSpecialBtn.classList.add("active");
      useNormalBtn.classList.remove("active");
    }
    if (clawPullBtn && clawGrabBtn) {
      clawPullBtn.classList.add("active");
      clawGrabBtn.classList.remove("active");
    }

    if (this.teamCharactersToMove.length === 0) {
      this.startRecruitmentPhase();
    } else {
      this.highlightCurrentCharacter();
      this.updatePhaseDisplay();
    }
  }

  startRecruitmentPhase() {
    const currentRecruitmentTurns =
      this.currentTurn === "white"
        ? this.whiteRecruitmentTurns
        : this.blackRecruitmentTurns;

    if (currentRecruitmentTurns >= this.maxRecruitmentTurns) {
      this.endTurn();
      return;
    }

    this.currentPhase = "recruit";
    this.selectedCharacterPosition = null;
    this.clearHighlights();
    this.updatePhaseDisplay();

    // AI auto recruitment if it's black team and AI mode
    if (this.gameMode === "ai" && this.currentTurn === "black") {
      this.aiAutoRecruit();
    }
  }

  // NEW: AI auto recruitment for black team
  aiAutoRecruit() {
    // Wait a moment for visual clarity
    setTimeout(() => {
      const currentCards = this.currentCards;

      // Find the character with highest poin
      let highestPoin = -1;
      const charactersWithHighestPoin = [];

      for (let i = 0; i < currentCards.length; i++) {
        const poin = currentCards[i]?.poin || 0;
        if (poin > highestPoin) {
          highestPoin = poin;
          charactersWithHighestPoin.length = 0;
          charactersWithHighestPoin.push(i);
        } else if (poin === highestPoin && poin >= 0) {
          charactersWithHighestPoin.push(i);
        }
      }

      // Randomly pick one if there's a tie
      const selectedCharIndex =
        charactersWithHighestPoin[
          Math.floor(Math.random() * charactersWithHighestPoin.length)
        ];

      // Get valid positions for black team
      const validPositions = this.blackStartPositions.filter(
        (pos) => this.tree[pos].pasukanID === null
      );

      if (validPositions.length === 0) {
        // No valid position, end turn
        this.endTurn();
        return;
      }

      // Randomly select a valid position
      const randomPosition =
        validPositions[Math.floor(Math.random() * validPositions.length)];

      // Perform the recruitment
      this.selectedCardIndex = selectedCharIndex;
      const character = this.currentCards[selectedCharIndex];
      if (character) {
        this.placeCharacterAtPosition(character, randomPosition, "black");

        if (character.id === 16) {
          this.placeHermitCub("black");
        }

        this.blackRecruitmentTurns++;

        const newCharacter = this.getRandomCharacter();
        if (newCharacter) {
          this.currentCards[selectedCharIndex] = newCharacter;
          this.updateCardDisplay(selectedCharIndex, newCharacter);
        }

        const cardElements = document.querySelectorAll(".playing-card");
        cardElements.forEach((card) => card.classList.remove("selected"));
        this.selectedCardIndex = null;
      }

      // End turn
      this.endTurn();
    }, 500);
  }

  checkPostLeaderMoveEffects(leaderPos) {
    // ARCHER SUPPORT (removed - now checked in checkWinLoseConditions)
    // Keeping this method in case other effects need to be added
  }

  handleButtonClick(event) {
    const button = event.target.closest(".hex-button");
    if (!button) return;

    const index = parseInt(button.dataset.index);
    this.tree[index].fungsiTest("General Click: ");

    if (this.currentPhase === "move") {
      this.handleMovePhaseClick(index);
    } else if (this.currentPhase === "recruit") {
      this.handleRecruitPhaseClick(index);
    }
  }

  handleMovePhaseClick(index) {
    if (this.currentCharacterIndex >= this.teamCharactersToMove.length) {
      alert("All characters have moved!");
      return;
    }

    const expectedCharPos =
      this.teamCharactersToMove[this.currentCharacterIndex];
    const node = this.tree[index];

    if (index === expectedCharPos && node.pasukanID !== null) {
      // 🔁 FULL RESET SELECTION STATE
      this.selectedCharacterPosition = null;
      this.clearHighlights();

      this.selectedCharacterPosition = index;

      // ASSASSIN passive (tetap)
      if (node.pasukanID === 12) {
        this.checkAssassinKill(index);
      }

      // 🔁 RE-EVALUATE JAILER STATE HERE
      const availableMoves = this.getMovePositions(index);

      this.buttons[index].classList.add("selected-character");
      this.highlightMovePositions(availableMoves);
      this.updatePhaseDisplay();

      return;
    } else if (this.selectedCharacterPosition !== null) {
      const availableMoves = this.getMovePositions(
        this.selectedCharacterPosition
      );

      if (availableMoves.includes(index)) {
        const fromPos = this.selectedCharacterPosition;
        const movingCharId = this.tree[fromPos].pasukanID;

        this.moveCharacter(fromPos, index);
        this.selectedCharacterPosition = null;
        this.clearHighlights();

        const isLeaders = movingCharId === 19 || movingCharId === 1;

        if (isLeaders) {
          this.checkPostLeaderMoveEffects(index);
        }

        // CHECK WIN/LOSE CONDITIONS IMMEDIATELY AFTER THIS MOVE
        this.checkWinLoseConditions();

        if (this.triggerNemesisAfterLeaderMove(movingCharId)) {
          return; // ⛔ stop flow normal
        }

        // ===== VIZIER CHECK (AFTER LEADER MOVE) =====
        const isLeader = movingCharId === 19 || movingCharId === 1;

        if (
          isLeader &&
          this.hasVizier(this.currentTurn) &&
          !this.vizierBonusUsed
        ) {
          this.teamCharactersToMove.splice(
            this.currentCharacterIndex + 1,
            0,
            index
          );

          this.vizierBonusUsed = true;
        }

        // 🔁 Board changed → force ability re-evaluation
        this.updatePhaseDisplay();

        if (this.isNemesisIntercept) {
          this.nemesisMovesRemaining--;
          if (this.nemesisMovesRemaining === 0) {
            this.isNemesisIntercept = false;

            // FIXED: Restore pre-NEMESIS state and continue from where we left off
            // Do NOT go to recruitment, continue with remaining characters
            this.teamCharactersToMove = this.charactersToMoveBeforeNemesis;
            this.currentCharacterIndex = this.characterIndexBeforeNemesis;

            // CHECK WIN/LOSE CONDITIONS AFTER NEMESIS INTERCEPT
            this.checkWinLoseConditions();

            // Check if all characters have moved after NEMESIS intercept
            if (
              this.currentCharacterIndex >= this.teamCharactersToMove.length
            ) {
              this.startRecruitmentPhase();
            } else {
              // Continue with remaining characters
              this.highlightCurrentCharacter();
              this.updatePhaseDisplay();
            }

            // ===== RESUME AI AFTER NEMESIS (FIX FINAL) =====
            if (
              this.resumeAIAfterNemesis &&
              this.gameMode === "ai" &&
              this.currentTurn === "black"
            ) {
              this.resumeAIAfterNemesis = false;

              setTimeout(() => {
                this.runAI();
              }, 300);
            }
          } else {
            this.currentCharacterIndex++;
            // GET UPDATED NEMESIS POSITION FOR NEXT MOVE
            const enemyTeam = this.currentTurn === "white" ? "black" : "white";
            const updatedNemesisPos = this.getNemesisPosition(enemyTeam);
            this.teamCharactersToMove[this.currentCharacterIndex] =
              updatedNemesisPos;
            this.highlightCurrentCharacter();
            this.updatePhaseDisplay();
          }
        } else {
          this.moveToNextCharacter();
        }
      } else {
        this.selectedCharacterPosition = null;
        this.clearHighlights();
        this.highlightCurrentCharacter();
        this.updatePhaseDisplay();
      }
    } else {
      alert(`You must move the current character first!`);
    }
  }

  handleRecruitPhaseClick(index) {
    if (this.selectedCardIndex === null) {
      return;
    }

    const validPositions =
      this.currentTurn === "white"
        ? this.whiteStartPositions
        : this.blackStartPositions;

    if (!validPositions.includes(index)) {
      alert(
        `${
          this.currentTurn === "white" ? "White" : "Black"
        } can only place at positions: ${validPositions.join(", ")}`
      );
      return;
    }

    if (this.tree[index].pasukanID !== null) {
      alert("This position is already occupied!");
      return;
    }

    const currentRecruitmentTurns =
      this.currentTurn === "white"
        ? this.whiteRecruitmentTurns
        : this.blackRecruitmentTurns;

    if (currentRecruitmentTurns >= this.maxRecruitmentTurns) {
      alert(
        `${
          this.currentTurn === "white" ? "White" : "Black"
        } has completed all ${this.maxRecruitmentTurns} recruitment turns!`
      );
      return;
    }

    const character = this.currentCards[this.selectedCardIndex];
    if (!character) {
      return;
    }

    this.placeCharacterAtPosition(character, index, this.currentTurn);

    if (character.id === 16) {
      this.placeHermitCub(this.currentTurn);
    }

    if (this.currentTurn === "white") {
      this.whiteRecruitmentTurns++;
    } else {
      this.blackRecruitmentTurns++;
    }

    const newCharacter = this.getRandomCharacter();
    if (newCharacter) {
      this.currentCards[this.selectedCardIndex] = newCharacter;
      this.updateCardDisplay(this.selectedCardIndex, newCharacter);
    }

    const cardElements = document.querySelectorAll(".playing-card");
    cardElements.forEach((card) => card.classList.remove("selected"));
    this.selectedCardIndex = null;

    this.endTurn();
  }

  endTurn() {
    this.currentTurn = this.currentTurn === "white" ? "black" : "white";
    if (this.currentTurn === "white") {
      this.turnCount++;
    }
    this.updateTurnDisplay();
    this.startMovementPhase();

    if (
      // 🤖 AI TURN
      this.isAIPlayer &&
      this.currentTurn === "black" &&
      this.aiDifficulty
    ) {
      setTimeout(() => {
        this.runAI();
      }, 400);
    }
  }

  // ========== UPDATED: AI DECISION LOGIC WITH ALPHA-BETA PRUNING ==========
  // Depth based on difficulty: easy = 3, normal = 5, hard = 7
  getAISearchDepth() {
    switch (this.aiDifficulty) {
      case "easy":
        return 3;
      case "normal":
        return 5;
      case "hard":
        return 7;
      default:
        return 3;
    }
  }

  runAI() {
    console.log("AI TURN STARTED", this.currentTurn, this.currentPhase);
    if (this.aiThinking) return;
    if (this.currentPhase !== "move") return;
    if (this.currentTurn !== "black") return;

    // Don't interfere with NEMESIS intercept
    if (this.isNemesisIntercept) return;

    this.aiThinking = true;

    // If no characters left to move, wait for recruitment/end turn
    if (this.currentCharacterIndex >= this.teamCharactersToMove.length) {
      this.aiThinking = false;
      return;
    }

    // Find the best move using alpha-beta pruning
    const bestMove = this.findBestMoveAI();

    if (!bestMove) {
      // No valid move found, skip to next character
      this.moveToNextCharacter();
      this.aiThinking = false;
      setTimeout(() => this.runAI(), 200);
      return;
    }

    const { from, to } = bestMove;

    // Execute the move directly (without clicking)
    this.selectedCharacterPosition = from;
    this.selectedCharacterPosition = null;

    this.moveCharacter(from, to);

    // Check win/lose conditions
    this.checkWinLoseConditions();

    // ===== NEMESIS CHECK (AI MODE FIX) =====
    const movedCharId = this.tree[to]?.pasukanID;
    if (this.triggerNemesisAfterLeaderMove(movedCharId)) {
      this.resumeAIAfterNemesis = true;
      this.aiThinking = false;

      // 🔥 JALANKAN NEMESIS AI
      setTimeout(() => {
        this.runNemesisAI();
      }, 300);

      return;
    }

    // Move to next character
    this.moveToNextCharacter();

    this.aiThinking = false;

    // If still in move phase and still AI's turn, continue
    if (this.currentTurn === "black" && this.currentPhase === "move") {
      setTimeout(() => this.runAI(), 300);
    }
  }

  // ========== FIND BEST MOVE WITH PRIORITY SYSTEM ==========
  findBestMoveAI() {
    const team = "black";
    const charPos = this.teamCharactersToMove[this.currentCharacterIndex];
    if (charPos == null) return null;

    const node = this.tree[charPos];
    const isLeader = node.pasukanID === 1; // Black leader is id 1

    // Get all possible moves
    const moves = this.getMovePositions(charPos);
    if (moves.length === 0) return null;

    // PRIORITY A: Only one move available
    if (moves.length === 1) {
      return { from: charPos, to: moves[0] };
    }

    if (isLeader) {
      return this.findBestLeaderMove(charPos, moves, team);
    } else {
      return this.findBestNonLeaderMove(charPos, moves, team);
    }
  }

  // ========== FIND BEST NON-LEADER MOVE ==========
  findBestNonLeaderMove(charPos, moves, team) {
    // Priority B: Movement would win the game
    for (const move of moves) {
      const snap = this.snapshotBoard();
      this.moveCharacter(charPos, move);

      // Check if white leader is defeated
      const whiteLeaderPos = this.getLeaderPosition("white");
      let isWin = false;

      if (whiteLeaderPos !== null) {
        // Check if leader is captured or can't move
        const adjacent = this.adjacencyMap[whiteLeaderPos];
        let nonArcherCount = 0;

        for (const pos of adjacent) {
          const n = this.tree[pos];
          if (
            n.pasukanID !== null &&
            n.isConqueredByBlack === 1 &&
            n.pasukanID !== 11
          ) {
            nonArcherCount++;
          }
        }

        if (nonArcherCount >= 2) {
          isWin = true;
        } else if (
          nonArcherCount >= 1 &&
          this.checkArcherSupport(whiteLeaderPos, "black")
        ) {
          isWin = true;
        }

        // Check if leader can't move
        let canMove = false;
        for (const pos of adjacent) {
          if (this.tree[pos].pasukanID === null) {
            canMove = true;
            break;
          }
        }
        if (!canMove) {
          isWin = true;
        }
      }

      this.restoreBoard(snap);

      if (isWin) {
        return { from: charPos, to: move };
      }
    }

    // Priority C: Protect team from losing (only if 1 adjacent enemy or 1 archer capturing leader)
    const blackLeaderPos = this.getLeaderPosition("black");
    if (blackLeaderPos !== null) {
      const leaderAdj = this.adjacencyMap[blackLeaderPos];
      let adjacentWhiteCount = 0;
      let archerCount = 0;

      for (const pos of leaderAdj) {
        const n = this.tree[pos];
        if (n.pasukanID !== null && n.isConqueredByWhite === 1) {
          adjacentWhiteCount++;
          if (n.pasukanID === 11) archerCount++;
        }
      }

      // Only check if 1 enemy or 1 archer
      if (
        adjacentWhiteCount <= 1 ||
        (archerCount === 1 && adjacentWhiteCount === 1)
      ) {
        for (const move of moves) {
          const snap = this.snapshotBoard();
          this.moveCharacter(charPos, move);

          // Check if move eliminates threat
          const newLeaderAdj = this.adjacencyMap[blackLeaderPos];
          let newWhiteCount = 0;

          for (const pos of newLeaderAdj) {
            const n = this.tree[pos];
            if (n.pasukanID !== null && n.isConqueredByWhite === 1) {
              newWhiteCount++;
            }
          }

          this.restoreBoard(snap);

          // If threat is eliminated and leader can still move
          if (newWhiteCount < adjacentWhiteCount) {
            let leaderCanMove = false;
            for (const pos of newLeaderAdj) {
              if (this.tree[pos].pasukanID === null) {
                leaderCanMove = true;
                break;
              }
            }
            if (leaderCanMove) {
              return { from: charPos, to: move };
            }
          }
        }
      }
    }

    // Priority D: Get closer to enemy leader (non-leader: adjacent or 2 tiles for archer)
    const whiteLeaderPos = this.getLeaderPosition("white");
    const charNode = this.tree[charPos];
    const isArcher = charNode.pasukanID === 11;

    let bestMove = null;
    let bestDistance = Infinity;

    for (const move of moves) {
      const dist = this.hexDistance(move, whiteLeaderPos);

      // For archer: prefer 2 tiles away (negative score bonus)
      // For others: prefer adjacent
      if (isArcher) {
        if (dist === 2 && dist < bestDistance) {
          bestDistance = dist;
          bestMove = move;
        } else if (dist === 2) {
          // Stay at distance 2 if possible
          bestMove = move;
        }
      } else {
        if (dist <= 1) {
          return { from: charPos, to: move };
        }
        if (dist < bestDistance) {
          bestDistance = dist;
          bestMove = move;
        }
      }
    }

    // Priority E: Use alpha-beta pruning if no move found yet
    if (bestMove === null && moves.length > 0) {
      const depth = this.getAISearchDepth();
      let bestScore = -Infinity;

      for (const move of moves) {
        const snap = this.snapshotBoard();
        this.moveCharacter(charPos, move);
        const score = this.minimaxAI(depth - 1, 0, true, -Infinity, Infinity);
        this.restoreBoard(snap);

        if (score > bestScore) {
          bestScore = score;
          bestMove = move;
        }
      }
    }

    return bestMove ? { from: charPos, to: bestMove } : null;
  }

  // ========== FIND BEST LEADER MOVE ==========
  findBestLeaderMove(charPos, moves, team) {
    const whiteLeaderPos = this.getLeaderPosition("white");

    // Priority B: Ensure leader doesn't lose
    for (const move of moves) {
      const snap = this.snapshotBoard();
      this.moveCharacter(charPos, move);

      // Check if leader is safer
      const adj = this.adjacencyMap[move];
      let whiteEnemyCount = 0;

      for (const pos of adj) {
        const n = this.tree[pos];
        if (n.pasukanID !== null && n.isConqueredByWhite === 1) {
          whiteEnemyCount++;
        }
      }

      // Check if leader can still move
      let canMove = false;
      for (const pos of adj) {
        if (this.tree[pos].pasukanID === null) {
          canMove = true;
          break;
        }
      }

      this.restoreBoard(snap);

      // Prefer moves that minimize enemies and allow movement
      if (whiteEnemyCount === 0 && canMove) {
        return { from: charPos, to: move };
      }
    }

    // Priority C: Move farther from white leaders
    let bestMove = null;
    let bestDistance = -Infinity;

    for (const move of moves) {
      const dist = this.hexDistance(move, whiteLeaderPos);
      if (dist > bestDistance) {
        bestDistance = dist;
        bestMove = move;
      }
    }

    if (bestMove !== null) {
      return { from: charPos, to: bestMove };
    }

    // Fallback: use alpha-beta pruning
    const depth = this.getAISearchDepth();
    let bestScore = -Infinity;

    for (const move of moves) {
      const snap = this.snapshotBoard();
      this.moveCharacter(charPos, move);
      const score = this.minimaxAI(depth - 1, 0, true, -Infinity, Infinity);
      this.restoreBoard(snap);

      if (score > bestScore) {
        bestScore = score;
        bestMove = move;
      }
    }

    return bestMove ? { from: charPos, to: bestMove } : null;
  }

  // ========== MINIMAX WITH ALPHA-BETA PRUNING ==========
  minimaxAI(depth, unitIndex, isMaximizing, alpha, beta) {
    if (depth === 0) {
      return this.evaluateAI();
    }

    const team = isMaximizing ? "black" : "white";
    const positions = this.getTeamCharacterPositions(team).filter(
      (pos) => this.tree[pos].pasukanID !== 18 // Exclude NEMESIS
    );

    if (positions.length === 0) {
      // jika tak ada unit
      return this.minimaxAI(depth - 1, 0, !isMaximizing, alpha, beta);
    }

    if (unitIndex >= positions.length) {
      // ini klo semua pasukan di suatu tim udah di proses
      return this.minimaxAI(
        depth - 1, // depthnya dikurangi 1
        0,
        !isMaximizing, // ganti max ke min atau sebaliknya
        alpha,
        beta
      );
    }

    const from = positions[unitIndex];
    const moves = this.getMovePositions(from);

    // === JIKA UNIT TIDAK PUNYA MOVE → LEWATI KE UNIT BERIKUT ===
    if (moves.length === 0) {
      return this.minimaxAI(depth, unitIndex + 1, isMaximizing, alpha, beta);
    }

    // ================= MAX (BLACK) =================
    if (isMaximizing) {
      let maxEval = -Infinity;

      for (const to of moves) {
        const snap = this.snapshotBoard();
        this.moveCharacter(from, to);

        const evalScore = this.minimaxAI(
          depth,
          unitIndex + 1,
          isMaximizing,
          alpha,
          beta
        );

        this.restoreBoard(snap);

        maxEval = Math.max(maxEval, evalScore);
        alpha = Math.max(alpha, evalScore);

        if (beta <= alpha) break; // beta cutoff
      }

      return maxEval === -Infinity ? 0 : maxEval;
    }

    // ================= MIN (WHITE) =================
    else {
      let minEval = Infinity;

      for (const to of moves) {
        const snap = this.snapshotBoard();
        this.moveCharacter(from, to);

        const evalScore = this.minimaxAI(
          depth,
          unitIndex + 1,
          isMaximizing,
          alpha,
          beta
        );

        this.restoreBoard(snap);

        minEval = Math.min(minEval, evalScore);
        beta = Math.min(beta, evalScore);

        if (beta <= alpha) break; // alpha cutoff
      }

      return minEval === Infinity ? 0 : minEval;
    }
  }

  // ========== EVALUATION FUNCTION ==========
  evaluateAI() {
    const blackLeaderPos = this.getLeaderPosition("black");
    const whiteLeaderPos = this.getLeaderPosition("white");

    if (whiteLeaderPos === null) return 100000; // Black wins
    if (blackLeaderPos === null) return -100000; // White wins

    let score = 0;

    // ===== OFFENSIVE SCORING =====
    // Pressure white leader with non-archer units
    const whiteAdj = this.adjacencyMap[whiteLeaderPos];
    let blackNonArcherAdj = 0;

    for (const pos of whiteAdj) {
      const n = this.tree[pos];
      if (n && n.isConqueredByBlack === 1 && n.pasukanID !== 11) {
        blackNonArcherAdj++;
      }
    }

    if (blackNonArcherAdj >= 2) score += 5000; // Capture threat
    if (
      blackNonArcherAdj >= 1 &&
      this.checkArcherSupport(whiteLeaderPos, "black")
    ) {
      score += 3000; // Archer support
    }

    // Distance to white leader (prefer closer)
    const blackPositions = this.getTeamCharacterPositions("black");
    let totalDistance = 0;
    for (const pos of blackPositions) {
      totalDistance += this.hexDistance(pos, whiteLeaderPos);
    }
    score -= Math.ceil(totalDistance / Math.max(1, blackPositions.length)) * 2;

    // ===== DEFENSIVE SCORING =====
    // Keep black leader safe
    const blackAdj = this.adjacencyMap[blackLeaderPos];
    let whiteEnemyAdj = 0;

    for (const pos of blackAdj) {
      const n = this.tree[pos];
      if (n && n.isConqueredByWhite === 1) {
        whiteEnemyAdj++;
      }
    }

    // Penalize if leader is threatened
    if (whiteEnemyAdj >= 2) score -= 5000;
    if (
      whiteEnemyAdj >= 1 &&
      this.checkArcherSupport(blackLeaderPos, "white")
    ) {
      score -= 3000;
    }

    // Ensure leader can move
    let blackLeaderCanMove = false;
    for (const pos of blackAdj) {
      if (this.tree[pos].pasukanID === null) {
        blackLeaderCanMove = true;
        break;
      }
    }
    if (!blackLeaderCanMove) score -= 10000; // Losing condition

    return score;
  }

  snapshotBoard() {
    return this.tree.map((node) => ({
      pasukanID: node.pasukanID,
      isConqueredByWhite: node.isConqueredByWhite,
      isConqueredByBlack: node.isConqueredByBlack,
    }));
  }

  restoreBoard(snapshot) {
    for (let i = 0; i < this.tree.length; i++) {
      const snap = snapshot[i];
      const node = this.tree[i];

      node.pasukanID = snap.pasukanID;
      node.isConqueredByWhite = snap.isConqueredByWhite;
      node.isConqueredByBlack = snap.isConqueredByBlack;

      // Update DOM to be consistent
      const btn = this.buttons[i];
      if (snap.pasukanID === null) {
        btn.innerHTML = "";
        btn.classList.remove("active");
        btn.dataset.active = "false";
      } else {
        const char = characters.find((c) => c.id === snap.pasukanID);
        const team = snap.isConqueredByWhite ? "white" : "black";
        this.placeCharacterAtPosition(char, i, team);
      }
    }
  }

  hexDistance(a, b) {
    if (a === b) return 0;
    const visited = new Set();
    const queue = [{ pos: a, dist: 0 }];

    while (queue.length) {
      const { pos, dist } = queue.shift();
      if (pos === b) return dist;
      visited.add(pos);

      for (const n of this.adjacencyMap[pos]) {
        if (!visited.has(n)) {
          queue.push({ pos: n, dist: dist + 1 });
        }
      }
    }
    return 99;
  }

  updateTurnDisplay() {
    const turnTeamElement = document.getElementById("turn-team");
    const turnCountElement = document.getElementById("turn-count");

    turnTeamElement.textContent = this.currentTurn.toUpperCase();
    turnTeamElement.className =
      "turn-team " + (this.currentTurn === "white" ? "white" : "black");
    turnCountElement.textContent = `Turn ${this.turnCount}`;
  }

  resetBoard() {
    this.buttons.forEach((button, index) => {
      button.classList.remove(
        "active",
        "selected-character",
        "move-target",
        "can-move"
      );
      button.dataset.active = "false";
      button.innerHTML = "";
      this.tree[index].isConqueredByWhite = 0;
      this.tree[index].isConqueredByBlack = 0;
      this.tree[index].pasukanGambar = null;
      this.tree[index].pasukanID = null;
    });

    this.currentTurn = "white";
    this.turnCount = 1;
    this.whiteRecruitmentTurns = 0;
    this.blackRecruitmentTurns = 0;
    this.availableCharacters = this.getAvailableCharacters();
    this.currentCards = [null, null, null];
    this.selectedCardIndex = null;

    this.currentPhase = "move";
    this.teamCharactersToMove = [];
    this.currentCharacterIndex = 0;
    this.selectedCharacterPosition = null;
    this.movedCharacters.clear();
    this.useSpecialAbility = true;
    this.useClawGrab = false;
    this.isNemesisIntercept = false;
    this.nemesisMovesRemaining = 0;
    this.nemesisTeam = null;
    this.characterIndexBeforeNemesis = 0;
    this.charactersToMoveBeforeNemesis = [];

    // Reset ability toggle buttons
    const useSpecialBtn = document.getElementById("use-special-btn");
    const useNormalBtn = document.getElementById("use-normal-btn");
    const clawPullBtn = document.getElementById("claw-pull-btn");
    const clawGrabBtn = document.getElementById("claw-grab-btn");
    if (useSpecialBtn && useNormalBtn) {
      useSpecialBtn.classList.add("active");
      useNormalBtn.classList.remove("active");
    }
    if (clawPullBtn && clawGrabBtn) {
      clawPullBtn.classList.add("active");
      clawGrabBtn.classList.remove("active");
    }

    this.placeLeaders();
    this.initializeCards();
    this.updateTurnDisplay();
    this.startMovementPhase();

    const cardElements = document.querySelectorAll(".playing-card");
    cardElements.forEach((card) => card.classList.remove("selected"));
  }

  getActivePositions() {
    return this.buttons
      .filter((button) => button.dataset.active === "true")
      .map((button) => parseInt(button.dataset.index));
  }

  getActivatedCount() {
    return this.getActivePositions().length;
  }

  getTreeNode(index) {
    return this.tree[index];
  }

  // ===== ASSASSIN PASSIVE ABILITY =====
  checkAssassinKill(assassinPos) {
    const assassinNode = this.tree[assassinPos];
    if (!assassinNode || assassinNode.pasukanID !== 12) return;

    const assassinTeam =
      assassinNode.isConqueredByWhite === 1 ? "white" : "black";

    const adjacentPositions = this.adjacencyMap[assassinPos];

    for (const pos of adjacentPositions) {
      const node = this.tree[pos];
      if (!node || node.pasukanID === null) continue;

      const isLeader = node.pasukanID === 19 || node.pasukanID === 1;
      if (!isLeader) continue;

      const targetTeam = node.isConqueredByWhite === 1 ? "white" : "black";

      if (targetTeam !== assassinTeam) {
        alert(
          `${assassinTeam.toUpperCase()} WINS!\nASSASSIN killed enemy LEADER`
        );
        location.reload();
        return;
      }
    }
  }

  traverseTree(startIndex, callback) {
    const visited = new Set();
    const queue = [this.tree[startIndex]];

    while (queue.length > 0) {
      const node = queue.shift();
      if (!node || visited.has(node.onTree)) continue;

      visited.add(node.onTree);
      callback(node);

      node.children.forEach((child) => {
        if (child && !visited.has(child.onTree)) {
          queue.push(child);
        }
      });
    }
  }
}

let gameInstance = null;

function initializeDifficultyModal() {
  const difficultyModal = document.getElementById("difficulty-modal");
  const gameContainer = document.querySelector(".game-container");
  const difficultyBtns = document.querySelectorAll(".difficulty-btn");
  const aiDifficultyBtns = document.querySelectorAll(".ai-difficulty-btn");
  const aiDifficultySection = document.getElementById("ai-difficulty");

  difficultyBtns.forEach((btn) => {
    btn.addEventListener("click", (e) => {
      const mode = e.target.dataset.mode;

      if (mode === "2-player") {
        gameInstance = new HexagonalBoard("2-player");
        difficultyModal.style.display = "none";
        gameContainer.style.display = "flex";
      } else if (mode === "ai") {
        aiDifficultySection.style.display = "block";
      }
    });
  });

  aiDifficultyBtns.forEach((btn) => {
    btn.addEventListener("click", (e) => {
      const difficulty = e.target.dataset.difficulty;
      gameInstance = new HexagonalBoard("ai", difficulty);
      difficultyModal.style.display = "none";
      gameContainer.style.display = "flex";
    });
  });
}

document.addEventListener("DOMContentLoaded", () => {
  initializeDifficultyModal();

  window.game = gameInstance;
  window.HexagonalBoard = HexagonalBoard;
});

// game.js
import { createTreeNode } from "./TreeMap.js";
import { characters } from "./Karakter.js";

class HexagonalBoard {
  constructor(gameMode, aiDifficulty = null) {
    this.gameMode = gameMode;
    this.aiDifficulty = aiDifficulty;
    this.board = document.getElementById("game-board");
    this.buttons = [];
    this.positions = this.calculatePositions();
    this.adjacencyMap = this.calculateAdjacency();
    this.tree = [];
    this.currentTurn = "white";
    this.turnCount = 1;
    this.whiteStartPositions = [30, 31, 32, 34, 35, 36];
    this.blackStartPositions = [9, 4, 1, 3, 8, 15];
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

        // If a character is selected, update the highlights
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

        // If a character is selected, update the highlights
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

  // Movement Ability
  // FIXED: ACROBAT - Now allows 2 jumps, must have adjacent enemy/ally
  getAcrobatMoves(characterPos, team) {
    const moves = new Set();

    const addJumps = (
      currentPos,
      jumpsRemaining,
      visitedPositions = new Set()
    ) => {
      if (jumpsRemaining === 0) return;

      const adjacent = this.adjacencyMap[currentPos];
      for (const adjPos of adjacent) {
        const adjNode = this.tree[adjPos];
        // Must have a character (enemy or ally) to jump over
        if (adjNode.pasukanID !== null) {
          const direction = adjPos - currentPos;
          const nextPos = adjPos + direction;

          if (nextPos >= 0 && nextPos < this.tree.length) {
            if (this.adjacencyMap[adjPos].includes(nextPos)) {
              const nextNode = this.tree[nextPos];
              if (
                nextNode.pasukanID === null &&
                !visitedPositions.has(nextPos)
              ) {
                moves.add(nextPos);
                const newVisited = new Set(visitedPositions);
                newVisited.add(nextPos);
                addJumps(nextPos, jumpsRemaining - 1, newVisited);
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

  // FIXED: CLAW LAUNCHER - Moves in front of visible character or drags them
  getClawLauncherMoves(characterPos, team) {
    const moves = new Set();

    // Check all line types
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

      if (firstCharacterForward !== null) {
        const characterPos = line[firstCharacterForward];

        // Can move to position right before the character (one space away)
        if (firstCharacterForward === index + 1) {
          // Character is immediately adjacent, can't move in front
        } else {
          moves.add(line[firstCharacterForward - 1]);
        }

        // Can drag character to any empty position between current and character
        for (let i = index + 1; i < firstCharacterForward; i++) {
          if (this.tree[line[i]].pasukanID === null) {
            moves.add(line[i]);
          }
        }
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

      if (firstCharacterBackward !== null) {
        // Can move to position right before the character (one space away)
        if (firstCharacterBackward === index - 1) {
          // Character is immediately adjacent, can't move in front
        } else {
          moves.add(line[firstCharacterBackward + 1]);
        }

        // Can drag character to any empty position between current and character
        for (let i = index - 1; i > firstCharacterBackward; i--) {
          if (this.tree[line[i]].pasukanID === null) {
            moves.add(line[i]);
          }
        }
      }
    }

    return Array.from(moves);
  }

  // FIXED: MANIPULATOR - Moves enemy in line of sight to adjacent empty space
  getManipulatorMoves(characterPos, team) {
    const moves = new Set();

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

        // Must have an enemy character
        if (targetNode.pasukanID !== null) {
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

  // UPDATED: moveCharacter to handle special abilities properly
  moveCharacter(fromPosition, toPosition) {
    const node = this.tree[fromPosition];
    const character = characters.find((c) => c.id === node.pasukanID);

    if (!character) return false;

    const team = node.isConqueredByWhite === 1 ? "white" : "black";
    const targetNode = this.tree[toPosition];

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

                return true;
              }
            }
            break;
          }
        }
      }

      // CLAW LAUNCHER - Drag character
      if (character.id === 7) {
        // Find if there's a character to drag
        const allLines = [
          ...HexagonalBoard.lines.vertical,
          ...HexagonalBoard.lines.diagonalTopLeft,
          ...HexagonalBoard.lines.diagonalTopRight,
        ];

        for (const line of allLines) {
          const fromIndex = line.indexOf(fromPosition);
          const toIndex = line.indexOf(toPosition);

          if (fromIndex !== -1 && toIndex !== -1) {
            // Check if there's a character beyond toPosition
            const direction = toIndex > fromIndex ? 1 : -1;
            let characterToDrag = null;
            let dragFromPos = null;

            for (
              let i = toIndex + direction;
              direction > 0 ? i < line.length : i >= 0;
              i += direction
            ) {
              const checkPos = line[i];
              if (this.tree[checkPos].pasukanID !== null) {
                characterToDrag = characters.find(
                  (c) => c.id === this.tree[checkPos].pasukanID
                );
                const dragTeam =
                  this.tree[checkPos].isConqueredByWhite === 1
                    ? "white"
                    : "black";
                dragFromPos = checkPos;

                // Clear dragged character's original position
                this.buttons[checkPos].innerHTML = "";
                this.buttons[checkPos].classList.remove("active");
                this.buttons[checkPos].dataset.active = "false";
                this.tree[checkPos].pasukanGambar = null;
                this.tree[checkPos].pasukanID = null;
                this.tree[checkPos].isConqueredByWhite = 0;
                this.tree[checkPos].isConqueredByBlack = 0;

                // Place dragged character at toPosition
                this.placeCharacterAtPosition(
                  characterToDrag,
                  toPosition,
                  dragTeam
                );
                break;
              }
            }

            // If no character was dragged, toPosition should be empty for claw launcher to move there
            break;
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

    if (phaseNameEl) {
      phaseNameEl.textContent = this.currentPhase.toUpperCase();
      phaseNameEl.className = `phase-name ${this.currentPhase}`;
    }

    if (moveCounterEl) {
      if (this.currentPhase === "move") {
        const totalCharacters = this.teamCharactersToMove.length;
        const currentCharNum = this.currentCharacterIndex + 1;
        moveCounterEl.textContent = `Character ${currentCharNum} of ${totalCharacters}`;
      } else {
        moveCounterEl.textContent = "Recruitment Phase";
      }
    }

    if (currentCharEl) {
      if (this.currentPhase === "move") {
        if (this.currentCharacterIndex < this.teamCharactersToMove.length) {
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

    // Show/hide ability toggle based on phase
    if (abilityToggle) {
      abilityToggle.style.display =
        this.currentPhase === "move" ? "block" : "none";
    }
  }

  moveToNextCharacter() {
    this.currentCharacterIndex++;

    if (this.currentCharacterIndex >= this.teamCharactersToMove.length) {
      this.startRecruitmentPhase();
    } else {
      this.highlightCurrentCharacter();
      this.updatePhaseDisplay();

      // Reset to special ability for next character
      this.useSpecialAbility = true;
      const useSpecialBtn = document.getElementById("use-special-btn");
      const useNormalBtn = document.getElementById("use-normal-btn");
      if (useSpecialBtn && useNormalBtn) {
        useSpecialBtn.classList.add("active");
        useNormalBtn.classList.remove("active");
      }
    }
  }

  startMovementPhase() {
    this.currentPhase = "move";
    this.teamCharactersToMove = this.getTeamCharacterPositions(
      this.currentTurn
    );
    this.currentCharacterIndex = 0;
    this.selectedCharacterPosition = null;
    this.movedCharacters.clear();
    this.useSpecialAbility = true;

    // Reset ability toggle buttons
    const useSpecialBtn = document.getElementById("use-special-btn");
    const useNormalBtn = document.getElementById("use-normal-btn");
    if (useSpecialBtn && useNormalBtn) {
      useSpecialBtn.classList.add("active");
      useNormalBtn.classList.remove("active");
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
      this.clearHighlights();
      this.selectedCharacterPosition = index;
      this.buttons[index].classList.add("selected-character");

      const availableMoves = this.getMovePositions(index);
      this.highlightMovePositions(availableMoves);
      this.updatePhaseDisplay();
    } else if (this.selectedCharacterPosition !== null) {
      const availableMoves = this.getMovePositions(
        this.selectedCharacterPosition
      );

      if (availableMoves.includes(index)) {
        const fromPos = this.selectedCharacterPosition;
        this.moveCharacter(fromPos, index);

        this.selectedCharacterPosition = null;
        this.clearHighlights();

        this.moveToNextCharacter();
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
    const previousTurn = this.currentTurn;
    this.currentTurn = this.currentTurn === "white" ? "black" : "white";

    if (this.currentTurn === "white") {
      this.turnCount++;
    }

    this.updateTurnDisplay();

    this.startMovementPhase();
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

    // Reset ability toggle buttons
    const useSpecialBtn = document.getElementById("use-special-btn");
    const useNormalBtn = document.getElementById("use-normal-btn");
    if (useSpecialBtn && useNormalBtn) {
      useSpecialBtn.classList.add("active");
      useNormalBtn.classList.remove("active");
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

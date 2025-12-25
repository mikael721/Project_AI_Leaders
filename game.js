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
    this.currentPhase = "move"; // "move" or "recruit"
    this.teamCharactersToMove = []; // List of character positions for current turn
    this.currentCharacterIndex = 0; // Index in teamCharactersToMove array
    this.selectedCharacterPosition = null; // Position of character selected for moving
    this.movedCharacters = new Set(); // Track which characters have moved this turn

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
    // Create phase display elements if they don't exist
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
      `;

      // Insert after turn indicator
      const turnIndicator = rightPanel.querySelector(".turn-indicator");
      turnIndicator.after(phaseContainer);
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
    // Only allow card selection during recruit phase
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

  // Helper method to find which line a position is on
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

  // Helper method to get positions along a line in a direction
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

  // Helper method to check if a position is a corner
  isCornerPosition(position) {
    return this.positions[position].isCorner;
  }

  // Helper method to get leader position
  getLeaderPosition(team) {
    const leaderId = team === "white" ? 19 : 1;
    for (let i = 0; i < this.tree.length; i++) {
      if (this.tree[i].pasukanID === leaderId) {
        return i;
      }
    }
    return null;
  }
  //isak
  // ACROBAT (id: 2) - Jump over adjacent characters, can repeat 2 times
  getAcrobatMoves(characterPos, team) {
    const moves = new Set();

    const addJumps = (currentPos, jumpsRemaining) => {
      if (jumpsRemaining === 0) return;

      const adjacent = this.adjacencyMap[currentPos];
      for (const adjPos of adjacent) {
        const adjNode = this.tree[adjPos];
        // If adjacent has a character (ally or enemy)
        if (adjNode.pasukanID !== null) {
          // Find position after the character in the same direction
          const direction = adjPos - currentPos;
          const nextPos = adjPos + direction;

          if (nextPos >= 0 && nextPos < this.tree.length) {
            // Check if it's in the adjacency (valid position)
            if (this.adjacencyMap[adjPos].includes(nextPos)) {
              const nextNode = this.tree[nextPos];
              // Can land on empty space
              if (nextNode.pasukanID === null) {
                moves.add(nextPos);
                // Continue jumping from this position
                addJumps(nextPos, jumpsRemaining - 1);
              }
            }
          }
        }
      }
    };

    addJumps(characterPos, 2);
    return Array.from(moves);
  }
  //error
  // CAVALIER (id: 3) - Move vertically 2 spaces
  getCavalierMoves(characterPos) {
    const moves = new Set();
    const lineInfo = this.findLineForPosition(characterPos);

    if (!lineInfo || lineInfo.lineType !== "vertical") {
      return [];
    }

    const line = lineInfo.line;
    const index = line.indexOf(characterPos);

    // Move up 2 spaces
    if (index - 2 >= 0) {
      const targetPos = line[index - 2];
      if (this.tree[targetPos].pasukanID === null) {
        moves.add(targetPos);
      }
    }

    // Move down 2 spaces
    if (index + 2 < line.length) {
      const targetPos = line[index + 2];
      if (this.tree[targetPos].pasukanID === null) {
        moves.add(targetPos);
      }
    }

    return Array.from(moves);
  }

  //error (didnt push)
  // COGNEUR (id: 4) - Move to occupied space and push
  getCogneurMoves(characterPos) {
    const moves = new Set();
    const adjacent = this.adjacencyMap[characterPos];

    for (const adjPos of adjacent) {
      const adjNode = this.tree[adjPos];

      // Can move to occupied space if it's not a corner
      if (adjNode.pasukanID !== null && !this.isCornerPosition(adjPos)) {
        moves.add(adjPos);
      }
    }

    // Also include normal empty moves
    const emptyMoves = this.getAvailableMovePositions(characterPos);
    emptyMoves.forEach((pos) => moves.add(pos));

    return Array.from(moves);
  }

  //isak
  // ROYAL GUARD (id: 5) - Move to any space adjacent to leader
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

  //ERROR
  // ILLUSIONIST (id: 6) - Switch places with non-adjacent character in straight line
  getIllusionistMoves(characterPos, team) {
    const moves = new Set();
    const lineInfo = this.findLineForPosition(characterPos);

    if (!lineInfo) return [];

    const line = lineInfo.line;
    const index = line.indexOf(characterPos);
    const adjacent = this.adjacencyMap[characterPos];

    // Check both directions on the line
    for (let i = 0; i < line.length; i++) {
      if (i !== index && !adjacent.includes(line[i])) {
        const targetPos = line[i];
        const targetNode = this.tree[targetPos];
        // Can switch with any character
        if (targetNode.pasukanID !== null) {
          moves.add(targetPos);
        }
      }
    }

    return Array.from(moves);
  }

  //ERROR
  // CLAW LAUNCHER (id: 7) - Move or drag character in straight line
  getClawLauncherMoves(characterPos, team) {
    const moves = new Set();
    const lineInfo = this.findLineForPosition(characterPos);

    if (!lineInfo) return [];

    const line = lineInfo.line;
    const index = line.indexOf(characterPos);

    // Check positions in both directions on the line
    for (let i = index + 1; i < line.length; i++) {
      const pos = line[i];
      const node = this.tree[pos];

      if (node.pasukanID === null) {
        // Empty space - can move here
        moves.add(pos);
      } else {
        // Character found - can move before them or drag them
        if (i > index + 1) {
          moves.add(line[i - 1]);
        }
        moves.add(pos);
        break;
      }
    }

    // Check backward direction
    for (let i = index - 1; i >= 0; i--) {
      const pos = line[i];
      const node = this.tree[pos];

      if (node.pasukanID === null) {
        moves.add(pos);
      } else {
        if (i < index - 1) {
          moves.add(line[i + 1]);
        }
        moves.add(pos);
        break;
      }
    }

    return Array.from(moves);
  }

  //ERROR
  // MANIPULATOR (id: 8) - Move non-adjacent enemy in straight line by one space
  getManipulatorMoves(characterPos, team) {
    const moves = new Set();
    const lineInfo = this.findLineForPosition(characterPos);

    if (!lineInfo) return [];

    const line = lineInfo.line;
    const index = line.indexOf(characterPos);
    const adjacent = this.adjacencyMap[characterPos];

    // Check both directions on the line
    for (let i = 0; i < line.length; i++) {
      if (i !== index && !adjacent.includes(line[i])) {
        const targetPos = line[i];
        const targetNode = this.tree[targetPos];

        // Must be a character (enemy)
        if (targetNode.pasukanID !== null) {
          // Check if it's an enemy
          const isEnemy =
            (team === "white" && targetNode.isConqueredByBlack === 1) ||
            (team === "black" && targetNode.isConqueredByWhite === 1);

          if (isEnemy) {
            // Can move one space away from current position on the line
            const direction = i < index ? -1 : 1;
            const nextPos = line[i + direction];

            if (
              nextPos !== undefined &&
              this.tree[nextPos].pasukanID === null
            ) {
              moves.add(nextPos);
            }
          }
        }
      }
    }

    return Array.from(moves);
  }

  //ISAK
  // WANDERER (id: 9) - Move to any space non-adjacent to enemy
  getWandererMoves(characterPos, team) {
    const moves = new Set();

    // Get all empty positions
    for (let i = 0; i < this.tree.length; i++) {
      if (i === characterPos || this.tree[i].pasukanID !== null) {
        continue;
      }

      // Check if any adjacent position has an enemy
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

  //ERROR
  // BREWMASTER (id: 10) - Move adjacent ally one space
  getBrewmasterMoves(characterPos, team) {
    const moves = new Set();
    const adjacent = this.adjacencyMap[characterPos];

    for (const adjPos of adjacent) {
      const adjNode = this.tree[adjPos];

      // Must be an adjacent ally
      if (adjNode.pasukanID !== null) {
        const isAlly =
          (team === "white" && adjNode.isConqueredByWhite === 1) ||
          (team === "black" && adjNode.isConqueredByBlack === 1);

        if (isAlly) {
          // Get empty spaces adjacent to this ally
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

  // Get special move positions for each ability
  getSpecialMovePositions(characterPos) {
    const node = this.tree[characterPos];
    const character = characters.find((c) => c.id === node.pasukanID);

    if (!character) return [];

    const team = node.isConqueredByWhite === 1 ? "white" : "black";
    let specialMoves = [];

    switch (character.id) {
      case 2: // ACROBAT
        specialMoves = this.getAcrobatMoves(characterPos, team);
        break;
      case 3: // CAVALIER
        specialMoves = this.getCavalierMoves(characterPos);
        break;
      case 4: // COGNEUR
        specialMoves = this.getCogneurMoves(characterPos);
        break;
      case 5: // ROYAL GUARD
        specialMoves = this.getRoyalGuardMoves(team);
        break;
      case 6: // ILLUSIONIST
        specialMoves = this.getIllusionistMoves(characterPos, team);
        break;
      case 7: // CLAW LAUNCHER
        specialMoves = this.getClawLauncherMoves(characterPos, team);
        break;
      case 8: // MANIPULATOR
        specialMoves = this.getManipulatorMoves(characterPos, team);
        break;
      case 9: // WANDERER
        specialMoves = this.getWandererMoves(characterPos, team);
        break;
      case 10: // BREWMASTER
        specialMoves = this.getBrewmasterMoves(characterPos, team);
        break;
      default:
        // Regular movement for characters without special abilities
        specialMoves = this.getAvailableMovePositions(characterPos);
    }

    return specialMoves;
  }

  // Get all positions with characters belonging to a team
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

  // Get available adjacent empty positions for movement
  getAvailableMovePositions(fromPosition) {
    const adjacentPositions = this.adjacencyMap[fromPosition];
    return adjacentPositions.filter((pos) => this.tree[pos].pasukanID === null);
  }

  // Check if a character can move (has at least one empty adjacent spot)
  canCharacterMove(position) {
    return this.getAvailableMovePositions(position).length > 0;
  }

  // Move character from one position to another
  moveCharacter(fromPosition, toPosition) {
    const node = this.tree[fromPosition];
    const character = characters.find((c) => c.id === node.pasukanID);

    if (!character) return false;

    // Determine team
    const team = node.isConqueredByWhite === 1 ? "white" : "black";

    // Clear old position
    this.buttons[fromPosition].innerHTML = "";
    this.buttons[fromPosition].classList.remove("active", "selected-character");
    this.buttons[fromPosition].dataset.active = "false";
    this.tree[fromPosition].pasukanGambar = null;
    this.tree[fromPosition].pasukanID = null;
    this.tree[fromPosition].isConqueredByWhite = 0;
    this.tree[fromPosition].isConqueredByBlack = 0;

    // Place at new position
    this.placeCharacterAtPosition(character, toPosition, team);

    return true;
  }

  // Highlight available move positions
  highlightMovePositions(positions) {
    // Clear previous highlights
    this.buttons.forEach((btn) => btn.classList.remove("move-target"));

    // Add highlight to available positions
    positions.forEach((pos) => {
      this.buttons[pos].classList.add("move-target");
    });
  }

  // Clear all highlights
  clearHighlights() {
    this.buttons.forEach((btn) => {
      btn.classList.remove("move-target", "selected-character", "can-move");
    });
  }

  // Highlight the current character that needs to move
  highlightCurrentCharacter() {
    this.clearHighlights();

    if (this.currentCharacterIndex < this.teamCharactersToMove.length) {
      const characterPos =
        this.teamCharactersToMove[this.currentCharacterIndex];
      this.buttons[characterPos].classList.add("can-move");
    }
  }

  // Update phase display
  updatePhaseDisplay() {
    const phaseNameEl = document.getElementById("phase-name");
    const moveCounterEl = document.getElementById("move-counter");
    const currentCharEl = document.getElementById("current-character");

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
  }

  // Move to next character in the team
  moveToNextCharacter() {
    this.currentCharacterIndex++;

    if (this.currentCharacterIndex >= this.teamCharactersToMove.length) {
      // All characters have moved, go to recruitment phase
      this.startRecruitmentPhase();
    } else {
      // Highlight next character
      this.highlightCurrentCharacter();
      this.updatePhaseDisplay();
    }
  }

  // Start movement phase for current team
  startMovementPhase() {
    this.currentPhase = "move";
    this.teamCharactersToMove = this.getTeamCharacterPositions(
      this.currentTurn
    );
    this.currentCharacterIndex = 0;
    this.selectedCharacterPosition = null;
    this.movedCharacters.clear();

    if (this.teamCharactersToMove.length === 0) {
      // No characters to move, skip to recruitment
      this.startRecruitmentPhase();
    } else {
      this.highlightCurrentCharacter();
      this.updatePhaseDisplay();
    }
  }

  // Start recruitment phase
  startRecruitmentPhase() {
    const currentRecruitmentTurns =
      this.currentTurn === "white"
        ? this.whiteRecruitmentTurns
        : this.blackRecruitmentTurns;

    // Check if this team has already done all 4 recruitment turns
    if (currentRecruitmentTurns >= this.maxRecruitmentTurns) {
      // Skip recruitment and go directly to next turn
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
    // Must click on the current character that needs to move
    if (this.currentCharacterIndex >= this.teamCharactersToMove.length) {
      alert("All characters have moved!");
      return;
    }

    const expectedCharPos =
      this.teamCharactersToMove[this.currentCharacterIndex];
    const node = this.tree[index];

    // Check if clicking on the current character
    if (index === expectedCharPos && node.pasukanID !== null) {
      // Select this character
      this.clearHighlights();
      this.selectedCharacterPosition = index;
      this.buttons[index].classList.add("selected-character");

      // Highlight available move positions (with special abilities)
      const availableMoves = this.getSpecialMovePositions(index);
      this.highlightMovePositions(availableMoves);
      this.updatePhaseDisplay();
    } else if (this.selectedCharacterPosition !== null) {
      // Check if clicking on valid move target
      const availableMoves = this.getSpecialMovePositions(
        this.selectedCharacterPosition
      );

      if (availableMoves.includes(index)) {
        // Execute move
        const fromPos = this.selectedCharacterPosition;
        this.moveCharacter(fromPos, index);

        this.selectedCharacterPosition = null;
        this.clearHighlights();

        // Move to next character
        this.moveToNextCharacter();
      } else {
        // Clicked somewhere invalid, deselect
        this.selectedCharacterPosition = null;
        this.clearHighlights();
        this.highlightCurrentCharacter();
        this.updatePhaseDisplay();
      }
    } else {
      // Wrong character selected
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

    // Increment recruitment turn counter for current team
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

    // End turn and switch to other player
    this.endTurn();
  }

  endTurn() {
    // Switch to other player
    const previousTurn = this.currentTurn;
    this.currentTurn = this.currentTurn === "white" ? "black" : "white";

    // If we've gone through both players, increment turn count
    if (this.currentTurn === "white") {
      this.turnCount++;
    }

    this.updateTurnDisplay();

    // Start movement phase for new player
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

    // Reset movement tracking
    this.currentPhase = "move";
    this.teamCharactersToMove = [];
    this.currentCharacterIndex = 0;
    this.selectedCharacterPosition = null;
    this.movedCharacters.clear();

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

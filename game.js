// game.js
import { createTreeNode } from "./TreeMap.js";
import { characters } from "./Karakter.js";

class HexagonalBoard {
  constructor() {
    this.board = document.getElementById("game-board");
    this.buttons = [];
    this.positions = this.calculatePositions();
    this.adjacencyMap = this.calculateAdjacency();
    this.tree = [];
    this.currentTurn = "white";
    this.whiteStartPositions = [30, 31, 32, 34, 35, 36];
    this.blackStartPositions = [9, 4, 1, 3, 8, 15];
    this.availableCharacters = this.getAvailableCharacters();
    this.currentCards = [null, null, null];
    this.init();
  }

  getAvailableCharacters() {
    // Filter out Kings and Cub (id: 17)
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
    // Place ROI (white, id: 0) at position 33
    const roiChar = characters.find((char) => char.id === 19);
    if (roiChar) {
      this.placeCharacterAtPosition(roiChar, 33, "white");
    }

    // Place REINE (black, id: 1) at position 0
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
    console.log("leader id:" + character.id + " nama: " + character.nama);
    this.tree[position].pasukanID = character.id; // Use character.id instead of nama

    if (team === "white") {
      this.tree[position].isConqueredByWhite = 1;
    } else {
      this.tree[position].isConqueredByBlack = 1;
    }
  }

  placeHermitCub(team) {
    // Find available positions based on team
    const validPositions =
      team === "white" ? this.whiteStartPositions : this.blackStartPositions;

    // Filter out occupied positions
    const availablePositions = validPositions.filter(
      (pos) => this.tree[pos].pasukanID === null
    );

    // If no available positions, don't place the cub
    if (availablePositions.length === 0) {
      console.log(`No available space to place CUB for ${team}`);
      return;
    }

    // Randomly select one of the available positions
    const randomIndex = Math.floor(Math.random() * availablePositions.length);
    const selectedPosition = availablePositions[randomIndex];

    // Get the CUB character
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
    this.placeLeaders(); // Place leaders at start
    this.attachEventListeners();
    this.initializeCards();
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
    const button = event.target;
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

  handleButtonClick(event) {
    const button = event.target;
    const index = parseInt(button.dataset.index);
    this.tree[index].fungsiTest("General Click: ");

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

    const character = this.currentCards[this.selectedCardIndex];
    if (!character) {
      return;
    }

    // Place the character
    this.placeCharacterAtPosition(character, index, this.currentTurn);

    // Check if it's HERMIT (id: 16), then place CUB
    if (character.id === 16) {
      this.placeHermitCub(this.currentTurn);
    }

    // Get new random character for the card
    const newCharacter = this.getRandomCharacter();
    if (newCharacter) {
      this.currentCards[this.selectedCardIndex] = newCharacter;
      this.updateCardDisplay(this.selectedCardIndex, newCharacter);
    }

    const cardElements = document.querySelectorAll(".playing-card");
    cardElements.forEach((card) => card.classList.remove("selected"));
    this.selectedCardIndex = null;

    this.currentTurn = this.currentTurn === "white" ? "black" : "white";

    this.tree[index].fungsiTest("Selelah place");
  }

  resetBoard() {
    this.buttons.forEach((button, index) => {
      button.classList.remove("active");
      button.dataset.active = "false";
      button.innerHTML = "";
      this.tree[index].isConqueredByWhite = 0;
      this.tree[index].isConqueredByBlack = 0;
      this.tree[index].pasukanGambar = null;
      this.tree[index].pasukanID = null;
    });

    this.currentTurn = "white";
    this.availableCharacters = this.getAvailableCharacters();
    this.currentCards = [null, null, null];
    this.selectedCardIndex = null;

    // Re-place leaders after reset
    this.placeLeaders();
    this.initializeCards();

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

document.addEventListener("DOMContentLoaded", () => {
  const game = new HexagonalBoard();

  window.game = game;

  console.log(
    "Hexagonal Board Game initialized with",
    game.buttons.length,
    "positions"
  );

  console.log("Tree for position 0:", game.getTreeNode(0));

  console.log("Traversing tree from position 12:");
  game.traverseTree(12, (node) => {
    console.log(`Visiting node ${node.onTree}`);
  });
});

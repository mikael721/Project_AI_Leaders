// game.js
import { TreeMap, createTreeNode } from "./TreeMap.js";

class HexagonalBoard {
  constructor() {
    this.board = document.getElementById("game-board");
    this.buttons = [];
    this.positions = this.calculatePositions();
    this.adjacencyMap = this.calculateAdjacency();
    this.tree = []; // Array to store tree nodes for each position
    this.init();
  }

  calculatePositions() {
    // Positions based on the actual circular pips visible in the hexagonal board image
    // Coordinates are in percentage (%) from top-left corner

    const positions = [];

    // Row 1 (Top - 1 corner pip) (0)
    positions.push({ x: 50, y: 9, isCorner: true });

    // Row 2 (3 pips) (1-3)
    positions.push({ x: 36.5, y: 16.5, isCorner: true });
    positions.push({ x: 50, y: 23, isCorner: false });
    positions.push({ x: 63.5, y: 16.5, isCorner: true });

    // Row 3 (5 pips) (4-8)
    positions.push({ x: 23, y: 23, isCorner: true });
    positions.push({ x: 36.5, y: 30, isCorner: false });
    positions.push({ x: 50, y: 36.5, isCorner: false });
    positions.push({ x: 63.5, y: 30, isCorner: false });
    positions.push({ x: 77, y: 23, isCorner: true });

    // Row 4 (7 pips) (9-15)
    positions.push({ x: 9.7, y: 30, isCorner: true });
    positions.push({ x: 23, y: 36.5, isCorner: false });
    positions.push({ x: 36.5, y: 43, isCorner: false });
    positions.push({ x: 50, y: 50, isCorner: false });
    positions.push({ x: 63.5, y: 43, isCorner: false });
    positions.push({ x: 77, y: 36.5, isCorner: false });
    positions.push({ x: 90.2, y: 30, isCorner: true });

    // Row 5 (7 pips - middle row) (16-22)
    positions.push({ x: 9.7, y: 43, isCorner: true });
    positions.push({ x: 23, y: 50, isCorner: false });
    positions.push({ x: 36.5, y: 57, isCorner: false });
    positions.push({ x: 50, y: 63.5, isCorner: false });
    positions.push({ x: 63.5, y: 57, isCorner: false });
    positions.push({ x: 77, y: 50, isCorner: false });
    positions.push({ x: 90.2, y: 43, isCorner: true });

    // Row 6 (7 pips) (23-29)
    positions.push({ x: 9.7, y: 57, isCorner: true });
    positions.push({ x: 23, y: 63.5, isCorner: false });
    positions.push({ x: 36.5, y: 70.1, isCorner: false });
    positions.push({ x: 50, y: 77, isCorner: false });
    positions.push({ x: 63.5, y: 70.1, isCorner: false });
    positions.push({ x: 77, y: 63.5, isCorner: false });
    positions.push({ x: 90.2, y: 57, isCorner: true });

    // Row 7 (7 pips) (30-36)
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
    // Manually define adjacency based on hexagonal board structure
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
    this.initializeTree();
    this.createButtons();
    this.attachEventListeners();
  }

  initializeTree() {
    // Create a tree node for each position
    // Create a tree node for each position using the factory function
    for (let i = 0; i < this.positions.length; i++) {
      this.tree[i] = createTreeNode(i);
    }

    // Build tree relationships based on adjacency
    // Each node's children are its adjacent nodes
    for (let i = 0; i < this.positions.length; i++) {
      const adjacentNodes = this.adjacencyMap[i];
      adjacentNodes.forEach((adjIndex, childSlot) => {
        if (childSlot < 6) {
          // Ensure we don't exceed 6 children
          this.tree[i].children[childSlot] = this.tree[adjIndex];
        }
      });
    }

    console.log("Tree structure initialized:", this.tree);
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
  }

  handleButtonHover(event, isHovering) {
    const button = event.target;
    const index = parseInt(button.dataset.index);
    const adjacentIndices = this.adjacencyMap[index];

    if (isHovering) {
      // Highlight adjacent buttons (children in tree)
      adjacentIndices.forEach((adjIndex) => {
        this.buttons[adjIndex].classList.add("adjacent");
      });
    } else {
      // Remove highlight from adjacent buttons
      adjacentIndices.forEach((adjIndex) => {
        this.buttons[adjIndex].classList.remove("adjacent");
      });
    }
  }

  handleButtonClick(event) {
    const button = event.target;
    const index = parseInt(button.dataset.index);
    const isActive = button.dataset.active === "true";

    if (isActive) {
      button.classList.remove("active");
      button.dataset.active = "false";
      this.tree[index].isConqueredByRed = 0;
      this.tree[index].isConqueredByBlue = 0;
    } else {
      button.classList.add("active");
      button.dataset.active = "true";
      // Example: Mark as conquered by Red (you can implement game logic here)
      this.tree[index].isConqueredByRed = 1;
    }

    // Add a small animation effect
    const originalTransform = button.style.transform;
    button.style.transform = "translate(-50%, -50%) scale(1.2)";
    setTimeout(() => {
      button.style.transform = originalTransform;
    }, 150);

    // Log tree node information
    this.tree[index].fungsiTest(
      `Clicked - Red: ${this.tree[index].isConqueredByRed}, Blue: ${this.tree[index].isConqueredByBlue}`
    );
  }

  resetBoard() {
    this.buttons.forEach((button, index) => {
      button.classList.remove("active");
      button.dataset.active = "false";
      this.tree[index].isConqueredByRed = 0;
      this.tree[index].isConqueredByBlue = 0;
    });
  }

  getActivePositions() {
    return this.buttons
      .filter((button) => button.dataset.active === "true")
      .map((button) => parseInt(button.dataset.index));
  }

  getActivatedCount() {
    return this.getActivePositions().length;
  }

  // New method to get tree node by index
  getTreeNode(index) {
    return this.tree[index];
  }

  // New method to traverse tree from a starting node
  traverseTree(startIndex, callback) {
    const visited = new Set();
    const queue = [this.tree[startIndex]];

    while (queue.length > 0) {
      const node = queue.shift();
      if (!node || visited.has(node.onTree)) continue;

      visited.add(node.onTree);
      callback(node);

      // Add children to queue
      node.children.forEach((child) => {
        if (child && !visited.has(child.onTree)) {
          queue.push(child);
        }
      });
    }
  }
}

// Initialize the game when DOM is loaded
document.addEventListener("DOMContentLoaded", () => {
  const game = new HexagonalBoard();

  // Make game instance available globally for debugging
  window.game = game;

  console.log(
    "Hexagonal Board Game initialized with",
    game.buttons.length,
    "positions"
  );

  // Example: Access tree structure
  console.log("Tree for position 0:", game.getTreeNode(0));

  // Example: Traverse tree from position 12 (center)
  console.log("Traversing tree from position 12:");
  game.traverseTree(12, (node) => {
    console.log(`Visiting node ${node.onTree}`);
  });
});

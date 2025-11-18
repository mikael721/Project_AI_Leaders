// game.js
class HexagonalBoard {
  constructor() {
    this.board = document.getElementById("game-board");
    this.buttons = [];
    this.positions = this.calculatePositions();
    this.init();
  }

  calculatePositions() {
    // Positions based on the actual circular pips visible in the hexagonal board image
    // Coordinates are in percentage (%) from top-left corner

    const positions = [];

    // Row 1 (Top - 1 corner pip) (1)
    positions.push({ x: 50, y: 9, isCorner: true });

    // Row 2 (3 pips) (2-4)
    positions.push({ x: 36.5, y: 16.5, isCorner: true });
    positions.push({ x: 50, y: 23, isCorner: false });
    positions.push({ x: 63.5, y: 16.5, isCorner: true });

    // Row 3 (5 pips) (5-9)
    positions.push({ x: 23, y: 23, isCorner: true });
    positions.push({ x: 36.5, y: 30, isCorner: false });
    positions.push({ x: 50, y: 36.5, isCorner: false });
    positions.push({ x: 63.5, y: 30, isCorner: false });
    positions.push({ x: 77, y: 23, isCorner: true });

    // Row 4 (7 pips) (10-16)
    positions.push({ x: 9.7, y: 30, isCorner: true });
    positions.push({ x: 23, y: 36.5, isCorner: false });
    positions.push({ x: 36.5, y: 43, isCorner: false });
    positions.push({ x: 50, y: 50, isCorner: false });
    positions.push({ x: 63.5, y: 43, isCorner: false });
    positions.push({ x: 77, y: 36.5, isCorner: false });
    positions.push({ x: 90.2, y: 30, isCorner: true });

    // Row 5 (7 pips - middle row) (17-23)
    positions.push({ x: 9.7, y: 43, isCorner: true });
    positions.push({ x: 23, y: 50, isCorner: false });
    positions.push({ x: 36.5, y: 57, isCorner: false });
    positions.push({ x: 50, y: 63.5, isCorner: false });
    positions.push({ x: 63.5, y: 57, isCorner: false });
    positions.push({ x: 77, y: 50, isCorner: false });
    positions.push({ x: 90.2, y: 43, isCorner: true });

    // Row 6 (7 pips) (23-30)
    positions.push({ x: 9.7, y: 57, isCorner: true });
    positions.push({ x: 23, y: 63.5, isCorner: false });
    positions.push({ x: 36.5, y: 70.1, isCorner: false });
    positions.push({ x: 50, y: 77, isCorner: false });
    positions.push({ x: 63.5, y: 70.1, isCorner: false });
    positions.push({ x: 77, y: 63.5, isCorner: false });
    positions.push({ x: 90.2, y: 57, isCorner: true });

    // Row 7 (7 pips) (31-37)
    positions.push({ x: 9.7, y: 70.1, isCorner: true });
    positions.push({ x: 23, y: 77, isCorner: true });
    positions.push({ x: 36.5, y: 83.5, isCorner: true });
    positions.push({ x: 50, y: 90.5, isCorner: true });
    positions.push({ x: 63.5, y: 83.5, isCorner: true });
    positions.push({ x: 77, y: 77, isCorner: true });
    positions.push({ x: 90.2, y: 70.1, isCorner: true });

    return positions;
  }

  init() {
    this.createButtons();
    this.attachEventListeners();
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
      button.title = `Position ${index + 1}`;

      this.board.appendChild(button);
      this.buttons.push(button);
    });
  }

  attachEventListeners() {
    this.buttons.forEach((button) => {
      button.addEventListener("click", (e) => this.handleButtonClick(e));
    });

    const resetBtn = document.getElementById("reset-btn");
    resetBtn.addEventListener("click", () => this.resetBoard());
  }

  handleButtonClick(event) {
    const button = event.target;
    const isActive = button.dataset.active === "true";

    if (isActive) {
      button.classList.remove("active");
      button.dataset.active = "false";
    } else {
      button.classList.add("active");
      button.dataset.active = "true";
    }

    // Add a small animation effect
    const originalTransform = button.style.transform;
    button.style.transform = "translate(-50%, -50%) scale(1.2)";
    setTimeout(() => {
      button.style.transform = originalTransform;
    }, 150);
  }

  resetBoard() {
    this.buttons.forEach((button) => {
      button.classList.remove("active");
      button.dataset.active = "false";
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
});

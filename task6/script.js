'use strict';

(() => {

  const COLS = 20;          
  const ROWS = 20;          
  const MOVE_INTERVAL = 150; 

  class GameModel {
    constructor(cols, rows, moveInterval) {
      this.cols = cols;
      this.rows = rows;
      this.moveInterval = moveInterval;
      this.reset();
    }

    reset() {
      const startY = Math.floor(this.rows / 2);
      const startX = Math.floor(this.cols / 2);
      this.snake = [
        { x: startX,     y: startY },
        { x: startX - 1, y: startY },
        { x: startX - 2, y: startY },
      ];
      this.direction = { x: 1, y: 0 };    
      this.nextDirection = { x: 1, y: 0 }; 
      this.apple = null;
      this.score = 0;
      this.gameOver = false;
      this.spawnApple();
    }

    setDirection(dir) {
      if (dir.x === -this.direction.x && dir.y === -this.direction.y) {
        return;
      }
      this.nextDirection = dir;
    }

    spawnApple() {
      const freeCells = [];
      for (let y = 0; y < this.rows; y += 1) {
        for (let x = 0; x < this.cols; x += 1) {
          if (!this.isSnakeAt(x, y)) {
            freeCells.push({ x, y });
          }
        }
      }
      if (freeCells.length === 0) {
        this.apple = null;
        return;
      }
      this.apple = freeCells[Math.floor(Math.random() * freeCells.length)];
    }

    isSnakeAt(x, y) {
      return this.snake.some((segment) => segment.x === x && segment.y === y);
    }

    isAppleAt(cell) {
      return this.apple !== null && cell.x === this.apple.x && cell.y === this.apple.y;
    }

    checkCollision(cell) {
      const hitsWall = cell.x < 0 || cell.y < 0 || cell.x >= this.cols || cell.y >= this.rows;
      return hitsWall || this.isSnakeAt(cell.x, cell.y);
    }

    tick() {
      if (this.gameOver) {
        return;
      }
      this.direction = this.nextDirection;
      const newHead = {
        x: this.snake[0].x + this.direction.x,
        y: this.snake[0].y + this.direction.y,
      };

      if (this.checkCollision(newHead)) {
        this.gameOver = true;
        return;
      }

      this.moveSnake(newHead);

      if (this.isAppleAt(newHead)) {
        this.score += 1;
        this.spawnApple();
      }
    }

    moveSnake(newHead) {
      this.snake.unshift(newHead);
      if (!this.isAppleAt(newHead)) {
        this.snake.pop();
      }
    }
  }

  class GameView {
    constructor(canvas) {
      this.canvas = canvas;
      this.ctx = canvas.getContext('2d');
      this.cellSize = canvas.width / COLS;

      this.scoreElement = document.getElementById('score');
      this.overlay = document.getElementById('overlay');
      this.finalScoreElement = document.getElementById('final-score');
      this.restartButton = document.getElementById('restart-btn');
    }

    render(model) {
      this.clearField();
      this.drawApple(model.apple);
      this.drawSnake(model.snake);
    }

    clearField() {
      this.ctx.fillStyle = '#1f2430';
      this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

      // сетка из одинаковых клеток
      this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
      this.ctx.lineWidth = 1;
      for (let i = 1; i < COLS; i += 1) {
        this.ctx.beginPath();
        this.ctx.moveTo(i * this.cellSize, 0);
        this.ctx.lineTo(i * this.cellSize, this.canvas.height);
        this.ctx.stroke();
        this.ctx.beginPath();
        this.ctx.moveTo(0, i * this.cellSize);
        this.ctx.lineTo(this.canvas.width, i * this.cellSize);
        this.ctx.stroke();
      }
    }

    drawSnake(segments) {
      segments.forEach((segment, index) => {
        this.ctx.fillStyle = index === 0 ? '#a3e635' : '#2ecc71';
        this.ctx.fillRect(
          segment.x * this.cellSize + 1,
          segment.y * this.cellSize + 1,
          this.cellSize - 2,
          this.cellSize - 2,
        );
      });
    }

    drawApple(apple) {
      if (!apple) {
        return;
      }
      this.ctx.fillStyle = '#e74c3c';
      this.ctx.beginPath();
      this.ctx.arc(
        apple.x * this.cellSize + this.cellSize / 2,
        apple.y * this.cellSize + this.cellSize / 2,
        this.cellSize / 2 - 2,
        0,
        Math.PI * 2,
      );
      this.ctx.fill();
    }

    setScore(score) {
      this.scoreElement.textContent = score;
    }

    showGameOver(score) {
      this.finalScoreElement.textContent = score;
      this.overlay.classList.remove('hidden');
    }

    hideGameOver() {
      this.overlay.classList.add('hidden');
    }
  }

  class GameController {
    constructor(model, view) {
      this.model = model;
      this.view = view;
      this.running = false;
      this.lastMoveTime = 0;
      this.rafId = null;

      document.addEventListener('keydown', (event) => this.handleKeyDown(event));
      this.view.restartButton.addEventListener('click', () => this.startGame());
    }

    startGame() {
      cancelAnimationFrame(this.rafId); 
      this.model.reset();
      this.view.hideGameOver();
      this.view.setScore(this.model.score);
      this.view.render(this.model);

      this.running = true;
      this.lastMoveTime = performance.now();
      this.rafId = requestAnimationFrame((time) => this.gameLoop(time));
    }

    gameLoop(time) {
      if (!this.running) {
        return; 
      }

      if (time - this.lastMoveTime >= this.model.moveInterval) {
        this.lastMoveTime = time;
        this.model.tick();
        this.view.setScore(this.model.score);

        if (this.model.gameOver) {
          this.running = false;
          this.view.showGameOver(this.model.score);
          return;
        }
      }

      this.view.render(this.model);
      this.rafId = requestAnimationFrame((time2) => this.gameLoop(time2));
    }

    handleKeyDown(event) {
      const directions = {
        ArrowUp: { x: 0, y: -1 },
        ArrowDown: { x: 0, y: 1 },
        ArrowLeft: { x: -1, y: 0 },
        ArrowRight: { x: 1, y: 0 },
      };

      const direction = directions[event.key];
      if (direction) {
        event.preventDefault(); 
        this.model.setDirection(direction);
      }
    }
  }

  const model = new GameModel(COLS, ROWS, MOVE_INTERVAL);
  const view = new GameView(document.getElementById('board'));
  const controller = new GameController(model, view);
  controller.startGame();

})();

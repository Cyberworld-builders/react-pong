import { useState, useEffect, useRef, useCallback } from 'react';

const TetrisGame = () => {
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(parseInt(localStorage.getItem('tetrisHighScore')) || 0);
  const [gameOver, setGameOver] = useState(false);
  const canvasRef = useRef(null);
  const boardRef = useRef(Array(20).fill().map(() => Array(10).fill(0))); // 10x20 grid
  const pieceRef = useRef(null);
  const containerRef = useRef(null);
  const [canvasSize, setCanvasSize] = useState({ width: 300, height: 600, blockSize: 30 });

  // Tetromino shapes and colors
  const tetrominoes = [
    { shape: [[1, 1, 1, 1]], color: '#00F0F0' }, // I
    { shape: [[1, 1], [1, 1]], color: '#F0F000' }, // O
    { shape: [[0, 1, 0], [1, 1, 1]], color: '#A000F0' }, // T
    { shape: [[0, 1, 1], [1, 1, 0]], color: '#00F000' }, // S
    { shape: [[1, 1, 0], [0, 1, 1]], color: '#F00000' }, // Z
    { shape: [[1, 0, 0], [1, 1, 1]], color: '#0000F0' }, // J
    { shape: [[0, 0, 1], [1, 1, 1]], color: '#F0A000' }, // L
  ];

  // Dynamically adjust canvas size based on viewport
  useEffect(() => {
    const updateCanvasSize = () => {
      const containerWidth = containerRef.current.offsetWidth;
      const maxWidth = Math.min(containerWidth, 300); // Max 300px for desktop
      const blockSize = maxWidth / 10; // 10 columns
      const canvasWidth = blockSize * 10;
      const canvasHeight = blockSize * 20; // 20 rows
      setCanvasSize({ width: canvasWidth, height: canvasHeight, blockSize });
    };

    updateCanvasSize();
    window.addEventListener('resize', updateCanvasSize);
    return () => window.removeEventListener('resize', updateCanvasSize);
  }, []);

  const getRandomPiece = () => {
    const { shape, color } = tetrominoes[Math.floor(Math.random() * tetrominoes.length)];
    return {
      shape: shape.map(row => [...row]),
      color,
      x: 4, // Start near the middle
      y: 0,
    };
  };

  const draw = useCallback((ctx) => {
    const { width, height, blockSize } = canvasSize;
    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = '#111827'; // bg-gray-800
    ctx.fillRect(0, 0, width, height);

    // Draw board
    for (let y = 0; y < 20; y++) {
      for (let x = 0; x < 10; x++) {
        if (boardRef.current[y][x]) {
          ctx.fillStyle = boardRef.current[y][x];
          ctx.fillRect(x * blockSize, y * blockSize, blockSize - 1, blockSize - 1);
        }
      }
    }

    // Draw current piece
    if (pieceRef.current) {
      const { shape, x, y, color } = pieceRef.current;
      for (let py = 0; py < shape.length; py++) {
        for (let px = 0; px < shape[py].length; px++) {
          if (shape[py][px]) {
            ctx.fillStyle = color;
            ctx.fillRect((x + px) * blockSize, (y + py) * blockSize, blockSize - 1, blockSize - 1);
          }
        }
      }
    }

    // Draw score
    ctx.font = `${blockSize * 0.5}px monospace`; // Scale font with block size
    ctx.fillStyle = '#FFFFFF';
    ctx.fillText(`Score: ${score}`, blockSize * 0.33, blockSize * 0.66);
    ctx.fillText(`High Score: ${highScore}`, width - blockSize * 4, blockSize * 0.66);
  }, [score, highScore, canvasSize]);

  const checkCollision = (piece, board, dx = 0, dy = 0) => {
    for (let y = 0; y < piece.shape.length; y++) {
      for (let x = 0; x < piece.shape[y].length; x++) {
        if (piece.shape[y][x]) {
          const newX = piece.x + x + dx;
          const newY = piece.y + y + dy;
          if (newX < 0 || newX >= 10 || newY >= 20 || (newY >= 0 && board[newY][newX])) {
            return true;
          }
        }
      }
    }
    return false;
  };

  const mergePiece = (piece, board) => {
    for (let y = 0; y < piece.shape.length; y++) {
      for (let x = 0; x < piece.shape[y].length; x++) {
        if (piece.shape[y][x]) {
          const boardY = piece.y + y;
          if (boardY >= 0) {
            board[boardY][piece.x + x] = piece.color;
          }
        }
      }
    }
  };

  const clearRows = (board) => {
    let rowsCleared = 0;
    for (let y = board.length - 1; y >= 0; y--) {
      if (board[y].every(cell => cell !== 0)) {
        board.splice(y, 1);
        board.unshift(Array(10).fill(0));
        rowsCleared++;
        y++;
      }
    }
    return rowsCleared;
  };

  const rotatePiece = (piece) => {
    const newShape = Array(piece.shape[0].length).fill().map(() => Array(piece.shape.length).fill(0));
    for (let y = 0; y < piece.shape.length; y++) {
      for (let x = 0; x < piece.shape[y].length; x++) {
        newShape[x][piece.shape.length - 1 - y] = piece.shape[y][x];
      }
    }
    const newPiece = { ...piece, shape: newShape };
    if (!checkCollision(newPiece, boardRef.current)) {
      piece.shape = newShape;
    }
  };

  const updateGame = useCallback(() => {
    if (gameOver) return;

    if (!pieceRef.current) {
      pieceRef.current = getRandomPiece();
      if (checkCollision(pieceRef.current, boardRef.current)) {
        setGameOver(true);
        return;
      }
    }

    const piece = pieceRef.current;
    if (!checkCollision(piece, boardRef.current, 0, 1)) {
      piece.y += 1;
    } else {
      mergePiece(piece, boardRef.current);
      const rowsCleared = clearRows(boardRef.current);
      setScore(s => {
        const newScore = s + rowsCleared * 100;
        if (newScore > highScore) {
          setHighScore(newScore);
          localStorage.setItem('tetrisHighScore', newScore);
        }
        return newScore;
      });
      pieceRef.current = null;
    }
  }, [gameOver, highScore]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    let animationFrameId;
    let lastTime = 0;
    const dropInterval = 1000;

    const gameLoop = (time) => {
      if (time - lastTime >= dropInterval) {
        updateGame();
        lastTime = time;
      }
      draw(ctx);
      if (!gameOver) {
        animationFrameId = requestAnimationFrame(gameLoop);
      }
    };

    gameLoop(0);

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [gameOver, draw, updateGame]);

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (gameOver) return;
      const piece = pieceRef.current;
      if (!piece) return;

      if (e.key === 'ArrowLeft' && !checkCollision(piece, boardRef.current, -1, 0)) {
        piece.x -= 1;
      }
      if (e.key === 'ArrowRight' && !checkCollision(piece, boardRef.current, 1, 0)) {
        piece.x += 1;
      }
      if (e.key === 'ArrowDown' && !checkCollision(piece, boardRef.current, 0, 1)) {
        piece.y += 1;
      }
      if (e.key === 'ArrowUp') {
        rotatePiece(piece);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [gameOver]);

  // Touch controls
  useEffect(() => {
    const canvas = canvasRef.current;
    let touchStartX = 0;
    let touchStartY = 0;
    let touchStartTime = 0;

    const handleTouchStart = (e) => {
      if (gameOver) return;
      e.preventDefault();
      const touch = e.touches[0];
      touchStartX = touch.clientX;
      touchStartY = touch.clientY;
      touchStartTime = Date.now();
    };

    const handleTouchMove = (e) => {
      if (gameOver) return;
      e.preventDefault();
      const piece = pieceRef.current;
      if (!piece) return;

      const touch = e.touches[0];
      const deltaX = touch.clientX - touchStartX;
      const deltaY = touch.clientY - touchStartY;

      // Swipe left/right
      if (Math.abs(deltaX) > 30) {
        if (deltaX < 0 && !checkCollision(piece, boardRef.current, -1, 0)) {
          piece.x -= 1;
        } else if (deltaX > 0 && !checkCollision(piece, boardRef.current, 1, 0)) {
          piece.x += 1;
        }
        touchStartX = touch.clientX; // Reset to avoid repeated moves
      }

      // Swipe down
      if (deltaY > 30 && !checkCollision(piece, boardRef.current, 0, 1)) {
        piece.y += 1;
        touchStartY = touch.clientY;
      }
    };

    const handleTouchEnd = (e) => {
      if (gameOver) return;
      e.preventDefault();
      const piece = pieceRef.current;
      if (!piece) return;

      // Detect tap for rotation (less than 200ms and minimal movement)
      const touchDuration = Date.now() - touchStartTime;
      const touch = e.changedTouches[0];
      const deltaX = touch.clientX - touchStartX;
      const deltaY = touch.clientY - touchStartY;
      if (touchDuration < 200 && Math.abs(deltaX) < 10 && Math.abs(deltaY) < 10) {
        rotatePiece(piece);
      }
    };

    canvas.addEventListener('touchstart', handleTouchStart);
    canvas.addEventListener('touchmove', handleTouchMove);
    canvas.addEventListener('touchend', handleTouchEnd);
    return () => {
      canvas.removeEventListener('touchstart', handleTouchStart);
      canvas.removeEventListener('touchmove', handleTouchMove);
      canvas.removeEventListener('touchend', handleTouchEnd);
    };
  }, [gameOver]);

  const restartGame = () => {
    boardRef.current = Array(20).fill().map(() => Array(10).fill(0));
    pieceRef.current = null;
    setScore(0);
    setGameOver(false);
  };

  return (
    <div ref={containerRef} className="w-full max-w-[300px] mx-auto">
      <canvas
        ref={canvasRef}
        width={canvasSize.width}
        height={canvasSize.height}
        className="w-full h-auto bg-gray-800 border-2 border-gray-600"
      />
      {gameOver && (
        <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50">
          <div className="text-center text-white">
            <h2 className="text-xl sm:text-2xl mb-4">Game Over</h2>
            <button
              className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded text-sm sm:text-base"
              onClick={restartGame}
            >
              Restart
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

function App() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900 p-4">
      <h1 className="text-3xl sm:text-4xl text-white font-bold mb-4">Tetris</h1>
      <TetrisGame />
    </div>
  );
}

export default App;
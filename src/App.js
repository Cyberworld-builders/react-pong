import { useState, useEffect, useRef } from 'react';

const PongGame = () => {
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(parseInt(localStorage.getItem('pongHighScore')) || 0);
  const [gameOver, setGameOver] = useState(false);
  const canvasRef = useRef(null);
  const paddleRef = useRef({ x: 260, width: 80, height: 10 });
  const ballRef = useRef({ x: 300, y: 400, dx: 4, dy: -4, radius: 8 });
  const canvasWidth = 600;
  const canvasHeight = 400;

  const draw = (ctx) => {
    ctx.clearRect(0, 0, canvasWidth, canvasHeight);
    ctx.fillStyle = '#1E40AF';
    ctx.fillRect(paddleRef.current.x, canvasHeight - 20, paddleRef.current.width, paddleRef.current.height);
    ctx.beginPath();
    ctx.arc(ballRef.current.x, ballRef.current.y, ballRef.current.radius, 0, Math.PI * 2);
    ctx.fillStyle = '#EF4444';
    ctx.fill();
    ctx.closePath();
    ctx.font = '16px monospace';
    ctx.fillStyle = '#FFFFFF';
    ctx.fillText(`Score: ${score}`, 10, 20);
    ctx.fillText(`High Score: ${highScore}`, 500, 20);
  };

  const updateGame = () => {
    if (gameOver) return;
    const ball = ballRef.current;
    ball.x += ball.dx;
    ball.y += ball.dy;

    if (ball.x + ball.radius > canvasWidth || ball.x - ball.radius < 0) ball.dx = -ball.dx;
    if (ball.y - ball.radius < 0) ball.dy = -ball.dy;

    if (
      ball.y + ball.radius > canvasHeight - 20 &&
      ball.x > paddleRef.current.x &&
      ball.x < paddleRef.current.x + paddleRef.current.width
    ) {
      ball.dy = -ball.dy;
      setScore((s) => {
        const newScore = s + 1;
        if (newScore > highScore) {
          setHighScore(newScore);
          localStorage.setItem('pongHighScore', newScore);
        }
        return newScore;
      });
    }

    if (ball.y + ball.radius > canvasHeight) {
      setGameOver(true);
    }
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const gameLoop = () => {
      updateGame();
      draw(ctx);
      if (!gameOver) requestAnimationFrame(gameLoop);
    };
    gameLoop();
  }, [gameOver]);

  const handleMouseMove = (e) => {
    const rect = canvasRef.current.getBoundingClientRect();
    const newX = e.clientX - rect.left - paddleRef.current.width / 2;
    if (newX >= 0 && newX <= canvasWidth - paddleRef.current.width) {
      paddleRef.current.x = newX;
    }
  };

  const restartGame = () => {
    ballRef.current = { x: 300, y: 400, dx: 4, dy: -4, radius: 8 };
    setScore(0);
    setGameOver(false);
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const gameLoop = () => {
      updateGame();
      draw(ctx);
      if (!gameOver) requestAnimationFrame(gameLoop);
    };
    gameLoop();
  };

  return (
    <div className="relative">
      <canvas
        ref={canvasRef}
        width={canvasWidth}
        height={canvasHeight}
        className="bg-gray-800 border-2 border-gray-600"
        onMouseMove={handleMouseMove}
      />
      {gameOver && (
        <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50">
          <div className="text-center text-white">
            <h2 className="text-2xl mb-4">Game Over</h2>
            <button
              className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
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
    <div className="flex flex-col items-center justify-center h-screen bg-gray-900">
      <h1 className="text-4xl text-white font-bold mb-4">Pong</h1>
      <PongGame />
    </div>
  );
}

export default App;
import React, { useState, useEffect } from 'react';
import { soundEngine } from '../../utils/soundEngine';
import { ArrowLeft, Play, RotateCcw, Shield, Terminal, Key, Cpu, Zap } from 'lucide-react';
import confetti from 'canvas-confetti';

const GRID_SIZE = 10;

export default function CyberMazeGame({ onGameEnd, onBack }) {
  const [gameState, setGameState] = useState('menu');
  const [level, setLevel] = useState(1);
  const [score, setScore] = useState(0);
  const [playerPos, setPlayerPos] = useState({ x: 0, y: 0 });
  const [nodesLeft, setNodesLeft] = useState(0);
  const [grid, setGrid] = useState([]);
  const [drones, setDrones] = useState([]);
  const [creditsEarned, setCreditsEarned] = useState(0);

  // Generate Maze Level
  const initLevel = (lvl) => {
    const newGrid = Array.from({ length: GRID_SIZE }, () => Array(GRID_SIZE).fill(0));
    let nodesCount = 3 + lvl;

    // Walls
    for (let i = 0; i < 16 + lvl * 2; i++) {
      const rx = Math.floor(Math.random() * GRID_SIZE);
      const ry = Math.floor(Math.random() * GRID_SIZE);
      if ((rx !== 0 || ry !== 0) && (rx !== GRID_SIZE - 1 || ry !== GRID_SIZE - 1)) {
        newGrid[ry][rx] = 1; // Wall
      }
    }

    // Place Data Nodes (2)
    let placed = 0;
    while (placed < nodesCount) {
      const rx = Math.floor(Math.random() * GRID_SIZE);
      const ry = Math.floor(Math.random() * GRID_SIZE);
      if (newGrid[ry][rx] === 0 && (rx !== 0 || ry !== 0)) {
        newGrid[ry][rx] = 2; // Data Node
        placed++;
      }
    }

    // Exit Gate (3)
    newGrid[GRID_SIZE - 1][GRID_SIZE - 1] = 3;

    // Security Drones
    const droneList = [];
    for (let d = 0; d < Math.min(4, 1 + lvl); d++) {
      droneList.push({
        x: Math.floor(Math.random() * (GRID_SIZE - 2)) + 1,
        y: Math.floor(Math.random() * (GRID_SIZE - 2)) + 1,
        dx: Math.random() > 0.5 ? 1 : -1
      });
    }

    setGrid(newGrid);
    setPlayerPos({ x: 0, y: 0 });
    setNodesLeft(nodesCount);
    setDrones(droneList);
  };

  const movePlayer = (dx, dy) => {
    if (gameState !== 'playing') return;

    const nx = playerPos.x + dx;
    const ny = playerPos.y + dy;

    if (nx >= 0 && nx < GRID_SIZE && ny >= 0 && ny < GRID_SIZE && grid[ny][nx] !== 1) {
      soundEngine.playMenuClick();
      setPlayerPos({ x: nx, y: ny });

      // Collect node
      if (grid[ny][nx] === 2) {
        soundEngine.playPowerup();
        const updatedGrid = grid.map(row => [...row]);
        updatedGrid[ny][nx] = 0;
        setGrid(updatedGrid);

        const newScore = score + 150;
        setScore(newScore);
        const remaining = nodesLeft - 1;
        setNodesLeft(remaining);

        if (remaining === 0) {
          soundEngine.playAchievement();
        }
      }

      // Exit
      if (nx === GRID_SIZE - 1 && ny === GRID_SIZE - 1) {
        if (nodesLeft === 0) {
          soundEngine.playAchievement();
          confetti({ particleCount: 30, spread: 50 });
          const nextLvl = level + 1;
          setLevel(nextLvl);
          setScore(score + 300);
          initLevel(nextLvl);
        }
      }
    }
  };

  // Drone movement loop
  useEffect(() => {
    if (gameState !== 'playing') return;

    const interval = setInterval(() => {
      setDrones(prevDrones => {
        return prevDrones.map(d => {
          let nx = d.x + d.dx;
          let ndx = d.dx;

          if (nx < 0 || nx >= GRID_SIZE || grid[d.y][nx] === 1) {
            ndx *= -1;
            nx = d.x + ndx;
          }

          // Check drone collision with player
          if (nx === playerPos.x && d.y === playerPos.y) {
            soundEngine.playExplosion();
            endGame();
          }

          return { ...d, x: nx, dx: ndx };
        });
      });
    }, 500);

    return () => clearInterval(interval);
  }, [gameState, playerPos, grid]);

  // Keyboard handler
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.code === 'ArrowUp' || e.code === 'KeyW') movePlayer(0, -1);
      if (e.code === 'ArrowDown' || e.code === 'KeyS') movePlayer(0, 1);
      if (e.code === 'ArrowLeft' || e.code === 'KeyA') movePlayer(-1, 0);
      if (e.code === 'ArrowRight' || e.code === 'KeyD') movePlayer(1, 0);
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [playerPos, gameState, grid, nodesLeft]);

  const endGame = () => {
    const creds = Math.floor(score / 5);
    setCreditsEarned(creds);
    setGameState('gameover');
    if (onGameEnd) {
      onGameEnd({ score, credits: creds, gameId: 'cyber_maze' });
    }
  };

  const startGame = () => {
    setScore(0);
    setLevel(1);
    initLevel(1);
    setGameState('playing');
  };

  return (
    <div className="flex flex-col items-center justify-center w-full max-w-4xl mx-auto p-4">
      {/* Header */}
      <div className="w-full flex items-center justify-between glass-card p-4 mb-4">
        <button onClick={onBack} className="btn-cyan text-sm flex items-center gap-2">
          <ArrowLeft size={16} /> Exit Game
        </button>

        <div className="text-center font-orbitron">
          <h2 className="text-xl font-bold text-green-400 glow-cyan">CYBER MAZE RUNNER</h2>
          <p className="text-xs text-gray-400">Hacker Grid Protocol</p>
        </div>

        <div className="flex items-center gap-2 font-retro text-xs text-yellow-400">
          <Terminal size={16} /> LEVEL {level}
        </div>
      </div>

      <div className="relative w-full glass-card p-6 rounded-xl flex flex-col items-center justify-center scanlines">
        {gameState === 'playing' && (
          <div className="w-full max-w-md flex justify-between items-center mb-4 font-orbitron">
            <span className="text-sm text-cyan-400">DATA NODES REMAINING: <b className="text-yellow-400">{nodesLeft}</b></span>
            <span className="text-sm text-purple-400 font-bold">SCORE: {score}</span>
          </div>
        )}

        {/* Maze Grid */}
        <div className="grid grid-cols-10 gap-1 bg-slate-950 p-3 rounded-xl border border-cyan-500/30">
          {grid.map((row, ry) =>
            row.map((cell, rx) => {
              const isPlayer = playerPos.x === rx && playerPos.y === ry;
              const isDrone = drones.some(d => d.x === rx && d.y === ry);

              return (
                <div
                  key={`${rx}-${ry}`}
                  className={`w-8 h-8 md:w-11 md:h-11 rounded-md flex items-center justify-center transition-all ${
                    cell === 1
                      ? 'bg-slate-800 border border-slate-700'
                      : cell === 2
                      ? 'bg-yellow-500/20 border border-yellow-400/60 animate-pulse'
                      : cell === 3
                      ? nodesLeft === 0 ? 'bg-cyan-500/40 border border-cyan-400 animate-bounce' : 'bg-slate-900 border border-slate-700'
                      : 'bg-slate-900/60 border border-cyan-500/10'
                  }`}
                >
                  {isPlayer ? (
                    <div className="w-6 h-6 rounded-full bg-cyan-400 shadow-[0_0_12px_#00f3ff] animate-ping" />
                  ) : isDrone ? (
                    <div className="w-6 h-6 rounded-full bg-red-500 shadow-[0_0_12px_#ff0055]" />
                  ) : cell === 2 ? (
                    <Cpu size={18} className="text-yellow-400" />
                  ) : cell === 3 ? (
                    <Key size={18} className={nodesLeft === 0 ? 'text-cyan-400' : 'text-gray-600'} />
                  ) : null}
                </div>
              );
            })
          )}
        </div>

        {/* Controls D-Pad for Touch/Click */}
        {gameState === 'playing' && (
          <div className="flex flex-col items-center gap-1 mt-6">
            <button onClick={() => movePlayer(0, -1)} className="btn-cyan py-2 px-4 text-xs font-bold">▲ UP</button>
            <div className="flex gap-2">
              <button onClick={() => movePlayer(-1, 0)} className="btn-cyan py-2 px-4 text-xs font-bold">◄ LEFT</button>
              <button onClick={() => movePlayer(0, 1)} className="btn-cyan py-2 px-4 text-xs font-bold">▼ DOWN</button>
              <button onClick={() => movePlayer(1, 0)} className="btn-cyan py-2 px-4 text-xs font-bold">► RIGHT</button>
            </div>
          </div>
        )}

        {/* Start Overlay */}
        {gameState === 'menu' && (
          <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-slate-950/90 backdrop-blur-md p-6">
            <h1 className="text-3xl md:text-4xl font-black font-orbitron text-green-400 glow-cyan mb-2 text-center">
              CYBER MAZE RUNNER
            </h1>
            <p className="text-gray-300 text-sm mb-6 max-w-md text-center">
              Infiltrate the mainframe! Collect all Data Nodes and escape through the exit portal while dodging red ICE security bots.
            </p>

            <button onClick={startGame} className="btn-cyan text-lg px-8 py-3 rounded-xl flex items-center gap-3 animated-glow">
              <Play fill="currentColor" /> START HACK
            </button>
          </div>
        )}

        {/* Game Over */}
        {gameState === 'gameover' && (
          <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-slate-950/95 backdrop-blur-lg p-6">
            <h2 className="text-3xl font-black font-orbitron text-red-500 glow-magenta mb-2">
              SECURITY BUSTED!
            </h2>

            <div className="glass-card-magenta p-6 rounded-2xl w-full max-w-sm flex flex-col items-center gap-3 mb-6">
              <div className="text-xs text-gray-400 font-retro">TOTAL SCORE</div>
              <div className="text-3xl font-extrabold text-cyan-400 glow-cyan font-orbitron">{score}</div>

              <div className="flex justify-between w-full text-xs text-gray-400 font-orbitron mt-2">
                <span>MAX LEVEL REACHED:</span>
                <span className="text-green-400 font-bold">LEVEL {level}</span>
              </div>

              <div className="w-full border-t border-red-500/30 my-2" />

              <div className="flex items-center justify-between w-full text-sm font-orbitron">
                <span className="text-gray-400">CREDITS EARNED:</span>
                <span className="text-yellow-400 font-bold glow-gold">+{creditsEarned} 🪙</span>
              </div>
            </div>

            <div className="flex gap-4">
              <button onClick={startGame} className="btn-cyan text-md px-6 py-3 rounded-xl flex items-center gap-2">
                <RotateCcw size={18} /> RETRY MAZE
              </button>
              <button onClick={onBack} className="btn-magenta text-md px-6 py-3 rounded-xl">
                RETURN TO HUB
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

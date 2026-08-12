import React, { useState, useEffect, useRef } from 'react';
import { soundEngine } from '../../utils/soundEngine';
import { ArrowLeft, Play, RotateCcw, Zap, Music, Disc } from 'lucide-react';
import confetti from 'canvas-confetti';

const LANES = [
  { id: 0, key: 'A', arrow: '←', color: '#00f3ff', bg: 'rgba(0, 243, 255, 0.15)' },
  { id: 1, key: 'S', arrow: '↓', color: '#a855f7', bg: 'rgba(168, 85, 247, 0.15)' },
  { id: 2, key: 'K', arrow: '↑', color: '#ff0055', bg: 'rgba(255, 0, 85, 0.15)' },
  { id: 3, key: 'L', arrow: '→', color: '#ffb703', bg: 'rgba(255, 183, 3, 0.15)' }
];

export default function NeonPulseGame({ onGameEnd, onBack }) {
  const [gameState, setGameState] = useState('menu'); // 'menu' | 'playing' | 'gameover'
  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(0);
  const [maxCombo, setMaxCombo] = useState(0);
  const [multiplier, setMultiplier] = useState(1);
  const [feedback, setFeedback] = useState(null);
  const [timeLeft, setTimeLeft] = useState(45);
  const [creditsEarned, setCreditsEarned] = useState(0);

  const notesRef = useRef([]);
  const canvasRef = useRef(null);

  useEffect(() => {
    if (gameState !== 'playing') return;

    soundEngine.startBgm();
    let animId;
    let spawnTimer = 0;
    let currentScore = 0;
    let currentCombo = 0;
    let maxC = 0;
    let timer = 45;

    const timerInterval = setInterval(() => {
      timer -= 1;
      setTimeLeft(timer);
      if (timer <= 0) {
        clearInterval(timerInterval);
        endGame(currentScore, maxC);
      }
    }, 1000);

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    canvas.width = 600;
    canvas.height = 500;

    const laneWidth = canvas.width / 4;
    const hitLineY = canvas.height - 70;

    // Handle Keyboard input
    const handleKeyDown = (e) => {
      const keyMap = {
        'KeyA': 0, 'ArrowLeft': 0,
        'KeyS': 1, 'ArrowDown': 1,
        'KeyK': 2, 'ArrowUp': 2,
        'KeyL': 3, 'ArrowRight': 3
      };

      const laneId = keyMap[e.code];
      if (laneId !== undefined) {
        triggerHit(laneId);
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    const triggerHit = (laneId) => {
      // Find closest note in this lane near hit line
      const noteIdx = notesRef.current.findIndex(n => n.lane === laneId && !n.hit && Math.abs(n.y - hitLineY) < 60);

      if (noteIdx !== -1) {
        const note = notesRef.current[noteIdx];
        note.hit = true;
        const diff = Math.abs(note.y - hitLineY);

        let earned = 0;
        let txt = '';
        if (diff < 18) {
          earned = 100;
          txt = 'PERFECT!';
          soundEngine.playAchievement();
          confetti({ particleCount: 15, spread: 40, origin: { y: 0.8 } });
        } else if (diff < 35) {
          earned = 50;
          txt = 'GREAT!';
          soundEngine.playPowerup();
        } else {
          earned = 20;
          txt = 'OK';
          soundEngine.playMenuClick();
        }

        currentCombo++;
        if (currentCombo > maxC) maxC = currentCombo;
        const mult = currentCombo > 20 ? 4 : currentCombo > 10 ? 2 : 1;
        currentScore += earned * mult;

        setScore(currentScore);
        setCombo(currentCombo);
        setMaxCombo(maxC);
        setMultiplier(mult);
        setFeedback({ text: txt, color: LANES[laneId].color });
      } else {
        // Miss tap
        currentCombo = 0;
        setCombo(0);
        setMultiplier(1);
        setFeedback({ text: 'MISS!', color: '#ff0055' });
        soundEngine.playHit();
      }
    };

    const endGame = (finalScore, topCombo) => {
      soundEngine.stopBgm();
      cancelAnimationFrame(animId);
      const creds = Math.floor(finalScore / 8);
      setCreditsEarned(creds);
      setGameState('gameover');
      if (onGameEnd) {
        onGameEnd({ score: finalScore, credits: creds, gameId: 'neon_pulse' });
      }
    };

    // Render loop
    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Draw Lanes
      LANES.forEach((lane, idx) => {
        const x = idx * laneWidth;
        ctx.fillStyle = lane.bg;
        ctx.fillRect(x, 0, laneWidth, canvas.height);

        ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
        ctx.lineWidth = 1;
        ctx.strokeRect(x, 0, laneWidth, canvas.height);
      });

      // Draw Hit Target Line
      ctx.strokeStyle = '#00f3ff';
      ctx.lineWidth = 4;
      ctx.shadowColor = '#00f3ff';
      ctx.shadowBlur = 15;
      ctx.beginPath();
      ctx.moveTo(0, hitLineY);
      ctx.lineTo(canvas.width, hitLineY);
      ctx.stroke();

      // Spawn Notes
      spawnTimer++;
      if (spawnTimer % 28 === 0) {
        const randomLane = Math.floor(Math.random() * 4);
        notesRef.current.push({
          lane: randomLane,
          y: -20,
          speed: 6,
          hit: false
        });
      }

      // Update & Draw Notes
      notesRef.current.forEach((n, idx) => {
        n.y += n.speed;

        if (!n.hit) {
          const lane = LANES[n.lane];
          const x = n.lane * laneWidth + laneWidth / 2;

          ctx.shadowColor = lane.color;
          ctx.shadowBlur = 12;
          ctx.fillStyle = lane.color;
          ctx.beginPath();
          ctx.arc(x, n.y, 22, 0, Math.PI * 2);
          ctx.fill();

          ctx.fillStyle = '#000';
          ctx.font = '14px Orbitron';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(lane.key, x, n.y);
        }

        // Missed note past line
        if (n.y > canvas.height + 20) {
          if (!n.hit) {
            currentCombo = 0;
            setCombo(0);
            setMultiplier(1);
            setFeedback({ text: 'MISS!', color: '#ff0055' });
          }
          notesRef.current.splice(idx, 1);
        }
      });

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);

    return () => {
      clearInterval(timerInterval);
      cancelAnimationFrame(animId);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [gameState]);

  const startGame = () => {
    soundEngine.playMenuClick();
    notesRef.current = [];
    setScore(0);
    setCombo(0);
    setMaxCombo(0);
    setMultiplier(1);
    setTimeLeft(45);
    setFeedback(null);
    setGameState('playing');
  };

  return (
    <div className="flex flex-col items-center justify-center w-full max-w-4xl mx-auto p-4">
      {/* Header Bar */}
      <div className="w-full flex items-center justify-between glass-card p-4 mb-4">
        <button onClick={onBack} className="btn-cyan text-sm flex items-center gap-2">
          <ArrowLeft size={16} /> Exit Game
        </button>

        <div className="text-center font-orbitron">
          <h2 className="text-xl font-bold text-magenta-400 glow-magenta">NEON PULSE</h2>
          <p className="text-xs text-gray-400">Synth Rhythm & Reaction Arcade</p>
        </div>

        <div className="flex items-center gap-2 font-retro text-xs text-yellow-400">
          <Disc size={16} /> 45s RHYTHM BLAST
        </div>
      </div>

      {/* Main Game Box */}
      <div className="relative w-full glass-card p-4 rounded-xl flex flex-col items-center justify-center overflow-hidden scanlines">
        {gameState === 'playing' && (
          <div className="w-full max-w-[600px] flex items-center justify-between font-orbitron mb-2 px-4 z-10">
            <div className="flex flex-col">
              <span className="text-xs text-gray-400">SCORE</span>
              <span className="text-2xl font-bold text-cyan-400 glow-cyan">{score}</span>
            </div>

            {feedback && (
              <div className="text-xl font-black animate-bounce glow-magenta" style={{ color: feedback.color }}>
                {feedback.text}
              </div>
            )}

            <div className="flex flex-col items-end">
              <span className="text-xs text-purple-400 font-bold">COMBO x{multiplier}</span>
              <span className="text-xl font-bold text-yellow-400">{combo}</span>
            </div>
          </div>
        )}

        <canvas ref={canvasRef} className="bg-slate-950 rounded-xl border border-purple-500/30 max-w-full" />

        {/* On-screen touch buttons for mobile */}
        {gameState === 'playing' && (
          <div className="w-full max-w-[600px] grid grid-cols-4 gap-2 mt-4 z-10">
            {LANES.map((lane) => (
              <button
                key={lane.id}
                onClick={() => {
                  const event = new KeyboardEvent('keydown', { code: lane.id === 0 ? 'KeyA' : lane.id === 1 ? 'KeyS' : lane.id === 2 ? 'KeyK' : 'KeyL' });
                  window.dispatchEvent(event);
                }}
                className="py-4 rounded-xl font-retro text-lg font-bold transition-transform active:scale-95"
                style={{ backgroundColor: lane.bg, color: lane.color, border: `1px solid ${lane.color}` }}
              >
                {lane.key} ({lane.arrow})
              </button>
            ))}
          </div>
        )}

        {/* Start Overlay */}
        {gameState === 'menu' && (
          <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-slate-950/90 backdrop-blur-md p-6">
            <h1 className="text-4xl md:text-5xl font-black font-orbitron text-purple-400 glow-magenta mb-2 text-center">
              NEON PULSE
            </h1>
            <p className="text-gray-300 text-sm mb-6 max-w-md text-center">
              Tap the keys [A, S, K, L] or Arrow Keys as synth pulses align with the neon target line!
            </p>

            <button onClick={startGame} className="btn-magenta text-lg px-8 py-3 rounded-xl flex items-center gap-3 animated-glow">
              <Play fill="currentColor" /> START RHYTHM
            </button>
          </div>
        )}

        {/* Game Over Overlay */}
        {gameState === 'gameover' && (
          <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-slate-950/95 backdrop-blur-lg p-6">
            <h2 className="text-4xl font-black font-orbitron text-cyan-400 glow-cyan mb-2">
              TRACK COMPLETE!
            </h2>

            <div className="glass-card p-6 rounded-2xl w-full max-w-sm flex flex-col items-center gap-3 mb-6">
              <div className="text-xs text-gray-400 font-retro">FINAL SCORE</div>
              <div className="text-3xl font-extrabold text-cyan-400 glow-cyan font-orbitron">{score}</div>

              <div className="flex justify-between w-full text-xs text-gray-400 font-orbitron mt-2">
                <span>MAX COMBO:</span>
                <span className="text-purple-400 font-bold">{maxCombo}x</span>
              </div>

              <div className="w-full border-t border-purple-500/30 my-2" />

              <div className="flex items-center justify-between w-full text-sm font-orbitron">
                <span className="text-gray-400">CREDITS EARNED:</span>
                <span className="text-yellow-400 font-bold glow-gold">+{creditsEarned} 🪙</span>
              </div>
            </div>

            <div className="flex gap-4">
              <button onClick={startGame} className="btn-cyan text-md px-6 py-3 rounded-xl flex items-center gap-2">
                <RotateCcw size={18} /> REPLAY TRACK
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

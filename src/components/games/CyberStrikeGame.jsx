import React, { useRef, useEffect, useState } from 'react';
import { soundEngine } from '../../utils/soundEngine';
import { Play, RotateCcw, Shield, Zap, Flame, Trophy, Crosshair, ArrowLeft } from 'lucide-react';
import confetti from 'canvas-confetti';

export default function CyberStrikeGame({ userSettings, onGameEnd, onBack }) {
  const canvasRef = useRef(null);
  const [gameState, setGameState] = useState('menu'); // 'menu' | 'playing' | 'gameover'
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(() => parseInt(localStorage.getItem('cyber_strike_high') || '0', 10));
  const [wave, setWave] = useState(1);
  const [health, setHealth] = useState(100);
  const [shield, setShield] = useState(0);
  const [creditsEarned, setCreditsEarned] = useState(0);
  const [bossHp, setBossHp] = useState(null);

  // Active equips from props / default
  const laserColor = userSettings?.laserColor || '#00f3ff';
  const shipSkin = userSettings?.shipSkin || 'cyan';

  useEffect(() => {
    if (gameState !== 'playing') return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    // Canvas sizing
    canvas.width = Math.min(window.innerWidth - 32, 900);
    canvas.height = 550;

    let animId;
    let scoreCount = 0;
    let waveCount = 1;
    let playerHealth = 100;
    let playerShield = 0;

    // Player object
    const player = {
      x: canvas.width / 2,
      y: canvas.height - 70,
      width: 44,
      height: 44,
      speed: 7,
      triShotTimer: 0,
      speedTimer: 0
    };

    // Keys state
    const keys = { left: false, right: false, up: false, down: false, space: false };

    const handleKeyDown = (e) => {
      if (['ArrowLeft', 'KeyA'].includes(e.code)) keys.left = true;
      if (['ArrowRight', 'KeyD'].includes(e.code)) keys.right = true;
      if (['ArrowUp', 'KeyW'].includes(e.code)) keys.up = true;
      if (['ArrowDown', 'KeyS'].includes(e.code)) keys.down = true;
      if (['Space', 'KeyK'].includes(e.code)) keys.space = true;
    };

    const handleKeyUp = (e) => {
      if (['ArrowLeft', 'KeyA'].includes(e.code)) keys.left = false;
      if (['ArrowRight', 'KeyD'].includes(e.code)) keys.right = false;
      if (['ArrowUp', 'KeyW'].includes(e.code)) keys.up = false;
      if (['ArrowDown', 'KeyS'].includes(e.code)) keys.down = false;
      if (['Space', 'KeyK'].includes(e.code)) keys.space = false;
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    // Mouse movement
    const handleMouseMove = (e) => {
      const rect = canvas.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;
      player.x = Math.max(20, Math.min(canvas.width - 20, mouseX));
      player.y = Math.max(20, Math.min(canvas.height - 20, mouseY));
    };
    canvas.addEventListener('mousemove', handleMouseMove);

    // Arrays
    let bullets = [];
    let enemies = [];
    let enemyBullets = [];
    let particles = [];
    let powerups = [];
    let stars = Array.from({ length: 60 }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      size: Math.random() * 2 + 1,
      speed: Math.random() * 2 + 1
    }));

    let lastShot = 0;
    let spawnTimer = 0;
    let boss = null;

    const createExplosion = (x, y, color = '#ff0055', count = 16) => {
      soundEngine.playExplosion();
      for (let i = 0; i < count; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = Math.random() * 5 + 1;
        particles.push({
          x, y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          life: 1,
          decay: Math.random() * 0.04 + 0.02,
          color,
          size: Math.random() * 4 + 2
        });
      }
    };

    // Main Game Loop
    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Background stars
      ctx.fillStyle = '#ffffff';
      stars.forEach(s => {
        s.y += s.speed;
        if (s.y > canvas.height) {
          s.y = 0;
          s.x = Math.random() * canvas.width;
        }
        ctx.globalAlpha = Math.random() * 0.5 + 0.5;
        ctx.fillRect(s.x, s.y, s.size, s.size);
      });
      ctx.globalAlpha = 1.0;

      // Player Movement
      const currentSpeed = player.speedTimer > 0 ? player.speed * 1.5 : player.speed;
      if (keys.left && player.x > 25) player.x -= currentSpeed;
      if (keys.right && player.x < canvas.width - 25) player.x += currentSpeed;
      if (keys.up && player.y > 25) player.y -= currentSpeed;
      if (keys.down && player.y < canvas.height - 25) player.y += currentSpeed;

      if (player.triShotTimer > 0) player.triShotTimer--;
      if (player.speedTimer > 0) player.speedTimer--;

      // Shooting
      const now = Date.now();
      if ((keys.space || true) && now - lastShot > 150) { // auto fire or space
        lastShot = now;
        soundEngine.playLaser();

        if (player.triShotTimer > 0) {
          bullets.push({ x: player.x - 12, y: player.y - 20, vx: -1.5, vy: -12, color: laserColor });
          bullets.push({ x: player.x, y: player.y - 22, vx: 0, vy: -12, color: laserColor });
          bullets.push({ x: player.x + 12, y: player.y - 20, vx: 1.5, vy: -12, color: laserColor });
        } else {
          bullets.push({ x: player.x - 8, y: player.y - 20, vx: 0, vy: -12, color: laserColor });
          bullets.push({ x: player.x + 8, y: player.y - 20, vx: 0, vy: -12, color: laserColor });
        }
      }

      // Draw Player Ship
      ctx.save();
      ctx.translate(player.x, player.y);

      // Shield Aura
      if (playerShield > 0) {
        ctx.beginPath();
        ctx.arc(0, 0, 32, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(0, 243, 255, 0.8)';
        ctx.lineWidth = 3;
        ctx.shadowColor = '#00f3ff';
        ctx.shadowBlur = 15;
        ctx.stroke();
      }

      // Ship body
      ctx.shadowColor = shipSkin === 'magenta' ? '#ff0055' : shipSkin === 'gold' ? '#ffb703' : '#00f3ff';
      ctx.shadowBlur = 12;

      ctx.fillStyle = shipSkin === 'magenta' ? '#ff0055' : shipSkin === 'gold' ? '#ffb703' : '#00f3ff';
      ctx.beginPath();
      ctx.moveTo(0, -22);
      ctx.lineTo(18, 18);
      ctx.lineTo(8, 14);
      ctx.lineTo(0, 20);
      ctx.lineTo(-8, 14);
      ctx.lineTo(-18, 18);
      ctx.closePath();
      ctx.fill();

      // Engine Flame
      ctx.fillStyle = '#ff5500';
      ctx.beginPath();
      ctx.moveTo(-6, 20);
      ctx.lineTo(0, 28 + Math.random() * 8);
      ctx.lineTo(6, 20);
      ctx.closePath();
      ctx.fill();

      ctx.restore();

      // Update & Draw Bullets
      bullets.forEach((b, idx) => {
        b.x += b.vx;
        b.y += b.vy;

        ctx.shadowColor = b.color;
        ctx.shadowBlur = 10;
        ctx.fillStyle = b.color;
        ctx.fillRect(b.x - 2, b.y - 8, 4, 14);

        if (b.y < -10 || b.x < 0 || b.x > canvas.width) {
          bullets.splice(idx, 1);
        }
      });

      // Spawn Enemies
      spawnTimer++;
      if (spawnTimer % Math.max(20, 60 - waveCount * 5) === 0 && !boss) {
        const type = Math.random() > 0.4 ? 'drone' : 'cruiser';
        enemies.push({
          x: Math.random() * (canvas.width - 60) + 30,
          y: -40,
          width: type === 'drone' ? 30 : 48,
          height: type === 'drone' ? 30 : 48,
          type,
          hp: type === 'drone' ? 1 : 3,
          maxHp: type === 'drone' ? 1 : 3,
          speed: type === 'drone' ? 3 + Math.random() * 2 : 1.5,
          color: type === 'drone' ? '#ff0055' : '#a855f7'
        });
      }

      // Spawn Boss every 1000 points if not active
      if (scoreCount > 0 && scoreCount % 800 === 0 && !boss) {
        boss = {
          x: canvas.width / 2,
          y: 80,
          width: 120,
          height: 80,
          hp: 40 + waveCount * 15,
          maxHp: 40 + waveCount * 15,
          vx: 3,
          lastShoot: 0
        };
        setBossHp({ hp: boss.hp, maxHp: boss.maxHp });
      }

      // Update Boss
      if (boss) {
        boss.x += boss.vx;
        if (boss.x < 80 || boss.x > canvas.width - 80) boss.vx *= -1;

        // Boss Shoot
        if (Date.now() - boss.lastShoot > 800) {
          boss.lastShoot = Date.now();
          enemyBullets.push({ x: boss.x - 30, y: boss.y + 30, vy: 5 });
          enemyBullets.push({ x: boss.x, y: boss.y + 40, vy: 6 });
          enemyBullets.push({ x: boss.x + 30, y: boss.y + 30, vy: 5 });
        }

        // Draw Boss
        ctx.save();
        ctx.translate(boss.x, boss.y);
        ctx.shadowColor = '#ff0055';
        ctx.shadowBlur = 20;
        ctx.fillStyle = '#ff0055';
        ctx.beginPath();
        ctx.moveTo(0, 40);
        ctx.lineTo(60, -20);
        ctx.lineTo(30, -40);
        ctx.lineTo(-30, -40);
        ctx.lineTo(-60, -20);
        ctx.closePath();
        ctx.fill();

        ctx.fillStyle = '#9d00ff';
        ctx.fillRect(-20, -10, 40, 20);
        ctx.restore();
      }

      // Update & Draw Enemies
      enemies.forEach((enemy, eIdx) => {
        enemy.y += enemy.speed;

        // Draw enemy
        ctx.save();
        ctx.translate(enemy.x, enemy.y);
        ctx.shadowColor = enemy.color;
        ctx.shadowBlur = 10;
        ctx.fillStyle = enemy.color;

        if (enemy.type === 'drone') {
          ctx.beginPath();
          ctx.moveTo(0, 15);
          ctx.lineTo(-15, -15);
          ctx.lineTo(15, -15);
          ctx.closePath();
          ctx.fill();
        } else {
          ctx.fillRect(-20, -20, 40, 40);
          ctx.fillStyle = '#fff';
          ctx.fillRect(-10, -5, 20, 10);
        }
        ctx.restore();

        // Check Collision with Bullets
        bullets.forEach((b, bIdx) => {
          const dx = b.x - enemy.x;
          const dy = b.y - enemy.y;
          if (Math.abs(dx) < enemy.width / 2 && Math.abs(dy) < enemy.height / 2) {
            bullets.splice(bIdx, 1);
            enemy.hp -= 1;

            if (enemy.hp <= 0) {
              createExplosion(enemy.x, enemy.y, enemy.color);
              scoreCount += enemy.type === 'drone' ? 50 : 120;
              setScore(scoreCount);

              // Chance to drop powerup
              if (Math.random() < 0.2) {
                const pType = Math.random() < 0.5 ? 'shield' : Math.random() < 0.8 ? 'trishot' : 'speed';
                powerups.push({ x: enemy.x, y: enemy.y, type: pType, vy: 2 });
              }

              enemies.splice(eIdx, 1);
            }
          }
        });

        // Player Collision
        const pdx = player.x - enemy.x;
        const pdy = player.y - enemy.y;
        if (Math.abs(pdx) < 30 && Math.abs(pdy) < 30) {
          createExplosion(enemy.x, enemy.y, '#ff5500');
          enemies.splice(eIdx, 1);
          soundEngine.playHit();

          if (playerShield > 0) {
            playerShield -= 30;
            if (playerShield < 0) playerShield = 0;
            setShield(playerShield);
          } else {
            playerHealth -= 25;
            setHealth(playerHealth);
          }
        }

        // Out of bounds
        if (enemy.y > canvas.height + 40) {
          enemies.splice(eIdx, 1);
        }
      });

      // Boss Collision with Player Bullets
      if (boss) {
        bullets.forEach((b, bIdx) => {
          if (Math.abs(b.x - boss.x) < 55 && Math.abs(b.y - boss.y) < 35) {
            bullets.splice(bIdx, 1);
            boss.hp -= 1;
            setBossHp({ hp: boss.hp, maxHp: boss.maxHp });

            if (boss.hp <= 0) {
              createExplosion(boss.x, boss.y, '#ff0055', 40);
              scoreCount += 1000;
              setScore(scoreCount);
              waveCount += 1;
              setWave(waveCount);
              boss = null;
              setBossHp(null);
              confetti({ particleCount: 50, spread: 60, origin: { y: 0.3 } });
            }
          }
        });
      }

      // Enemy Bullets
      enemyBullets.forEach((eb, ebIdx) => {
        eb.y += eb.vy;
        ctx.shadowColor = '#ff0055';
        ctx.shadowBlur = 8;
        ctx.fillStyle = '#ff0055';
        ctx.beginPath();
        ctx.arc(eb.x, eb.y, 5, 0, Math.PI * 2);
        ctx.fill();

        // Hit player
        if (Math.abs(eb.x - player.x) < 22 && Math.abs(eb.y - player.y) < 22) {
          enemyBullets.splice(ebIdx, 1);
          soundEngine.playHit();
          if (playerShield > 0) {
            playerShield -= 20;
            if (playerShield < 0) playerShield = 0;
            setShield(playerShield);
          } else {
            playerHealth -= 15;
            setHealth(playerHealth);
          }
        }
        if (eb.y > canvas.height + 10) enemyBullets.splice(ebIdx, 1);
      });

      // Powerups Update
      powerups.forEach((pu, pIdx) => {
        pu.y += pu.vy;
        ctx.save();
        ctx.translate(pu.x, pu.y);
        ctx.fillStyle = pu.type === 'shield' ? '#00f3ff' : pu.type === 'trishot' ? '#ff0055' : '#ffb703';
        ctx.shadowColor = ctx.fillStyle;
        ctx.shadowBlur = 12;
        ctx.beginPath();
        ctx.arc(0, 0, 10, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        // Collect powerup
        if (Math.abs(pu.x - player.x) < 25 && Math.abs(pu.y - player.y) < 25) {
          soundEngine.playPowerup();
          if (pu.type === 'shield') {
            playerShield = 100;
            setShield(100);
          } else if (pu.type === 'trishot') {
            player.triShotTimer = 400;
          } else if (pu.type === 'speed') {
            player.speedTimer = 400;
          }
          powerups.splice(pIdx, 1);
        }
      });

      // Update & Draw Particles
      particles.forEach((p, pIdx) => {
        p.x += p.vx;
        p.y += p.vy;
        p.life -= p.decay;

        if (p.life <= 0) {
          particles.splice(pIdx, 1);
        } else {
          ctx.globalAlpha = p.life;
          ctx.fillStyle = p.color;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          ctx.fill();
        }
      });
      ctx.globalAlpha = 1.0;

      // Check Game Over
      if (playerHealth <= 0) {
        createExplosion(player.x, player.y, '#ff0055', 50);
        soundEngine.playExplosion();
        cancelAnimationFrame(animId);

        const finalCredits = Math.floor(scoreCount / 10);
        setCreditsEarned(finalCredits);
        setGameState('gameover');

        if (scoreCount > highScore) {
          setHighScore(scoreCount);
          localStorage.setItem('cyber_strike_high', scoreCount.toString());
        }

        if (onGameEnd) {
          onGameEnd({ score: scoreCount, credits: finalCredits, gameId: 'cyber_strike' });
        }
        return;
      }

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      canvas.removeEventListener('mousemove', handleMouseMove);
    };
  }, [gameState]);

  const startGame = () => {
    soundEngine.playMenuClick();
    soundEngine.startBgm();
    setScore(0);
    setWave(1);
    setHealth(100);
    setShield(0);
    setBossHp(null);
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
          <h2 className="text-xl font-bold text-cyan-400 glow-cyan">CYBER STRIKE</h2>
          <p className="text-xs text-gray-400">Sci-Fi Arcade Shooter</p>
        </div>

        <div className="flex items-center gap-4 font-retro text-xs">
          <div className="flex items-center gap-1 text-yellow-400">
            <Trophy size={14} /> HIGH: {highScore}
          </div>
        </div>
      </div>

      {/* Main Canvas Area */}
      <div className="relative w-full glass-card p-2 rounded-xl overflow-hidden scanlines flex justify-center items-center">
        {gameState === 'playing' && (
          <div className="absolute top-4 left-4 right-4 z-10 flex items-center justify-between pointer-events-none font-orbitron">
            {/* Health & Shield Bars */}
            <div className="flex flex-col gap-1 w-48">
              <div className="flex items-center justify-between text-xs text-cyan-400">
                <span>HULL HEALTH</span>
                <span>{health}%</span>
              </div>
              <div className="w-full h-3 bg-gray-900 rounded-full border border-cyan-500/50 overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-cyan-500 to-blue-600 transition-all duration-200"
                  style={{ width: `${Math.max(0, health)}%` }}
                />
              </div>

              {shield > 0 && (
                <div className="w-full h-2 bg-gray-900 rounded-full border border-blue-400 overflow-hidden mt-1">
                  <div className="h-full bg-cyan-400 animate-pulse" style={{ width: `${shield}%` }} />
                </div>
              )}
            </div>

            {/* Boss Bar if active */}
            {bossHp && (
              <div className="flex flex-col items-center w-64">
                <span className="text-xs font-bold text-red-500 glow-magenta animate-pulse">DREADNOUGHT BOSS</span>
                <div className="w-full h-3 bg-gray-900 rounded-full border border-red-500 overflow-hidden">
                  <div className="h-full bg-red-600 transition-all duration-150" style={{ width: `${(bossHp.hp / bossHp.maxHp) * 100}%` }} />
                </div>
              </div>
            )}

            {/* Score & Wave */}
            <div className="text-right">
              <div className="text-xl font-extrabold text-cyan-300 glow-cyan">SCORE: {score}</div>
              <div className="text-xs text-purple-400 font-bold">WAVE {wave}</div>
            </div>
          </div>
        )}

        <canvas
          ref={canvasRef}
          className="w-full h-[550px] bg-slate-950 rounded-lg cursor-crosshair border border-cyan-500/30"
        />

        {/* Start Overlay */}
        {gameState === 'menu' && (
          <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-slate-950/90 backdrop-blur-md p-6">
            <h1 className="text-4xl md:text-5xl font-black font-orbitron text-cyan-400 glow-cyan mb-2 text-center">
              CYBER STRIKE
            </h1>
            <p className="text-gray-300 text-sm mb-6 max-w-md text-center">
              Defend the neon realm! Destroy enemy droids & dreadnought bosses, collect power-ups, and earn Cyber Credits.
            </p>

            <div className="grid grid-cols-2 gap-4 mb-8 text-xs font-orbitron text-gray-400">
              <div className="glass-card p-3 flex items-center gap-2">
                <Crosshair className="text-cyan-400" /> Controls: WASD / Mouse
              </div>
              <div className="glass-card p-3 flex items-center gap-2">
                <Zap className="text-yellow-400" /> Fire: Auto / Spacebar
              </div>
            </div>

            <button onClick={startGame} className="btn-cyan text-lg px-8 py-3 rounded-xl flex items-center gap-3 animated-glow">
              <Play fill="currentColor" /> START MISSION
            </button>
          </div>
        )}

        {/* Game Over Overlay */}
        {gameState === 'gameover' && (
          <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-slate-950/95 backdrop-blur-lg p-6">
            <h2 className="text-4xl font-black font-orbitron text-red-500 glow-magenta mb-2">
              MISSION FAILED
            </h2>
            <p className="text-gray-400 text-sm mb-6 font-orbitron">HULL DESTROYED IN WAVE {wave}</p>

            <div className="glass-card-magenta p-6 rounded-2xl w-full max-w-sm flex flex-col items-center gap-3 mb-6">
              <div className="text-xs text-gray-400 font-retro">FINAL SCORE</div>
              <div className="text-3xl font-extrabold text-cyan-400 glow-cyan font-orbitron">{score}</div>

              <div className="w-full border-t border-red-500/30 my-2" />

              <div className="flex items-center justify-between w-full text-sm font-orbitron">
                <span className="text-gray-400">CREDITS EARNED:</span>
                <span className="text-yellow-400 font-bold glow-gold">+{creditsEarned} 🪙</span>
              </div>
            </div>

            <div className="flex gap-4">
              <button onClick={startGame} className="btn-cyan text-md px-6 py-3 rounded-xl flex items-center gap-2">
                <RotateCcw size={18} /> RESTART
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

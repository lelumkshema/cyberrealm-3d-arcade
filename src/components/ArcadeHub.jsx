import React from 'react';
import { soundEngine } from '../utils/soundEngine';
import { Gamepad2, Play, Trophy, Sparkles, Flame, Disc, Shield, Car, Crosshair } from 'lucide-react';

export default function ArcadeHub({ onSelectGame, stats, userProfile }) {
  const games = [
    {
      id: 'cyber_igi',
      title: 'CYBER I.G.I. CAR MISSION',
      category: 'TACTICAL CAR COMBAT',
      desc: 'Infiltrate enemy military compound in an armored recon car, destroy radars & escape via helipad!',
      badge: 'FEATURED 🌟',
      color: 'gold',
      icon: '🏎️',
      highScore: stats?.high_igi || 0,
      btnClass: 'btn-gold'
    },
    {
      id: 'cyber_strike',
      title: 'CYBER STRIKE',
      category: '2D SCI-FI SHOOTER',
      desc: 'Fight enemy drones & dreadnought bosses in deep space. Collect shields & tri-lasers!',
      badge: 'POPULAR',
      color: 'cyan',
      icon: '🚀',
      highScore: stats?.high_strike || 0,
      btnClass: 'btn-cyan'
    },
    {
      id: 'neon_pulse',
      title: 'NEON PULSE',
      category: 'SYNTH RHYTHM ARCADE',
      desc: 'Match incoming beat waves in perfect rhythm for massive combo multipliers!',
      badge: 'RHYTHM',
      color: 'magenta',
      icon: '⚡',
      highScore: stats?.high_pulse || 0,
      btnClass: 'btn-magenta'
    },
    {
      id: 'cyber_maze',
      title: 'CYBER MAZE RUNNER',
      category: 'HACKER PROTOCOL PUZZLE',
      desc: 'Navigate mainframe grids, dodge red ICE security drones, and download data nodes!',
      badge: 'PUZZLE',
      color: 'gold',
      icon: '🔑',
      highScore: stats?.high_maze || 0,
      btnClass: 'btn-cyan'
    }
  ];

  return (
    <div className="w-full max-w-6xl mx-auto p-4 font-outfit">
      {/* Hero Welcome Banner */}
      <div className="relative glass-card p-8 md:p-12 rounded-3xl mb-10 overflow-hidden scanlines">
        <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-2 neon-badge mb-4">
            <Sparkles size={12} /> WELCOME BACK, {userProfile?.username || 'CYBER RIDER'}
          </div>

          <h1 className="text-4xl md:text-6xl font-black font-orbitron text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-500 glow-cyan leading-tight mb-4">
            CYBER REALM ARCADE
          </h1>

          <p className="text-gray-300 text-base md:text-lg mb-8 leading-relaxed">
            Enter the ultimate sci-fi web gaming arena. Compete in retro-futuristic arcade challenges, earn Cyber Credits, unlock plasma gear, and dominate the global leaderboards!
          </p>

          <div className="flex flex-wrap items-center gap-4">
            <button
              onClick={() => {
                soundEngine.playMenuClick();
                onSelectGame('cyber_igi');
              }}
              className="btn-gold text-base px-8 py-3.5 rounded-xl flex items-center gap-3 animated-glow"
            >
              <Play fill="currentColor" size={18} /> PLAY NEW: CYBER I.G.I. CAR MISSION
            </button>

            <button
              onClick={() => {
                soundEngine.playMenuClick();
                soundEngine.startBgm();
              }}
              className="glass-card px-5 py-3 rounded-xl flex items-center gap-2 text-xs font-orbitron text-gray-300 hover:text-cyan-400 transition-colors"
            >
              <Disc className="text-purple-400 animate-spin" size={16} /> PLAY SYNTHWAVE RADIO
            </button>
          </div>
        </div>
      </div>

      {/* Game Cards Section */}
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-2xl font-bold font-orbitron text-cyan-400 glow-cyan flex items-center gap-2">
          <Gamepad2 /> ARCADE GAME MATRIX
        </h2>
        <span className="text-xs text-gray-400 font-retro">SELECT AN ARENA TO PLAY</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {games.map((game) => (
          <div
            key={game.id}
            className="glass-card p-6 rounded-2xl flex flex-col justify-between relative group hover:-translate-y-2 transition-all duration-300 border border-cyan-500/20 hover:border-cyan-400/60"
          >
            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="text-3xl p-3 rounded-xl bg-slate-900 border border-cyan-500/30">
                  {game.icon}
                </span>
                <span className="neon-badge">{game.badge}</span>
              </div>

              <span className="text-xs font-bold font-retro text-purple-400">{game.category}</span>
              <h3 className="text-xl font-black font-orbitron text-gray-100 mt-1 group-hover:text-cyan-300 transition-colors">
                {game.title}
              </h3>
              <p className="text-xs text-gray-400 mt-2 leading-relaxed">{game.desc}</p>
            </div>

            <div className="mt-8 pt-4 border-t border-cyan-500/10 flex items-center justify-between">
              <div className="flex flex-col font-orbitron">
                <span className="text-[10px] text-gray-500">YOUR HIGH SCORE</span>
                <span className="text-sm font-bold text-yellow-400 glow-gold">
                  {game.highScore} PTS
                </span>
              </div>

              <button
                onClick={() => {
                  soundEngine.playMenuClick();
                  onSelectGame(game.id);
                }}
                className={`${game.btnClass} text-xs px-4 py-2 rounded-lg flex items-center gap-2`}
              >
                <Play fill="currentColor" size={14} /> PLAY
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

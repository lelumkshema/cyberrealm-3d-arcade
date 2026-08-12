import React, { useState } from 'react';
import { soundEngine } from '../utils/soundEngine';
import { Trophy, Award, Flame, Star, Medal, UserCheck } from 'lucide-react';

const BADGES = [
  { id: 'first_win', name: 'First Blood', desc: 'Score your first 100 points in any game.', icon: '🎯' },
  { id: 'igi_master', name: 'I.G.I. Commander', desc: 'Complete a tactical car infiltration mission.', icon: '🏎️' },
  { id: 'score_1000', name: 'High Roller', desc: 'Reach a score of 1,000 in Cyber Strike.', icon: '💥' },
  { id: 'rhythm_master', name: 'Synth Maestro', desc: 'Get a 20x combo in Neon Pulse.', icon: '⚡' },
  { id: 'hacker_pro', name: 'Grid Ghost', desc: 'Reach Level 3 in Cyber Maze.', icon: '🔑' },
  { id: 'shopaholic', name: 'Armory Collector', desc: 'Unlock any skin or laser in the Shop.', icon: '🛍️' }
];

export default function Leaderboard({ stats, userProfile, onUpdateName }) {
  const [activeTab, setActiveTab] = useState('igi');
  const [editingName, setEditingName] = useState(false);
  const [nameInput, setNameInput] = useState(userProfile?.username || 'CyberRider');

  const handleSaveName = () => {
    soundEngine.playAchievement();
    onUpdateName(nameInput);
    setEditingName(false);
  };

  const getScoresForGame = () => {
    const raw = localStorage.getItem(`scores_${activeTab}`);
    if (raw) {
      try {
        return JSON.parse(raw);
      } catch (e) {
        return [];
      }
    }
    return [
      { name: userProfile?.username || 'CyberRider', score: stats?.[`high_${activeTab}`] || 850, date: 'Today' },
      { name: 'Vortex_Rider', score: 1450, date: '2 hours ago' },
      { name: 'TacticalDriver', score: 1100, date: 'Yesterday' },
      { name: 'NeonPulse99', score: 980, date: '3 days ago' }
    ].sort((a, b) => b.score - a.score);
  };

  const currentScores = getScoresForGame();

  return (
    <div className="w-full max-w-5xl mx-auto p-4 font-outfit">
      {/* Header */}
      <div className="glass-card p-6 rounded-2xl mb-8 flex flex-col md:flex-row items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black font-orbitron text-yellow-400 glow-gold flex items-center gap-3">
            <Trophy className="text-yellow-400" /> LEADERBOARD & ACHIEVEMENTS
          </h2>
          <p className="text-gray-400 text-sm mt-1">
            Track top scores, player ranks, and unlockable achievement trophies.
          </p>
        </div>

        {/* Profile Card */}
        <div className="glass-card px-5 py-3 rounded-xl flex items-center gap-4 border-yellow-500/30">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-yellow-400 to-amber-600 flex items-center justify-center text-lg font-bold text-black">
            👾
          </div>
          <div>
            {editingName ? (
              <div className="flex gap-2 items-center">
                <input
                  type="text"
                  value={nameInput}
                  onChange={(e) => setNameInput(e.target.value)}
                  className="bg-slate-900 border border-cyan-400 text-white text-xs px-2 py-1 rounded font-orbitron focus:outline-none"
                />
                <button onClick={handleSaveName} className="btn-cyan text-xs py-1 px-2">SAVE</button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <span className="font-orbitron font-bold text-cyan-300 text-sm">{userProfile?.username || 'CyberRider'}</span>
                <button onClick={() => setEditingName(true)} className="text-xs text-gray-400 hover:text-cyan-400">✏️</button>
              </div>
            )}
            <div className="text-xs text-yellow-400 font-retro">RANK #1 GLOBAL</div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Scores Column */}
        <div className="lg:col-span-2 glass-card p-6 rounded-2xl">
          {/* Game Selector Tabs */}
          <div className="flex flex-wrap gap-2 border-b border-cyan-500/20 pb-4 mb-6">
            <button
              onClick={() => { soundEngine.playMenuClick(); setActiveTab('igi'); }}
              className={`px-4 py-2 rounded-lg font-orbitron text-xs font-bold transition-all ${
                activeTab === 'igi' ? 'btn-gold' : 'text-gray-400 hover:text-white'
              }`}
            >
              CYBER I.G.I. CAR
            </button>
            <button
              onClick={() => { soundEngine.playMenuClick(); setActiveTab('strike'); }}
              className={`px-4 py-2 rounded-lg font-orbitron text-xs font-bold transition-all ${
                activeTab === 'strike' ? 'btn-cyan' : 'text-gray-400 hover:text-white'
              }`}
            >
              CYBER STRIKE
            </button>
            <button
              onClick={() => { soundEngine.playMenuClick(); setActiveTab('pulse'); }}
              className={`px-4 py-2 rounded-lg font-orbitron text-xs font-bold transition-all ${
                activeTab === 'pulse' ? 'btn-magenta' : 'text-gray-400 hover:text-white'
              }`}
            >
              NEON PULSE
            </button>
            <button
              onClick={() => { soundEngine.playMenuClick(); setActiveTab('maze'); }}
              className={`px-4 py-2 rounded-lg font-orbitron text-xs font-bold transition-all ${
                activeTab === 'maze' ? 'btn-cyan' : 'text-gray-400 hover:text-white'
              }`}
            >
              CYBER MAZE
            </button>
          </div>

          {/* Scores Table */}
          <div className="space-y-3">
            {currentScores.map((item, index) => (
              <div
                key={index}
                className={`p-4 rounded-xl flex items-center justify-between border transition-all ${
                  index === 0
                    ? 'bg-yellow-500/10 border-yellow-400/40 shadow-[0_0_15px_rgba(255,183,3,0.15)]'
                    : index === 1
                    ? 'bg-cyan-500/10 border-cyan-400/30'
                    : 'bg-slate-900/60 border-slate-800'
                }`}
              >
                <div className="flex items-center gap-4">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-retro text-xs font-bold ${
                    index === 0 ? 'bg-yellow-400 text-black' : index === 1 ? 'bg-cyan-400 text-black' : 'bg-slate-800 text-gray-400'
                  }`}>
                    #{index + 1}
                  </div>
                  <div>
                    <div className="font-orbitron font-bold text-gray-100 text-sm">{item.name}</div>
                    <div className="text-xs text-gray-400">{item.date}</div>
                  </div>
                </div>

                <div className="font-orbitron font-black text-cyan-400 text-lg glow-cyan">
                  {item.score} PTS
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Trophies Column */}
        <div className="glass-card p-6 rounded-2xl flex flex-col">
          <h3 className="text-xl font-bold font-orbitron text-purple-400 glow-magenta mb-4 flex items-center gap-2">
            <Medal /> TROPHY BADGES
          </h3>

          <div className="space-y-4">
            {BADGES.map((badge) => {
              const isUnlocked = stats?.badges?.includes(badge.id);
              return (
                <div key={badge.id} className={`p-3 rounded-xl border flex items-center gap-3 ${
                  isUnlocked ? 'bg-purple-950/40 border-purple-500/50' : 'bg-slate-900/40 border-slate-800 opacity-60'
                }`}>
                  <div className="text-2xl p-2 rounded-lg bg-slate-900 border border-purple-500/30">
                    {badge.icon}
                  </div>
                  <div>
                    <div className="font-orbitron text-xs font-bold text-gray-200 flex items-center gap-2">
                      {badge.name}
                      {isUnlocked && <UserCheck size={12} className="text-green-400" />}
                    </div>
                    <div className="text-xs text-gray-400">{badge.desc}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

import React, { useState, useEffect } from 'react';
import { useGame } from '../services/gameService';
import { GamePhase, BuzzerStatus } from '../types';
import { useWakeLock } from '../hooks/useWakeLock';

const PlayerView: React.FC = () => {
  const { gameState, joinGame, rejoinAs, buzz, submitWager, submitFinalAnswer, currentPlayerId, isConnected } = useGame();
  const [name, setName] = useState('');
  // Use a dedicated state for forcing re-renders during countdown
  const [, setTick] = useState(0);
  const [showReconnectedMessage, setShowReconnectedMessage] = useState(false);
  const [showDisconnectedPlayers, setShowDisconnectedPlayers] = useState(false);
  
  // Activate wake lock to prevent screen from sleeping
  const { isActive: wakeLockActive, isSupported: wakeLockSupported } = useWakeLock();
  
  console.log('[PlayerView] Render - isConnected:', isConnected, 'currentPlayerId:', currentPlayerId);

  // Input states
  const [wagerInput, setWagerInput] = useState('');
  const [answerInput, setAnswerInput] = useState('');

  // Always derive player state at top level
  const player = currentPlayerId ? gameState.players.find(p => p.id === currentPlayerId) : undefined;
  
  // Show reconnected message when player reconnects
  useEffect(() => {
    if (player && isConnected && localStorage.getItem('jeopardy_player_id') === player.id) {
      // Check if we just reconnected (was disconnected before)
      const wasDisconnected = sessionStorage.getItem('was_disconnected') === 'true';
      if (wasDisconnected) {
        setShowReconnectedMessage(true);
        sessionStorage.removeItem('was_disconnected');
        setTimeout(() => setShowReconnectedMessage(false), 3000);
      }
    }
  }, [player, isConnected]);
  
  // Track disconnection
  useEffect(() => {
    if (!isConnected && currentPlayerId) {
      sessionStorage.setItem('was_disconnected', 'true');
    }
  }, [isConnected, currentPlayerId]);
  
  // Calculate Penalty State
  const now = Date.now();
  const isLockedOut = player?.lockedOutUntil ? player.lockedOutUntil > now : false;

  // Force re-render if locked out to update UI when time expires
  useEffect(() => {
    if (isLockedOut) {
        const interval = setInterval(() => {
            setTick(t => t + 1);
        }, 50); 
        return () => clearInterval(interval);
    }
  }, [isLockedOut]);

  // Haptic Feedback Logic
  useEffect(() => {
    if (!player) return;

    if (player.buzzerStatus === BuzzerStatus.WINNER) {
      if (typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate([100, 50, 100]); 
    } else if (player.buzzerStatus === BuzzerStatus.LOSER) {
      if (typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate(200); 
    } else if (player.buzzerStatus === BuzzerStatus.ARMED) {
       if (typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate(50);
    }
  }, [player?.buzzerStatus]); 

  // Handle Join
  const handleJoin = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('[PlayerView] Join button clicked, name:', name);
    if (name.trim()) {
      console.log('[PlayerView] Calling joinGame with name:', name);
      joinGame(name);
    } else {
      console.warn('[PlayerView] Name is empty, not joining');
    }
  };

  // Handle Buzz
  const handleBuzz = () => {
    if (!player) return;
    buzz(player.id);
    if (player.buzzerStatus === BuzzerStatus.ARMED) {
      if (typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate(50);
    }
  };

  // Handle Wager Submit
  const handleWagerSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      if (!player) return;
      const amount = parseInt(wagerInput);
      if (!isNaN(amount) && amount >= 0) {
          submitWager(player.id, amount);
      }
  };

  // Handle Final Answer Submit
  const handleAnswerSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      if (!player) return;
      submitFinalAnswer(player.id, answerInput);
  };

  // --- RENDER LOGIC ---

  // 1. Join Screen
  if (!currentPlayerId) {
    const disconnectedPlayers = gameState.players.filter(p => !p.isConnected);
    const maxPlayers = gameState.maxPlayers || 6;
    const connectedCount = gameState.players.filter(p => p.isConnected).length;
    const isGameFull = connectedCount >= maxPlayers;
    
    return (
      <div className="h-full w-full bg-[#060CE9] flex flex-col items-center justify-center p-6 text-white">
        <h1 className="text-4xl font-serif text-[#FFCC00] mb-8 drop-shadow-md">Jeopardy!</h1>
        
        {/* Connection Status Indicator */}
        <div className="mb-4 flex items-center gap-2">
          <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></div>
          <span className="text-sm">{isConnected ? 'Connected' : 'Connecting to server...'}</span>
        </div>
        
        {/* Player Count */}
        <div className="mb-4 text-sm opacity-75">
          {connectedCount}/{maxPlayers} players in game
          {isGameFull && <span className="ml-2 text-red-400 font-bold">(GAME FULL)</span>}
        </div>
        
        {/* Disconnected Players List */}
        {disconnectedPlayers.length > 0 && (
          <div className="mb-6 w-full max-w-sm">
            <button
              onClick={() => setShowDisconnectedPlayers(!showDisconnectedPlayers)}
              className="w-full bg-white/10 hover:bg-white/20 p-3 rounded font-bold text-sm mb-2 flex items-center justify-between"
            >
              <span>Rejoin as existing player</span>
              <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 transition-transform ${showDisconnectedPlayers ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            
            {showDisconnectedPlayers && (
              <div className="bg-white/10 rounded p-3 space-y-2 max-h-48 overflow-y-auto">
                {disconnectedPlayers.map(p => (
                  <button
                    key={p.id}
                    onClick={() => rejoinAs(p.id)}
                    className="w-full bg-white/20 hover:bg-white/30 p-3 rounded text-left flex items-center justify-between group"
                  >
                    <div className="flex items-center gap-3">
                      {p.avatar && <img src={p.avatar} alt={p.name} className="w-8 h-8 rounded-full" />}
                      <div>
                        <div className="font-bold">{p.name}</div>
                        <div className="text-xs opacity-75">${p.score}</div>
                      </div>
                    </div>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 opacity-0 group-hover:opacity-100 transition-opacity" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
        
        <form onSubmit={handleJoin} className="w-full max-w-sm flex flex-col gap-4">
          <label className="text-lg font-bold">Enter your Name</label>
          <input 
            type="text" 
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="p-4 rounded text-black text-xl font-bold uppercase text-center"
            placeholder="NICKNAME"
            maxLength={10}
          />
          <button 
            type="submit" 
            disabled={!isConnected || !name.trim() || isGameFull}
            className="bg-[#FFCC00] text-[#060CE9] p-4 rounded font-bold text-xl uppercase shadow-lg active:scale-95 transition-transform disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isGameFull ? 'Game Full' : 'Join Game'}
          </button>
          {isGameFull && !isConnected && (
            <p className="text-sm text-red-400 text-center">Cannot join - game has reached maximum player limit</p>
          )}
        </form>
      </div>
    );
  }

  if (!player) {
    return (
      <div className="h-full w-full bg-[#060CE9] flex flex-col items-center justify-center text-white relative">
        <div className="animate-spin text-4xl">⏳</div>
        <p className="mt-4 font-bold">Connecting...</p>
        <button
          onClick={() => window.location.reload()}
          className="absolute top-4 right-4 bg-white/10 hover:bg-white/20 active:bg-white/30 text-white p-3 rounded-full transition-colors"
          title="Refresh page"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        </button>
      </div>
    );
  }

  // --- FINAL JEOPARDY MODES ---
  if (gameState.round === 'FINAL_JEOPARDY') {
      
      // Phase 1: Wager
      if (gameState.phase === GamePhase.BOARD) {
          if (player.wager !== undefined) {
              return (
                  <div className="h-full w-full bg-indigo-900 flex flex-col items-center justify-center text-white p-6">
                      <h2 className="text-3xl font-bold mb-4">Wager Locked</h2>
                      <p className="text-5xl font-mono text-[#FFCC00]">${player.wager}</p>
                      <p className="mt-8 animate-pulse text-gray-300">Waiting for other players...</p>
                  </div>
              );
          }
          return (
              <div className="h-full w-full bg-indigo-900 flex flex-col items-center justify-center text-white p-6">
                  <h2 className="text-2xl font-bold mb-2 uppercase tracking-widest text-[#FFCC00]">Final Jeopardy</h2>
                  <p className="mb-8 text-center opacity-80">Enter your wager. Max: ${Math.max(0, player.score)}</p>
                  <form onSubmit={handleWagerSubmit} className="w-full max-w-xs flex flex-col gap-4">
                      <input 
                          type="number" 
                          value={wagerInput}
                          onChange={(e) => setWagerInput(e.target.value)}
                          max={Math.max(0, player.score)}
                          min={0}
                          className="p-4 rounded text-black text-3xl font-bold text-center"
                          placeholder="$0"
                          autoFocus
                      />
                      <button type="submit" className="bg-[#FFCC00] text-[#060CE9] p-4 rounded font-bold text-xl uppercase shadow-lg">
                          Lock Wager
                      </button>
                  </form>
              </div>
          );
      }

      // Phase 2: Answer
      if (gameState.phase === GamePhase.CLUE) {
          if (player.finalAnswer !== undefined) {
               return (
                  <div className="h-full w-full bg-indigo-900 flex flex-col items-center justify-center text-white p-6">
                      <h2 className="text-3xl font-bold mb-4">Answer Locked</h2>
                      <p className="text-2xl font-serif italic text-[#FFCC00] text-center">"{player.finalAnswer}"</p>
                      <p className="mt-8 animate-pulse text-gray-300">Good Luck!</p>
                  </div>
              );
          }
          return (
              <div className="h-full w-full bg-indigo-900 flex flex-col items-center justify-center text-white p-6">
                  <h2 className="text-2xl font-bold mb-4 uppercase tracking-widest text-[#FFCC00]">Your Answer</h2>
                  <form onSubmit={handleAnswerSubmit} className="w-full max-w-sm flex flex-col gap-4">
                      <textarea 
                          value={answerInput}
                          onChange={(e) => setAnswerInput(e.target.value)}
                          className="p-4 rounded text-black text-xl font-serif text-center min-h-[150px]"
                          placeholder="What is..."
                          autoFocus
                      />
                      <button type="submit" className="bg-green-500 text-white p-4 rounded font-bold text-xl uppercase shadow-lg">
                          Submit Answer
                      </button>
                  </form>
              </div>
          );
      }

      // Phase 3: Reveal
      if (gameState.phase === GamePhase.FINAL_REVEAL) {
          return (
              <div className="h-full w-full bg-[#060CE9] flex flex-col items-center justify-center text-white p-6">
                  <h2 className="text-4xl font-serif font-bold text-[#FFCC00] mb-8">Look at the Board</h2>
                  <div className="animate-bounce text-6xl">👀</div>
              </div>
          );
      }
  }

  // --- STANDARD GAMEPLAY ---
  
  // Dynamic Styles
  let buttonColor = "bg-gray-400 text-white";
  let buttonText = "LOCKED";
  let buttonEffect = "";
  let isDisabled = true;

  // OVERRIDE FOR DAILY DOUBLE
  if (gameState.phase === GamePhase.DAILY_DOUBLE) {
      buttonColor = "bg-[#060CE9] text-[#FFCC00] border-[#FFCC00]";
      buttonText = "DAILY DOUBLE";
      isDisabled = true;
  } else if (isLockedOut) {
      buttonColor = "bg-yellow-400 border-yellow-600 text-black shadow-[0_0_30px_rgba(250,204,21,0.5)]";
      buttonText = "PENALTY";
      isDisabled = true;
  } else {
      switch(player.buzzerStatus) {
        case BuzzerStatus.IDLE:
             buttonColor = "bg-gray-600 text-white";
             buttonText = "WAITING";
             isDisabled = true;
             break;
        case BuzzerStatus.LOCKED:
             if (gameState.activeClueId) {
                 buttonColor = "bg-gray-600 active:bg-gray-700 text-white";
                 buttonText = "LISTEN";
                 isDisabled = false; 
             } else {
                 buttonColor = "bg-gray-600 text-white";
                 buttonText = "WAITING";
                 isDisabled = true;
             }
             break;
        case BuzzerStatus.ARMED:
          buttonColor = "bg-green-500 animate-pulse text-white";
          buttonText = "BUZZ!";
          buttonEffect = "active:scale-95 active:bg-green-600";
          isDisabled = false;
          break;
        case BuzzerStatus.WINNER:
          buttonColor = "bg-[#060CE9] text-white";
          buttonText = "ANSWER NOW!";
          buttonEffect = "animate-bounce";
          isDisabled = false;
          break;
        case BuzzerStatus.LOSER:
          buttonColor = "bg-red-600 text-white";
          buttonText = "LOCKED OUT";
          isDisabled = true;
          break;
      }
  }

  return (
    <div className="h-full w-full bg-gray-900 flex flex-col text-white relative">
      {/* Reconnection Success Banner */}
      {showReconnectedMessage && (
        <div className="absolute top-0 left-0 right-0 z-50 bg-green-500 text-white px-4 py-3 text-center font-bold shadow-lg animate-[slideDown_0.3s_ease-out]">
          ✓ Reconnected! Welcome back, {player.name}
        </div>
      )}
      
      {/* Connection Status Warning */}
      {!isConnected && (
        <div className="absolute top-0 left-0 right-0 z-50 bg-red-500 text-white px-4 py-3 text-center font-bold shadow-lg animate-pulse">
          ⚠ Connection Lost - Attempting to reconnect...
        </div>
      )}
      
      {/* Header Info */}
      <div className="p-4 bg-gray-800 flex justify-between items-center border-b border-gray-700">
        <div>
          <h2 className="text-xl font-bold font-serif italic text-white">{player.name}</h2>
          <span className="text-xs text-gray-400">Rank: #1</span>
        </div>
        <div className={`text-3xl font-mono font-bold ${player.score < 0 ? 'text-red-400' : 'text-[#FFCC00]'}`}>
          ${player.score}
        </div>
      </div>

      {/* Main Action Area */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 gap-8">
        
        {/* Status Message */}
        <div className="text-center h-16 flex items-center justify-center">
             <h3 className="text-2xl font-bold uppercase tracking-widest text-white/80">{
               gameState.phase === GamePhase.DAILY_DOUBLE ? "Waiting for Host..." :
               isLockedOut ? "PENALTY!" :
               gameState.phase === GamePhase.BOARD ? "Look at the Board" : 
               player.buzzerStatus === BuzzerStatus.WINNER ? "IT'S YOU!" :
               player.buzzerStatus === BuzzerStatus.ARMED ? "GO GO GO!" : 
               "Wait..."
             }</h3>
        </div>

        {/* THE BIG BUTTON */}
        <button 
          className={`
            w-48 h-48 md:w-64 md:h-64 rounded-full border-8 border-white/20 shadow-[0_0_50px_rgba(0,0,0,0.5)]
            flex flex-col items-center justify-center text-2xl md:text-3xl font-bold tracking-wider
            transition-all duration-100 select-none touch-manipulation
            ${buttonColor} ${buttonEffect}
          `}
          onTouchStart={(e) => { e.preventDefault(); if (!isDisabled) handleBuzz(); }}
          onMouseDown={(e) => { if (!isDisabled) handleBuzz(); }}
          disabled={isDisabled}
        >
          <span>{buttonText}</span>
          {isLockedOut && (
            <div className="text-xl md:text-2xl mt-1 font-mono font-black">
              {(Math.max(0, player.lockedOutUntil! - now) / 1000).toFixed(1)}s
            </div>
          )}
        </button>

      </div>
    </div>
  );
};

export default PlayerView;
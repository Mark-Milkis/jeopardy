import React, { useEffect, useState } from 'react';
import { useGame } from '../services/gameService';
import { GamePhase, Clue, BuzzerStatus } from '../types';

const HostView: React.FC = () => {
  const { 
    gameState, 
    openClue, 
    closeClue, 
    armBuzzers, 
    handleJudgment,
    cancelBuzz,
    updateScore, 
    skipClue, 
    resetGame,
        startJeopardy,
    startDoubleJeopardy,
    startFinalJeopardy,
    updateSettings,
    setFinalRevealPhase,
    revealPlayerFinal,
    setDailyDoubleConfig,
    resolveDailyDouble
  } = useGame();
  
  const { categories, players, activeClueId, phase, activePlayerId, round, dailyDoublePlayerId, dailyDoubleWager } = gameState;
  const [showSettings, setShowSettings] = useState(false);
  const [ddWagerInput, setDdWagerInput] = useState('');

  // Derive Active Clue
  let activeClue: Clue | undefined;
  if (activeClueId) {
    for (const cat of categories) {
      const found = cat.clues.find(c => c.id === activeClueId);
      if (found) activeClue = found;
    }
  }

  // Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Space to arm buzzers if in Clue phase and no one is active
      if (e.code === 'Space' && phase === GamePhase.CLUE && !gameState.buzzersOpen && !activePlayerId && round !== 'FINAL_JEOPARDY') {
        e.preventDefault();
        armBuzzers();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [phase, gameState.buzzersOpen, activePlayerId, armBuzzers, round]);

  const activePlayer = activePlayerId ? players.find(p => p.id === activePlayerId) : null;
  const isJudged = activePlayer?.isFinalAnswerJudged;

  return (
    <div className="h-full w-full bg-gray-100 flex flex-col font-sans text-gray-900 overflow-hidden relative">
      
      {/* TOP BAR: PLAYERS & CONTROLS */}
      <div className="h-20 bg-gray-900 text-white flex items-center px-4 gap-4 overflow-x-auto border-b-4 border-[#FFCC00] shadow-lg shrink-0 scrollbar-hide">
        
        {/* Settings Button */}
        <button onClick={() => setShowSettings(true)} className="p-2 text-gray-400 hover:text-white transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
        </button>

        <div className="mr-4 font-bold text-[#FFCC00] uppercase tracking-widest hidden md:block whitespace-nowrap">
          {round === 'JEOPARDY' ? 'Round 1' : round === 'DOUBLE_JEOPARDY' ? 'Double Jeopardy' : 'Final Jeopardy'}
        </div>
        
        {players.length === 0 && <span className="text-gray-400 italic">No players connected...</span>}

        {players.map(p => (
            <div key={p.id} className={`
                flex items-center gap-3 p-2 rounded bg-gray-800 border border-gray-700 min-w-[200px] shadow-sm
                ${p.id === activePlayerId ? 'ring-2 ring-[#FFCC00] bg-gray-700' : ''}
            `}>
                {/* Status Dot */}
                <div className={`w-3 h-3 shrink-0 rounded-full ${p.buzzerStatus === BuzzerStatus.ARMED ? 'bg-green-500' : p.buzzerStatus === BuzzerStatus.LOCKED ? 'bg-red-500' : 'bg-gray-400'}`}></div>
                
                <div className="flex-1 overflow-hidden">
                    <div className="font-bold truncate text-sm flex justify-between">
                        <span>{p.name}</span>
                        {/* Wager/Answer Status Icons */}
                        {round === 'FINAL_JEOPARDY' && (
                            <div className="flex text-[10px] gap-1">
                                {p.wager !== undefined && <span className="bg-[#FFCC00] text-black px-1 rounded font-bold" title={`Wager: ${p.wager}`}>W</span>}
                                {p.finalAnswer !== undefined && <span className="bg-green-500 text-white px-1 rounded font-bold" title="Answered">A</span>}
                                {p.isFinalAnswerJudged && <span className="bg-blue-500 text-white px-1 rounded font-bold" title="Judged">✓</span>}
                            </div>
                        )}
                    </div>
                    <div className={`font-mono text-sm ${p.score < 0 ? 'text-red-400' : 'text-green-400'}`}>${p.score}</div>
                </div>

                {/* Score Controls */}
                <div className="flex flex-col gap-1">
                    <button onClick={() => updateScore(p.id, 100)} className="w-6 h-5 bg-gray-700 hover:bg-gray-600 border border-gray-600 rounded text-[10px] flex items-center justify-center active:bg-gray-500">+</button>
                    <button onClick={() => updateScore(p.id, -100)} className="w-6 h-5 bg-gray-700 hover:bg-gray-600 border border-gray-600 rounded text-[10px] flex items-center justify-center active:bg-gray-500">-</button>
                </div>
            </div>
        ))}

        <div className="ml-auto flex items-center gap-2">
                         {round === 'JEOPARDY' && categories.length === 0 && (
                                <button 
                                    onClick={() => startJeopardy()} 
                                    className="px-3 py-1 text-xs bg-blue-700 hover:bg-blue-600 text-white border border-blue-500 rounded whitespace-nowrap"
                                >
                                    Start Jeopardy
                                </button>
                         )}
             {round === 'JEOPARDY' && (
                <button 
                  onClick={() => startDoubleJeopardy()} 
                  className="px-3 py-1 text-xs bg-blue-700 hover:bg-blue-600 text-white border border-blue-500 rounded whitespace-nowrap"
                >
                  Start Double
                </button>
             )}
             {round === 'DOUBLE_JEOPARDY' && (
                <button 
                  onClick={() => startFinalJeopardy()} 
                  className="px-3 py-1 text-xs bg-purple-700 hover:bg-purple-600 text-white border border-purple-500 rounded whitespace-nowrap"
                >
                  Start Final
                </button>
             )}
             <button onClick={() => resetGame()} className="px-3 py-1 text-xs text-red-400 hover:text-red-300 border border-red-900 rounded hover:bg-red-900/50 whitespace-nowrap">Reset</button>
        </div>
      </div>

      {/* FINAL JEOPARDY CONTROL PANEL */}
      {round === 'FINAL_JEOPARDY' && phase === GamePhase.BOARD && (
          <div className="p-4 bg-purple-100 border-b border-purple-200">
             <div className="flex items-center justify-between max-w-4xl mx-auto">
                <div>
                   <h3 className="text-purple-900 font-bold uppercase">Final Jeopardy: Wager Phase</h3>
                   <p className="text-sm text-purple-700">Wait for all players to lock in wagers (marked with 'W'), then open the clue.</p>
                </div>
                <button 
                    onClick={() => {
                        // Find the final clue ID
                        const finalClueId = categories.find(c => c.id === 'final-cat')?.clues[0].id;
                        if(finalClueId) openClue(finalClueId);
                    }}
                    className="bg-purple-600 text-white px-6 py-2 rounded-lg font-bold shadow hover:bg-purple-500"
                >
                    Reveal Clue
                </button>
             </div>
          </div>
      )}

      {/* FINAL REVEAL CONTROL PANEL */}
      {phase === GamePhase.FINAL_REVEAL && (
          <div className="p-4 bg-indigo-900 text-white border-b border-indigo-800">
              <div className="flex flex-col items-center max-w-4xl mx-auto gap-4">
                  <h3 className="font-bold uppercase tracking-widest text-[#FFCC00]">Final Reveal Phase</h3>
                  <div className="flex gap-2 overflow-x-auto pb-2 w-full justify-center">
                      {players.map(p => (
                          <button 
                             key={p.id}
                             onClick={() => revealPlayerFinal(p.id)}
                             className={`px-4 py-2 rounded border transition-colors ${activePlayerId === p.id ? 'bg-[#FFCC00] text-black border-[#FFCC00]' : 'bg-indigo-800 border-indigo-600 hover:bg-indigo-700'}`}
                          >
                              {p.name} {p.wager !== undefined ? `($${p.wager})` : ''}
                              {p.isFinalAnswerJudged && ' ✓'}
                          </button>
                      ))}
                      <button onClick={() => resetGame()} className="px-4 py-2 rounded border border-red-500 bg-red-900/50 hover:bg-red-900 text-red-200">
                          End Game
                      </button>
                  </div>
              </div>
          </div>
      )}

      {/* MAIN BOARD AREA */}
      <div className="flex-1 overflow-y-auto p-4 md:p-6 bg-gray-100">
         {phase === GamePhase.FINAL_REVEAL ? (
             <div className="flex flex-col items-center justify-center h-full max-w-4xl mx-auto w-full">
                {activePlayerId ? (
                   <div className="bg-white rounded-xl shadow-2xl p-8 w-full border border-gray-200 flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-4">
                       <div className="flex justify-between items-center border-b pb-4">
                          <h2 className="text-3xl font-bold text-gray-800">{activePlayer?.name}</h2>
                          <div className="text-xl font-mono text-gray-500">Current: ${activePlayer?.score}</div>
                       </div>
                       
                       <div className="bg-indigo-50 p-6 rounded-lg border-2 border-indigo-100 text-center">
                          <span className="text-xs font-bold text-indigo-400 uppercase tracking-widest block mb-2">Final Answer</span>
                          <p className="text-3xl md:text-5xl font-serif text-indigo-900 font-bold">
                             {activePlayer?.finalAnswer || <span className="text-gray-400 italic">No Answer</span>}
                          </p>
                       </div>

                       <div className="flex justify-center items-center gap-4">
                          <span className="text-gray-400 uppercase font-bold text-sm">Wager:</span>
                          <span className="text-3xl font-mono font-bold text-gray-800">${activePlayer?.wager || 0}</span>
                       </div>

                       {isJudged ? (
                           <div className="bg-gray-100 p-4 rounded-xl text-center border border-gray-300">
                               <span className="text-xl font-bold text-gray-500 uppercase tracking-widest">JUDGMENT RECORDED</span>
                           </div>
                       ) : (
                           <div className="grid grid-cols-2 gap-4 mt-4">
                               <button 
                                    onClick={() => handleJudgment(true)}
                                    className="bg-green-600 hover:bg-green-500 text-white p-6 rounded-xl font-bold text-2xl shadow-lg flex flex-col items-center transition-transform active:scale-95"
                                >
                                   CORRECT
                                   <span className="text-sm opacity-75 font-normal">+${activePlayer?.wager || 0}</span>
                               </button>
                               <button 
                                    onClick={() => handleJudgment(false)}
                                    className="bg-red-600 hover:bg-red-500 text-white p-6 rounded-xl font-bold text-2xl shadow-lg flex flex-col items-center transition-transform active:scale-95"
                                >
                                   INCORRECT
                                   <span className="text-sm opacity-75 font-normal">-${activePlayer?.wager || 0}</span>
                               </button>
                           </div>
                       )}
                   </div>
                ) : (
                    <div className="text-center text-gray-400">
                        <svg className="w-24 h-24 mx-auto mb-4 opacity-20" fill="currentColor" viewBox="0 0 20 20"><path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z" /></svg>
                        <h2 className="text-2xl font-bold uppercase tracking-widest opacity-50">Final Jeopardy Reveal</h2>
                        <p className="mt-2">Select a player from the top bar to reveal and judge their answer.</p>
                    </div>
                )}
             </div>
         ) : (
             <div className={`grid gap-3 max-w-7xl mx-auto h-full content-start ${round === 'FINAL_JEOPARDY' ? 'grid-cols-1 place-items-center' : 'grid-cols-6'}`}>
                {categories.map(cat => (
                    <div key={cat.id} className={`flex flex-col gap-2 ${round === 'FINAL_JEOPARDY' ? 'w-full max-w-2xl' : ''}`}>
                        <div className="bg-[#000080] text-white p-2 text-center shadow-md min-h-[4rem] flex flex-col items-center justify-center break-words leading-tight border border-blue-900 rounded relative group">
                            <span className="font-bold text-[10px] md:text-sm uppercase">{cat.title}</span>
                            {cat.comment && (
                            <span className="text-[9px] text-blue-200 mt-1 italic font-light opacity-90">{cat.comment}</span>
                            )}
                        </div>
                        {cat.clues.map(clue => (
                            <button
                                key={clue.id}
                                onClick={() => !clue.isCompleted && openClue(clue.id)}
                                disabled={clue.isCompleted || (phase !== GamePhase.BOARD && activeClueId !== clue.id)}
                                className={`
                                    relative h-16 md:h-20 w-full rounded flex items-center justify-center font-bold text-lg md:text-xl shadow-sm transition-all duration-150
                                    ${clue.isCompleted 
                                        ? 'bg-gray-300 text-gray-400 cursor-not-allowed border border-gray-300' 
                                        : 'bg-white text-[#000080] hover:bg-blue-50 hover:shadow-md hover:-translate-y-0.5 border border-blue-200'
                                    }
                                    ${activeClueId === clue.id ? 'ring-4 ring-[#FFCC00] z-10' : ''}
                                `}
                            >
                                {round === 'FINAL_JEOPARDY' ? 'PLAY FINAL JEOPARDY' : `$${clue.value}`}
                                {clue.isDailyDouble && !clue.isCompleted && (
                                    <span className="absolute top-1 right-1 text-[9px] font-black bg-red-500 text-white px-1.5 py-0.5 rounded shadow-sm tracking-tighter">DD</span>
                                )}
                            </button>
                        ))}
                    </div>
                ))}
             </div>
         )}
      </div>

      {/* DAILY DOUBLE MODAL - ABSOLUTE POSITIONED */}
      {phase === GamePhase.DAILY_DOUBLE && activeClue && (
          <div className="absolute inset-0 z-40 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
              <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden border border-gray-800 flex flex-col">
                  {/* Header */}
                  <div className="bg-[#FFCC00] text-black p-4 flex justify-between items-center">
                       <h2 className="text-xl font-black uppercase tracking-widest">Daily Double Configuration</h2>
                       <button onClick={closeClue} className="text-black/50 hover:text-black font-bold">Cancel</button>
                  </div>

                  <div className="p-6 flex-1 flex flex-col gap-6">
                      
                      {/* STEP 1: SELECT PLAYER */}
                      {!dailyDoublePlayerId && (
                          <div className="space-y-4">
                              <h3 className="text-lg font-bold text-gray-700">1. Select Player</h3>
                              <div className="grid grid-cols-2 gap-2">
                                  {players.map(p => (
                                      <button 
                                          key={p.id}
                                          onClick={() => setDailyDoubleConfig(p.id, null)}
                                          className="p-4 bg-gray-100 hover:bg-gray-200 rounded-lg text-left font-bold border border-gray-200 flex justify-between items-center"
                                      >
                                          <span>{p.name}</span>
                                          <span className="font-mono text-gray-500">${p.score}</span>
                                      </button>
                                  ))}
                              </div>
                              {players.length === 0 && <p className="text-red-500 italic">No players connected.</p>}
                          </div>
                      )}

                      {/* STEP 2: WAGER */}
                      {dailyDoublePlayerId && dailyDoubleWager === null && (
                          <div className="space-y-4">
                              <h3 className="text-lg font-bold text-gray-700">2. Enter Wager for <span className="text-blue-600">{players.find(p => p.id === dailyDoublePlayerId)?.name}</span></h3>
                              <p className="text-sm text-gray-500">
                                  Current Score: ${players.find(p => p.id === dailyDoublePlayerId)?.score}. 
                                  Can wager up to ${Math.max(players.find(p => p.id === dailyDoublePlayerId)?.score || 0, 1000)}.
                              </p>
                              <div className="flex gap-2">
                                  <input 
                                    type="number"
                                    value={ddWagerInput}
                                    onChange={(e) => setDdWagerInput(e.target.value)}
                                    className="flex-1 p-3 border rounded text-2xl font-mono"
                                    placeholder="Amount"
                                    autoFocus
                                  />
                                  <button 
                                    onClick={() => {
                                        const amount = parseInt(ddWagerInput);
                                        if(!isNaN(amount)) setDailyDoubleConfig(dailyDoublePlayerId, amount);
                                    }}
                                    className="bg-blue-600 text-white px-6 rounded font-bold uppercase"
                                  >
                                      Reveal Clue
                                  </button>
                              </div>
                              <button onClick={() => setDailyDoubleConfig(null, null)} className="text-sm text-gray-400 underline">Back to Player Selection</button>
                          </div>
                      )}

                      {/* STEP 3: JUDGMENT */}
                      {dailyDoublePlayerId && dailyDoubleWager !== null && (
                          <div className="space-y-6">
                              <div>
                                  <span className="text-xs font-bold text-gray-400 uppercase tracking-widest block mb-2">Question</span>
                                  <p className="text-2xl font-serif">{activeClue.question}</p>
                              </div>
                              
                              <div className="bg-green-50 p-4 rounded border border-green-100">
                                  <span className="text-xs font-bold text-green-600 uppercase tracking-widest block mb-1">Answer</span>
                                  <p className="text-xl font-bold text-green-900">{activeClue.answer}</p>
                              </div>

                              <div className="flex gap-4 pt-4 border-t border-gray-100">
                                  <button onClick={() => { resolveDailyDouble(true); setDdWagerInput(''); }} className="flex-1 py-4 bg-green-600 hover:bg-green-500 text-white rounded font-bold text-xl shadow-lg">
                                      CORRECT (+${dailyDoubleWager})
                                  </button>
                                  <button onClick={() => { resolveDailyDouble(false); setDdWagerInput(''); }} className="flex-1 py-4 bg-red-600 hover:bg-red-500 text-white rounded font-bold text-xl shadow-lg">
                                      INCORRECT (-${dailyDoubleWager})
                                  </button>
                              </div>
                          </div>
                      )}

                  </div>
              </div>
          </div>
      )}

      {/* STANDARD CLUE MODAL */}
      {activeClue && phase !== GamePhase.FINAL_REVEAL && phase !== GamePhase.DAILY_DOUBLE && (
        <div className="absolute inset-0 z-40 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="bg-white w-full max-w-5xl max-h-[95vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-gray-800">
                
                {/* Modal Header */}
                <div className="bg-[#000080] text-white p-4 md:p-6 flex justify-between items-start shrink-0">
                    <div>
                        <h2 className="text-sm uppercase opacity-75 tracking-widest font-bold">
                          {categories.find(c => c.id === activeClue?.categoryId)?.title} &middot; {activeClue.value > 0 ? `$${activeClue.value}` : 'Final'}
                        </h2>
                        {activeClue.isDailyDouble && (
                          <span className="inline-block bg-[#FFCC00] text-[#000080] text-xs font-bold px-2 py-0.5 rounded mt-2 shadow-sm uppercase tracking-wider">
                            Daily Double
                          </span>
                        )}
                    </div>
                    <button onClick={closeClue} className="text-white/50 hover:text-white text-3xl leading-none transition-colors">&times;</button>
                </div>

                {/* Modal Content */}
                <div className="p-6 md:p-8 overflow-y-auto flex-1 flex flex-col gap-6">
                    
                    {/* Question Card */}
                    <div className="bg-gray-50 p-6 rounded-xl border border-gray-200 shadow-sm">
                        <span className="text-xs font-bold text-gray-400 uppercase tracking-widest block mb-3">Question</span>
                        <div className="text-2xl md:text-4xl font-serif text-gray-800 leading-relaxed">
                            {activeClue.question}
                        </div>
                    </div>

                    {/* Answer Card */}
                    <div className="bg-green-50 p-6 rounded-xl border border-green-100 shadow-sm">
                        <span className="text-xs font-bold text-green-600 uppercase tracking-widest block mb-3">Answer</span>
                        <div className="text-2xl font-bold text-green-900">
                            {activeClue.answer}
                        </div>
                    </div>

                    {/* Active Player Status (if buzzing) */}
                    {activePlayerId && (
                        <div className="bg-[#FFCC00]/10 border-2 border-[#FFCC00] p-6 rounded-xl text-center animate-pulse">
                            <span className="text-xs uppercase font-bold text-orange-600 tracking-widest mb-1 block">Active Player</span>
                            <div className="text-4xl font-bold text-gray-900">{players.find(p => p.id === activePlayerId)?.name}</div>
                        </div>
                    )}
                </div>

                {/* Modal Footer / Controls */}
                <div className="bg-gray-100 p-4 md:p-6 border-t border-gray-200 flex flex-col md:flex-row gap-4 items-center shrink-0">
                    
                    {round !== 'FINAL_JEOPARDY' && (
                        <div className="flex gap-2 w-full md:w-auto md:min-w-[200px]">
                            <button onClick={skipClue} className="px-4 py-3 bg-gray-300 hover:bg-gray-400 text-gray-800 rounded-lg font-bold text-sm flex-1 transition-colors">Skip</button>
                            <button onClick={closeClue} className="px-4 py-3 bg-gray-300 hover:bg-gray-400 text-gray-800 rounded-lg font-bold text-sm flex-1 transition-colors">Close</button>
                        </div>
                    )}

                    <div className="flex-1 w-full flex gap-4">
                        {round === 'FINAL_JEOPARDY' ? (
                            <div className="w-full flex justify-end">
                                <button 
                                    onClick={setFinalRevealPhase}
                                    className="px-8 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-bold text-lg shadow-lg"
                                >
                                    Proceed to Reveals
                                </button>
                            </div>
                        ) : !activePlayerId ? (
                            !gameState.buzzersOpen ? (
                                <button 
                                    onClick={armBuzzers}
                                    className="w-full bg-[#060CE9] hover:bg-blue-700 text-white text-xl font-bold py-4 rounded-xl shadow-lg active:scale-[0.98] transition-all uppercase tracking-widest flex items-center justify-center gap-2"
                                >
                                    <span>Open Buzzers</span>
                                    <span className="hidden md:inline text-sm opacity-50 font-normal normal-case">(Space)</span>
                                </button>
                            ) : (
                                <div className="w-full bg-green-500 text-white text-xl font-bold py-4 rounded-xl shadow-inner flex items-center justify-center uppercase tracking-widest animate-pulse border-2 border-green-400">
                                    Buzzers Open...
                                </div>
                            )
                        ) : (
                            <div className="w-full flex flex-col gap-2">
                                <div className="flex gap-4">
                                  <button onClick={() => handleJudgment(true)} className="flex-1 bg-green-600 hover:bg-green-500 text-white text-xl font-bold py-4 rounded-xl shadow-lg active:scale-[0.98] transition-transform flex flex-col items-center justify-center leading-none">
                                      <span>CORRECT</span>
                                      <span className="text-xs opacity-75 font-normal mt-1">Add Score</span>
                                  </button>
                                  <button onClick={() => handleJudgment(false)} className="flex-1 bg-red-600 hover:bg-red-500 text-white text-xl font-bold py-4 rounded-xl shadow-lg active:scale-[0.98] transition-transform flex flex-col items-center justify-center leading-none">
                                      <span>INCORRECT</span>
                                      <span className="text-xs opacity-75 font-normal mt-1">Deduct Score</span>
                                  </button>
                                </div>
                                <button 
                                    onClick={cancelBuzz}
                                    className="w-full py-2 bg-yellow-600 hover:bg-yellow-500 text-white font-bold rounded-lg shadow uppercase text-sm tracking-wider"
                                >
                                    Cancel Buzz (Accidental)
                                </button>
                            </div>
                        )}
                    </div>

                </div>
            </div>
        </div>
      )}

      {/* SETTINGS MODAL */}
      {showSettings && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur p-4">
            <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-md border border-gray-200">
                <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    Game Settings
                </h2>
                
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-1">Early Buzz Penalty (Seconds)</label>
                        <p className="text-xs text-gray-500 mb-2">Duration a player is locked out if they buzz before the host opens the floor.</p>
                        <input 
                            type="number" 
                            min="0"
                            step="0.5"
                            value={gameState.earlyBuzzPenaltyDuration / 1000}
                            onChange={(e) => updateSettings({ earlyBuzzPenaltyDuration: parseFloat(e.target.value) * 1000 })}
                            className="w-full border border-gray-300 rounded p-2 focus:ring-2 focus:ring-blue-500 outline-none"
                        />
                    </div>
                </div>

                <div className="mt-6 flex justify-end">
                    <button onClick={() => setShowSettings(false)} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded font-bold">Done</button>
                </div>
            </div>
        </div>
      )}

    </div>
  );
};

export default HostView;
import React from 'react';
import { useGame } from '../services/gameService';
import { GamePhase, BuzzerStatus } from '../types';

const BoardView: React.FC = () => {
  const { gameState } = useGame();
  const { categories, players, phase, activeClueId, activePlayerId, round, dailyDoubleWager } = gameState;

  // Find active clue details
  let activeClue = null;
  if (activeClueId) {
    for (const cat of categories) {
      const found = cat.clues.find(c => c.id === activeClueId);
      if (found) {
        activeClue = found;
        break;
      }
    }
  }

  // Theme Colors
  const isDouble = round === 'DOUBLE_JEOPARDY';
  const bgColor = isDouble ? 'bg-[#990000]' : 'bg-[#060CE9]'; // Red for Double, Blue for Single
  const cardColor = isDouble ? 'bg-[#990000]' : 'bg-[#060CE9]';
  const headerColor = isDouble ? 'bg-[#660000]' : 'bg-[#000080]';

  return (
    <div className={`h-full w-full ${bgColor} text-white overflow-hidden flex flex-col font-serif select-none cursor-none transition-colors duration-500`}>
      
      {/* HEADER / LOGO */}
      <div className="h-16 flex items-center justify-center bg-black/20 border-b-4 border-black shrink-0">
        <h1 className="text-3xl font-bold tracking-widest text-[#FFCC00] uppercase drop-shadow-md">
            {round === 'JEOPARDY' && "Jeopardy!"}
            {round === 'DOUBLE_JEOPARDY' && "Double Jeopardy!"}
            {round === 'FINAL_JEOPARDY' && "Final Jeopardy"}
        </h1>
      </div>

      {/* MAIN CONTENT AREA */}
      <div className="flex-1 relative flex items-center justify-center p-4 min-h-0">
        
        {/* GRID VIEW */}
        {phase === GamePhase.BOARD && (
          <div className={`
              grid gap-2 w-full h-full max-w-7xl mx-auto
              ${round === 'FINAL_JEOPARDY' ? 'grid-cols-1 place-items-center' : 'grid-cols-6'}
          `}>
            {categories.map((cat) => (
              <div key={cat.id} className={`flex flex-col gap-2 ${round === 'FINAL_JEOPARDY' ? 'w-full max-w-4xl h-full justify-center' : ''}`}>
                {/* Category Header */}
                <div className={`${headerColor} flex-1 flex items-center justify-center text-center p-2 border-2 border-black shadow-[inset_0_0_10px_rgba(0,0,0,0.5)]`}>
                  <span className={`font-bold uppercase text-white drop-shadow-md leading-tight ${round === 'FINAL_JEOPARDY' ? 'text-4xl md:text-6xl py-12' : 'text-sm md:text-lg lg:text-xl'}`}>
                    {cat.title}
                  </span>
                </div>
                {/* Clues */}
                {cat.clues.map((clue) => (
                  <div 
                    key={clue.id} 
                    className={`
                      flex-1 flex items-center justify-center border-2 border-black 
                      ${clue.isCompleted ? cardColor : `${cardColor} shadow-[inset_0_0_20px_rgba(0,0,0,0.5)]`}
                      ${round === 'FINAL_JEOPARDY' ? 'hidden' : ''} 
                    `}
                  >
                    {!clue.isCompleted && (
                      <span className="text-[#FFCC00] text-3xl md:text-5xl font-bold drop-shadow-[2px_2px_0_rgba(0,0,0,1)]">
                        ${clue.value}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            ))}
          </div>
        )}

        {/* CLUE OVERLAY */}
        {(phase === GamePhase.CLUE || phase === GamePhase.DAILY_DOUBLE) && activeClue && (
          <div className={`absolute inset-0 ${bgColor} z-50 flex flex-col items-center justify-center p-12 text-center animate-in fade-in duration-300`}>
             {phase === GamePhase.DAILY_DOUBLE && dailyDoubleWager === null ? (
                // GRAPHIC MODE
               <div className="absolute inset-0 flex items-center justify-center bg-[#000080]">
                  <div className="text-[#FFCC00] text-6xl md:text-9xl font-bold animate-pulse text-center tracking-tighter" style={{ textShadow: '10px 10px 0 #000' }}>
                      DAILY<br/>DOUBLE
                  </div>
               </div>
             ) : (
                // QUESTION MODE
               <div className="max-w-5xl">
                 <p className="text-white text-4xl md:text-6xl lg:text-7xl font-bold leading-tight uppercase drop-shadow-xl" style={{ textShadow: '4px 4px 0px #000' }}>
                   {activeClue.question}
                 </p>
               </div>
             )}
          </div>
        )}

        {/* FINAL REVEAL OVERLAY */}
        {phase === GamePhase.FINAL_REVEAL && (
             <div className="absolute inset-0 bg-[#000033] z-50 flex flex-col items-center justify-center p-12">
                 {activePlayerId ? (
                     <div className="flex flex-col items-center animate-in zoom-in duration-300">
                         {/* Player Name */}
                         <h2 className="text-4xl text-white font-serif italic mb-8 opacity-75">{players.find(p => p.id === activePlayerId)?.name}</h2>
                         
                         {/* Answer Card */}
                         <div className="bg-[#060CE9] border-4 border-white p-12 rounded-xl shadow-2xl mb-8 max-w-4xl text-center">
                             <p className="text-5xl md:text-7xl font-bold text-white uppercase" style={{ textShadow: '3px 3px 0 #000' }}>
                                {players.find(p => p.id === activePlayerId)?.finalAnswer || "No Answer"}
                             </p>
                         </div>

                         {/* Wager */}
                         <div className="flex flex-col items-center gap-2">
                            <span className="text-xl text-gray-400 uppercase tracking-widest">Wager</span>
                            <span className="text-5xl font-mono font-bold text-[#FFCC00] drop-shadow-md">
                                ${players.find(p => p.id === activePlayerId)?.wager || 0}
                            </span>
                         </div>
                     </div>
                 ) : (
                    // Default view if no player selected yet (Show clue answer?)
                    <div className="text-center">
                        <h2 className="text-3xl text-gray-400 mb-4 uppercase tracking-widest">Correct Response</h2>
                        <div className="text-6xl font-bold text-white mb-12">{activeClue?.answer || "..."}</div>
                        <p className="text-xl text-blue-300 animate-pulse">Host: Select a player to reveal their response</p>
                    </div>
                 )}
             </div>
        )}
      </div>

      {/* PODIUMS (FOOTER) */}
      <div className="h-32 bg-black border-t-4 border-[#333] flex items-end justify-center gap-4 px-8 pb-4 shrink-0 overflow-x-auto">
        {players.map((player) => {
          let borderColor = 'border-gray-600';
          let glow = '';
          
          if (player.id === activePlayerId) {
             if (player.buzzerStatus === BuzzerStatus.WINNER || phase === GamePhase.FINAL_REVEAL) {
                borderColor = 'border-white';
                glow = 'shadow-[0_0_30px_rgba(255,255,255,0.8)]';
             }
          } else if (player.buzzerStatus === BuzzerStatus.LOSER) {
              borderColor = 'border-red-600';
          }

          return (
            <div key={player.id} className={`w-48 bg-[#0a0a0a] border-4 ${borderColor} ${glow} flex flex-col items-center justify-between rounded-t-lg h-24 relative transition-all duration-200 shrink-0`}>
              <div className="w-full bg-[#060CE9] h-1/2 flex items-center justify-center border-b-2 border-black">
                <span className="text-white font-serif text-xl italic tracking-wide truncate px-2">{player.name}</span>
              </div>
              <div className="w-full h-1/2 flex items-center justify-center bg-black">
                 <span className={`text-3xl font-mono font-bold ${player.score < 0 ? 'text-red-500' : 'text-[#FFCC00]'}`}>
                   {player.score < 0 ? '-' : ''}${Math.abs(player.score)}
                 </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default BoardView;
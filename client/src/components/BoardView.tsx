import React from 'react';
import { useGame } from '../services/gameService';
import { GamePhase } from '../types';

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

  return (
    <div className="h-full w-full bg-[#0015a0] text-white overflow-hidden flex flex-col select-none cursor-none" style={{ fontFamily: "'Fjalla One', sans-serif" }}>
      
      {/* MAIN CONTENT AREA */}
      <div className="flex-1 relative flex items-center justify-center min-h-0">
        
        {/* GRID VIEW */}
        {phase === GamePhase.BOARD && (
          <div className={`
              grid w-full h-full
              ${round === 'FINAL_JEOPARDY' ? 'grid-cols-1 place-items-center' : 'grid-cols-6 grid-rows-6'}
          `}>
            {round === 'FINAL_JEOPARDY' ? (
              /* Final Jeopardy single category */
              <div className="w-full h-full flex items-center justify-center">
                <div className="border-[3px] border-black w-full h-full flex items-center justify-center">
                  <span className="text-6xl font-bold uppercase text-center" style={{ textShadow: '4px 4px #000000' }}>
                    {categories[0]?.title}
                  </span>
                </div>
              </div>
            ) : (
              /* Regular Jeopardy board */
              <>
                {/* Category row */}
                {categories.map((cat) => (
                  <div key={cat.id} className="border-[3px] border-black border-b-[3px] flex items-center justify-center">
                    <span className="text-2xl font-bold uppercase leading-tight text-center px-2" style={{ textShadow: '4px 4px #000000' }}>
                      {cat.title}
                    </span>
                  </div>
                ))}
                {/* Clue rows */}
                {[0, 1, 2, 3, 4].map((rowIndex) => (
                  <React.Fragment key={rowIndex}>
                    {categories.map((cat) => {
                      const clue = cat.clues[rowIndex];
                      return (
                        <div 
                          key={clue.id} 
                          className="border-[3px] border-black flex items-center justify-center"
                        >
                          {!clue.isCompleted && (
                            <span className="text-[#efaa50] text-6xl font-bold" style={{ textShadow: '4px 4px #000000' }}>
                              ${clue.value}
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </React.Fragment>
                ))}
              </>
            )}
          </div>
        )}

        {/* CLUE OVERLAY */}
        {(phase === GamePhase.CLUE || phase === GamePhase.DAILY_DOUBLE) && activeClue && (
          <div className="absolute inset-0 bg-[#0015a0] z-50 flex flex-col items-center justify-center px-12 text-center animate-in fade-in duration-300" style={{ fontFamily: "'Kadwa', serif" }}>
             {phase === GamePhase.DAILY_DOUBLE && dailyDoubleWager === null ? (
                // GRAPHIC MODE
               <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-[#efaa50] text-9xl font-bold animate-pulse text-center tracking-tighter" style={{ textShadow: '10px 10px 0 #000' }}>
                      DAILY<br/>DOUBLE
                  </div>
               </div>
             ) : (
                // QUESTION MODE
               <div className="max-w-5xl">
                 <p className="text-white text-6xl font-bold leading-tight uppercase" style={{ textShadow: '4px 4px #000000' }}>
                   {activeClue.question}
                 </p>
               </div>
             )}
          </div>
        )}

        {/* FINAL REVEAL OVERLAY */}
        {phase === GamePhase.FINAL_REVEAL && (
             <div className="absolute inset-0 bg-[#0015a0] z-50 flex flex-col items-center justify-center p-12">
                 {activePlayerId ? (
                     <div className="flex flex-col items-center animate-in zoom-in duration-300">
                         {/* Player Name */}
                         <h2 className="text-4xl text-white mb-8 opacity-75" style={{ fontFamily: "'Kadwa', serif", textTransform: 'uppercase' }}>{players.find(p => p.id === activePlayerId)?.name}</h2>
                         
                         {/* Answer Card */}
                         <div className="bg-[#0015a0] border-4 border-white p-12 rounded-xl shadow-2xl mb-8 max-w-4xl text-center">
                             <p className="text-7xl font-bold text-white uppercase" style={{ fontFamily: "'Kadwa', serif", textShadow: '4px 4px #000000' }}>
                                {players.find(p => p.id === activePlayerId)?.finalAnswer || "No Answer"}
                             </p>
                         </div>

                         {/* Wager */}
                         <div className="flex flex-col items-center gap-2">
                            <span className="text-xl text-gray-400 uppercase tracking-widest" style={{ fontFamily: "'Kadwa', serif" }}>Wager</span>
                            <span className="text-5xl font-bold text-[#efaa50]" style={{ fontFamily: "'Fjalla One', sans-serif", textShadow: '4px 4px #000000' }}>
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
    </div>
  );
};

export default BoardView;
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
        
        {/* GAME OVER FINAL SCORE DISPLAY */}
        {phase === GamePhase.GAME_OVER && (
          <div className="absolute inset-0 bg-gradient-to-b from-indigo-900 to-purple-950 z-50 flex flex-col items-center justify-center px-12 animate-in fade-in duration-500">
            <h1 className="text-7xl md:text-9xl font-bold text-yellow-400 mb-20 uppercase tracking-wider animate-in slide-in-from-top duration-700" style={{ fontFamily: "'Fjalla One', sans-serif", textShadow: '8px 8px 0 #000000' }}>
              Final Scores
            </h1>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-10 w-full max-w-6xl">
              {players
                .sort((a, b) => b.score - a.score)
                .map((p, idx) => (
                <div 
                  key={p.id} 
                  className="flex flex-col items-center p-10 bg-purple-800 bg-opacity-50 rounded-3xl border-4 border-purple-600 shadow-2xl animate-in zoom-in duration-500"
                  style={{ animationDelay: `${idx * 200}ms` }}
                >
                  {idx === 0 && p.score > 0 && (
                    <div className="text-6xl mb-4 animate-bounce">🏆</div>
                  )}
                  <div className="text-4xl md:text-5xl font-bold text-white mb-6 text-center uppercase tracking-wide" style={{ fontFamily: "'Fjalla One', sans-serif", textShadow: '4px 4px 0 #000000' }}>
                    {p.name}
                  </div>
                  <div className={`text-7xl md:text-8xl font-mono font-bold ${p.score < 0 ? 'text-red-400' : 'text-green-400'} drop-shadow-[0_5px_10px_rgba(0,0,0,0.9)]`} style={{ textShadow: '5px 5px 0 #000000' }}>
                    ${p.score.toLocaleString()}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {/* ROUND END SCORE DISPLAY */}
        {phase === GamePhase.ROUND_END && (
          <div className="absolute inset-0 bg-gradient-to-b from-blue-900 to-blue-950 z-50 flex flex-col items-center justify-center px-12 animate-in fade-in duration-500">
            <h1 className="text-6xl md:text-8xl font-bold text-yellow-400 mb-16 uppercase tracking-wider animate-in slide-in-from-top duration-700" style={{ fontFamily: "'Fjalla One', sans-serif", textShadow: '6px 6px 0 #000000' }}>
              {round === 'JEOPARDY' ? 'End of Jeopardy Round' : round === 'DOUBLE_JEOPARDY' ? 'End of Double Jeopardy' : 'Scores'}
            </h1>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 w-full max-w-6xl">
              {players.map((p, idx) => (
                <div 
                  key={p.id} 
                  className="flex flex-col items-center p-8 bg-blue-800 bg-opacity-40 rounded-2xl border-4 border-blue-700 shadow-2xl animate-in zoom-in duration-500"
                  style={{ animationDelay: `${idx * 150}ms` }}
                >
                  <div className="text-3xl md:text-4xl font-bold text-white mb-4 text-center uppercase tracking-wide" style={{ fontFamily: "'Fjalla One', sans-serif", textShadow: '3px 3px 0 #000000' }}>
                    {p.name}
                  </div>
                  <div className={`text-6xl md:text-7xl font-mono font-bold ${p.score < 0 ? 'text-red-400' : 'text-green-400'} drop-shadow-[0_4px_8px_rgba(0,0,0,0.8)]`} style={{ textShadow: '4px 4px 0 #000000' }}>
                    ${p.score.toLocaleString()}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        
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
                  <span className="font-bold uppercase text-center" style={{ fontSize: '10vh', textShadow: '4px 4px #000000' }}>
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
                    <span className="font-bold uppercase leading-tight text-center px-2" style={{ fontSize: '3vh', textShadow: '4px 4px #000000' }}>
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
                            <span className="text-[#efaa50] font-bold" style={{ fontSize: '8vh', textShadow: '4px 4px #000000' }}>
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
                  <div className="text-[#efaa50] font-bold animate-pulse text-center tracking-tighter" style={{ fontSize: '15vh', textShadow: '10px 10px 0 #000' }}>
                      DAILY<br/>DOUBLE
                  </div>
               </div>
             ) : (
                // QUESTION MODE
               <div className="max-w-5xl flex flex-col gap-8 items-center">
                 <p className="text-white font-bold leading-tight uppercase" style={{ fontSize: '6vh', textShadow: '4px 4px #000000' }}>
                   {activeClue.question}
                 </p>
                 
                 {/* Media Display */}
                 {activeClue.media && activeClue.media.length > 0 && (
                   <div className="flex flex-col gap-6 w-full items-center">
                     {activeClue.media.map((url, i) => {
                       const isAudio = url.endsWith('.mp3') || url.endsWith('.wav') || url.endsWith('.m4a') || url.endsWith('.ogg');
                       return isAudio ? (
                         <audio 
                           key={i} 
                           controls 
                           src={url} 
                           className="w-full max-w-2xl rounded-lg border-4 border-white shadow-2xl"
                           style={{ backgroundColor: '#fff' }}
                           onError={(e) => {
                             const target = e.currentTarget;
                             target.style.display = 'none';
                             const parent = target.parentElement;
                             if (parent && !parent.querySelector('.media-error-board')) {
                               const errorMsg = document.createElement('div');
                               errorMsg.className = 'media-error-board bg-red-600 text-white px-8 py-4 rounded-lg border-4 border-red-400 text-2xl font-bold uppercase tracking-wider';
                               errorMsg.style.textShadow = '2px 2px 0 #000';
                               errorMsg.textContent = '⚠️ Audio Unavailable';
                               parent.appendChild(errorMsg);
                             }
                           }}
                         />
                       ) : (
                         <img 
                           key={i} 
                           src={url} 
                           alt="Clue media" 
                           className="max-w-3xl max-h-[40vh] rounded-lg border-4 border-white shadow-2xl"
                           onError={(e) => {
                             const target = e.currentTarget;
                             target.style.display = 'none';
                             const parent = target.parentElement;
                             if (parent && !parent.querySelector('.media-error-board')) {
                               const errorMsg = document.createElement('div');
                               errorMsg.className = 'media-error-board bg-red-600 text-white px-8 py-4 rounded-lg border-4 border-red-400 text-2xl font-bold uppercase tracking-wider';
                               errorMsg.style.textShadow = '2px 2px 0 #000';
                               errorMsg.textContent = '⚠️ Image Unavailable';
                               parent.appendChild(errorMsg);
                             }
                           }}
                         />
                       );
                     })}
                   </div>
                 )}
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
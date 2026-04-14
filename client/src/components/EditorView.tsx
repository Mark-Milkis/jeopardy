import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';

type GameRound = 'J' | 'DJ' | 'FJ';

interface CategoryData {
  category_name: string;
  category_comments: string;
}

interface ClueData {
  id?: string;
  clue_html: string;
  clue_text: string;
  correct_response: string;
  media?: string[];
  daily_double?: boolean;
}

interface GameData {
  id: string;
  game_title: string;
  game_comments: string;
  game_complete: boolean;
  [key: string]: any; // Dynamic keys for categories/clues
}

const EditorView: React.FC = () => {
  const { id } = useParams<{ id?: string }>();
  const navigate = useNavigate();
  
  // Editor state
  const [gameData, setGameData] = useState<GameData>(createEmptyGame());
  const [currentRound, setCurrentRound] = useState<GameRound>('J');
  const [selectedCategory, setSelectedCategory] = useState<number>(1);
  const [selectedClue, setSelectedClue] = useState<number>(1);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  useEffect(() => {
    if (id) {
      loadGame(id);
    }
  }, [id]);

  // Create empty game template
  function createEmptyGame(): GameData {
    const game: GameData = {
      id: `custom_${Date.now()}`,
      game_title: 'New Game',
      game_comments: '',
      game_complete: false,
    };

    // Jeopardy round: 6 categories × 5 clues (200-1000)
    for (let cat = 1; cat <= 6; cat++) {
      game[`category_J_${cat}`] = {
        category_name: `CATEGORY ${cat}`,
        category_comments: '',
      };
      for (let clue = 1; clue <= 5; clue++) {
        game[`clue_J_${cat}_${clue}`] = {
          clue_html: '',
          clue_text: '',
          correct_response: '',
        };
      }
    }

    // Double Jeopardy round: 6 categories × 5 clues (400-2000)
    for (let cat = 1; cat <= 6; cat++) {
      game[`category_DJ_${cat}`] = {
        category_name: `CATEGORY ${cat}`,
        category_comments: '',
      };
      for (let clue = 1; clue <= 5; clue++) {
        game[`clue_DJ_${cat}_${clue}`] = {
          clue_html: '',
          clue_text: '',
          correct_response: '',
        };
      }
    }

    // Final Jeopardy: 1 category × 1 clue
    game[`category_FJ_1`] = {
      category_name: 'FINAL JEOPARDY',
      category_comments: '',
    };
    game[`clue_FJ_1_1`] = {
      clue_html: '',
      clue_text: '',
      correct_response: '',
    };

    return game;
  }

  const loadGame = async (gameId: string) => {
    try {
      setLoading(true);
      const response = await fetch(`/api/games/${gameId}`);
      if (!response.ok) {
        throw new Error(`Failed to load game: ${response.statusText}`);
      }
      const data = await response.json();
      setGameData(data);
      setHasUnsavedChanges(false);
    } catch (err) {
      alert(`Error loading game: ${err instanceof Error ? err.message : 'Unknown error'}`);
      console.error('Error loading game:', err);
    } finally {
      setLoading(false);
    }
  };

  const saveGame = async () => {
    // Validate game
    if (!gameData.game_title.trim()) {
      alert('Please enter a game title');
      return;
    }

    // Check if all clues are filled
    let totalClues = 0;
    let filledClues = 0;

    ['J', 'DJ'].forEach(round => {
      for (let cat = 1; cat <= 6; cat++) {
        for (let clue = 1; clue <= 5; clue++) {
          totalClues++;
          const clueData = gameData[`clue_${round}_${cat}_${clue}`];
          if (clueData && clueData.clue_text && clueData.correct_response) {
            filledClues++;
          }
        }
      }
    });

    // Final Jeopardy
    totalClues++;
    const fjClue = gameData[`clue_FJ_1_1`];
    if (fjClue && fjClue.clue_text && fjClue.correct_response) {
      filledClues++;
    }

    const isComplete = totalClues === filledClues;

    try {
      setSaving(true);
      const saveData = {
        ...gameData,
        game_complete: isComplete,
      };

      const response = await fetch('/api/games', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(saveData),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(errorData.error || 'Failed to save game');
      }

      const result = await response.json();
      setGameData({ ...saveData, id: result.id });
      setHasUnsavedChanges(false);
      alert(`Game saved successfully!${isComplete ? '\n✓ Game is complete (all clues filled)' : '\n⚠ Game is incomplete'}`);
      
      // Update URL if this was a new game
      if (!id) {
        navigate(`/editor/${result.id}`, { replace: true });
      }
    } catch (err) {
      alert(`Error saving game: ${err instanceof Error ? err.message : 'Unknown error'}`);
      console.error('Error saving game:', err);
    } finally {
      setSaving(false);
    }
  };

  const deleteGame = async () => {
    if (!id) return;
    
    if (!id.startsWith('custom_') && !id.startsWith('00')) {
      alert('Only custom games can be deleted');
      return;
    }

    if (!confirm(`Are you sure you want to delete "${gameData.game_title}"?\n\nThis action cannot be undone.`)) {
      return;
    }

    try {
      const response = await fetch(`/api/games/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(errorData.error || 'Failed to delete game');
      }

      alert('Game deleted successfully');
      navigate('/seasons/00');
    } catch (err) {
      alert(`Error deleting game: ${err instanceof Error ? err.message : 'Unknown error'}`);
      console.error('Error deleting game:', err);
    }
  };

  const exportGame = () => {
    const dataStr = JSON.stringify(gameData, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `jeopardy_game_${gameData.id}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const importGame = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;

      try {
        const text = await file.text();
        const data = JSON.parse(text);
        
        // Validate basic structure
        if (!data.game_title || !data.id) {
          throw new Error('Invalid game file format');
        }

        setGameData(data);
        setHasUnsavedChanges(true);
        alert('Game imported successfully! Click Save to persist changes.');
      } catch (err) {
        alert(`Error importing game: ${err instanceof Error ? err.message : 'Invalid JSON'}`);
        console.error('Error importing game:', err);
      }
    };
    input.click();
  };

  const updateGameTitle = (title: string) => {
    setGameData({ ...gameData, game_title: title });
    setHasUnsavedChanges(true);
  };

  const updateGameComments = (comments: string) => {
    setGameData({ ...gameData, game_comments: comments });
    setHasUnsavedChanges(true);
  };

  const updateCategory = (round: GameRound, categoryNum: number, field: keyof CategoryData, value: string) => {
    const key = `category_${round}_${categoryNum}`;
    setGameData({
      ...gameData,
      [key]: { ...gameData[key], [field]: value },
    });
    setHasUnsavedChanges(true);
  };

  const updateClue = (round: GameRound, categoryNum: number, clueNum: number, field: keyof ClueData, value: any) => {
    const key = `clue_${round}_${categoryNum}_${clueNum}`;
    setGameData({
      ...gameData,
      [key]: { ...gameData[key], [field]: value },
    });
    setHasUnsavedChanges(true);
  };

  const getCategory = (round: GameRound, categoryNum: number): CategoryData => {
    return gameData[`category_${round}_${categoryNum}`] || { category_name: '', category_comments: '' };
  };

  const getClue = (round: GameRound, categoryNum: number, clueNum: number): ClueData => {
    return gameData[`clue_${round}_${categoryNum}_${clueNum}`] || {
      clue_html: '',
      clue_text: '',
      correct_response: '',
    };
  };

  const getClueValue = (round: GameRound, clueNum: number): number => {
    if (round === 'FJ') return 0;
    if (round === 'J') return clueNum * 200;
    return clueNum * 400; // DJ
  };

  const currentCategory = getCategory(currentRound, selectedCategory);
  const currentClue = getClue(currentRound, selectedCategory, selectedClue);
  const maxCategories = currentRound === 'FJ' ? 1 : 6;
  const maxClues = currentRound === 'FJ' ? 1 : 5;

  if (loading) {
    return (
      <div className="h-screen bg-gray-900 text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-[#FFCC00] mx-auto mb-4"></div>
          <p className="text-blue-200">Loading game...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-gray-900 text-white overflow-hidden">
      {/* Top Bar */}
      <div className="bg-gray-800 border-b-4 border-[#FFCC00] p-4 flex-shrink-0">
        <div className="flex items-center justify-between gap-4">
          <div className="flex-1">
            <input
              type="text"
              value={gameData.game_title}
              onChange={(e) => updateGameTitle(e.target.value)}
              className="w-full bg-gray-700 text-white px-4 py-2 rounded font-bold text-xl"
              placeholder="Game Title"
            />
          </div>
          <div className="flex gap-2">
            <button
              onClick={saveGame}
              disabled={saving}
              className="px-4 py-2 bg-green-600 hover:bg-green-500 disabled:bg-gray-600 rounded font-bold transition-colors"
            >
              {saving ? 'Saving...' : hasUnsavedChanges ? 'Save *' : 'Save'}
            </button>
            <button
              onClick={importGame}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded font-bold transition-colors"
            >
              Import
            </button>
            <button
              onClick={exportGame}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded font-bold transition-colors"
            >
              Export
            </button>
            {id && (id.startsWith('custom_') || id.startsWith('00')) && (
              <button
                onClick={deleteGame}
                className="px-4 py-2 bg-red-600 hover:bg-red-500 rounded font-bold transition-colors"
              >
                Delete
              </button>
            )}
            <Link
              to="/seasons/00"
              className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded font-bold transition-colors"
            >
              Close
            </Link>
          </div>
        </div>
        <div className="mt-2">
          <input
            type="text"
            value={gameData.game_comments}
            onChange={(e) => updateGameComments(e.target.value)}
            className="w-full bg-gray-700 text-white px-4 py-2 rounded text-sm"
            placeholder="Game comments (optional)"
          />
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar - Round & Category Selector */}
        <div className="w-64 bg-gray-800 border-r border-gray-700 flex flex-col overflow-y-auto">
          {/* Round Selector */}
          <div className="p-4 border-b border-gray-700">
            <h3 className="text-sm font-bold text-gray-400 uppercase mb-2">Round</h3>
            <div className="grid grid-cols-3 gap-2">
              {(['J', 'DJ', 'FJ'] as GameRound[]).map((round) => (
                <button
                  key={round}
                  onClick={() => {
                    setCurrentRound(round);
                    setSelectedCategory(1);
                    setSelectedClue(1);
                  }}
                  className={`px-3 py-2 rounded font-bold text-sm transition-colors ${
                    currentRound === round
                      ? 'bg-[#FFCC00] text-gray-900'
                      : 'bg-gray-700 text-white hover:bg-gray-600'
                  }`}
                >
                  {round === 'FJ' ? 'FJ' : round}
                </button>
              ))}
            </div>
          </div>

          {/* Category List */}
          <div className="flex-1 p-4">
            <h3 className="text-sm font-bold text-gray-400 uppercase mb-2">Categories</h3>
            <div className="space-y-2">
              {Array.from({ length: maxCategories }, (_, i) => i + 1).map((catNum) => {
                const cat = getCategory(currentRound, catNum);
                return (
                  <button
                    key={catNum}
                    onClick={() => {
                      setSelectedCategory(catNum);
                      setSelectedClue(1);
                    }}
                    className={`w-full text-left px-3 py-2 rounded transition-colors ${
                      selectedCategory === catNum
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    }`}
                  >
                    <div className="font-bold text-xs text-gray-400 mb-1">Cat {catNum}</div>
                    <div className="text-sm truncate">{cat.category_name || '(empty)'}</div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Center Panel - Category & Clue Grid */}
        <div className="flex-1 flex flex-col overflow-hidden bg-gray-850">
          {/* Category Editor */}
          <div className="p-6 border-b border-gray-700 bg-gray-800">
            <div className="max-w-3xl">
              <label className="block text-sm font-bold text-gray-400 uppercase mb-2">
                Category Name
              </label>
              <input
                type="text"
                value={currentCategory.category_name}
                onChange={(e) => updateCategory(currentRound, selectedCategory, 'category_name', e.target.value)}
                className="w-full bg-gray-700 text-white px-4 py-2 rounded font-bold text-lg mb-3"
                placeholder="CATEGORY NAME"
              />
              <label className="block text-sm font-bold text-gray-400 uppercase mb-2">
                Category Comments (optional)
              </label>
              <input
                type="text"
                value={currentCategory.category_comments}
                onChange={(e) => updateCategory(currentRound, selectedCategory, 'category_comments', e.target.value)}
                className="w-full bg-gray-700 text-white px-4 py-2 rounded text-sm"
                placeholder="(Alex: Category introduction or note)"
              />
            </div>
          </div>

          {/* Clue Grid */}
          <div className="flex-1 overflow-y-auto p-6">
            <div className="max-w-3xl">
              <h3 className="text-sm font-bold text-gray-400 uppercase mb-3">
                Clues {currentRound === 'FJ' ? '' : '(Select to Edit)'}
              </h3>
              <div className="grid grid-cols-5 gap-3">
                {Array.from({ length: maxClues }, (_, i) => i + 1).map((clueNum) => {
                  const clue = getClue(currentRound, selectedCategory, clueNum);
                  const value = getClueValue(currentRound, clueNum);
                  const isFilled = !!(clue.clue_text && clue.correct_response);
                  
                  return (
                    <button
                      key={clueNum}
                      onClick={() => setSelectedClue(clueNum)}
                      className={`aspect-square rounded flex flex-col items-center justify-center transition-all ${
                        selectedClue === clueNum
                          ? 'bg-blue-600 text-white ring-2 ring-[#FFCC00]'
                          : isFilled
                          ? 'bg-green-700 text-white hover:bg-green-600'
                          : 'bg-gray-700 text-gray-400 hover:bg-gray-600'
                      }`}
                    >
                      <div className="text-2xl font-bold">${value}</div>
                      <div className="text-xs mt-1">{isFilled ? '✓' : '○'}</div>
                      {clue.daily_double && (
                        <div className="text-xs font-bold text-yellow-300 mt-1">DD</div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Right Panel - Clue Editor */}
        <div className="w-96 bg-gray-800 border-l border-gray-700 flex flex-col overflow-y-auto">
          <div className="p-6">
            <div className="mb-4">
              <div className="text-xl font-bold text-[#FFCC00] mb-2">
                ${getClueValue(currentRound, selectedClue)}
                {currentRound === 'FJ' && ' (Final Jeopardy)'}
              </div>
              <div className="text-sm text-gray-400">
                {currentRound} - Cat {selectedCategory} - Clue {selectedClue}
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-gray-400 uppercase mb-2">
                  Question/Clue
                </label>
                <textarea
                  value={currentClue.clue_text}
                  onChange={(e) => updateClue(currentRound, selectedCategory, selectedClue, 'clue_text', e.target.value)}
                  onBlur={(e) => {
                    // Auto-sync clue_html with clue_text if html is empty
                    if (!currentClue.clue_html) {
                      updateClue(currentRound, selectedCategory, selectedClue, 'clue_html', e.target.value);
                    }
                  }}
                  className="w-full bg-gray-700 text-white px-3 py-2 rounded text-sm h-32 resize-none"
                  placeholder="Enter the clue text here..."
                />
                <div className="text-xs text-gray-500 mt-1">
                  Characters: {currentClue.clue_text?.length || 0}
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-400 uppercase mb-2">
                  Answer (Correct Response)
                </label>
                <input
                  type="text"
                  value={currentClue.correct_response}
                  onChange={(e) => updateClue(currentRound, selectedCategory, selectedClue, 'correct_response', e.target.value)}
                  className="w-full bg-gray-700 text-white px-3 py-2 rounded text-sm"
                  placeholder="What is...?"
                />
              </div>

              {currentRound !== 'FJ' && (
                <div>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={!!currentClue.daily_double}
                      onChange={(e) => updateClue(currentRound, selectedCategory, selectedClue, 'daily_double', e.target.checked)}
                      className="w-5 h-5"
                    />
                    <span className="text-sm font-bold text-yellow-400">Daily Double</span>
                  </label>
                </div>
              )}

              <div>
                <label className="block text-sm font-bold text-gray-400 uppercase mb-2">
                  HTML Version (optional)
                </label>
                <textarea
                  value={currentClue.clue_html}
                  onChange={(e) => updateClue(currentRound, selectedCategory, selectedClue, 'clue_html', e.target.value)}
                  className="w-full bg-gray-700 text-white px-3 py-2 rounded text-sm h-24 resize-none font-mono text-xs"
                  placeholder="HTML version with links, formatting, etc."
                />
                <div className="text-xs text-gray-500 mt-1">
                  For advanced formatting or media links
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EditorView;

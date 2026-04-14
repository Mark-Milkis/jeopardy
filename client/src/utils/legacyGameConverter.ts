import { Category, Clue } from '../types';

/**
 * Converts legacy J! Archive game format to new Category[] structure
 * 
 * Legacy format uses keys like:
 * - category_J_1, category_J_2, ... category_J_6 (Jeopardy categories)
 * - clue_J_1_1, clue_J_1_2, ... clue_J_6_5 (Jeopardy clues)
 * - category_DJ_1, ... (Double Jeopardy)
 * - clue_DJ_1_1, ... (Double Jeopardy clues)
 * - category_FJ_1 (Final Jeopardy)
 * - clue_FJ_1_1 (Final Jeopardy clue)
 */

interface LegacyGameData {
  id: string;
  game_title: string;
  game_comments?: string;
  game_complete?: boolean;
  [key: string]: any;
}

interface LegacyCategoryData {
  category_name: string;
  category_comments?: string;
  clue_count?: number;
  media?: string[];
}

interface LegacyClueData {
  id?: string;
  clue_html?: string;
  clue_text: string;
  correct_response: string;
  daily_double?: boolean;
  triple_stumper?: boolean;
  media?: string[];
}

export function convertLegacyGame(legacyData: LegacyGameData): Category[] {
  const categories: Category[] = [];

  // Process Jeopardy round
  categories.push(...convertRound(legacyData, 'J', 'JEOPARDY'));

  // Process Double Jeopardy round
  categories.push(...convertRound(legacyData, 'DJ', 'DOUBLE_JEOPARDY'));

  // Process Final Jeopardy
  categories.push(...convertRound(legacyData, 'FJ', 'FINAL_JEOPARDY'));

  return categories;
}

function convertRound(
  data: LegacyGameData,
  roundPrefix: 'J' | 'DJ' | 'FJ',
  roundName: string
): Category[] {
  const categories: Category[] = [];
  const isFinal = roundPrefix === 'FJ';
  const categoryCount = isFinal ? 1 : 6;
  const cluesPerCategory = isFinal ? 1 : 5;

  for (let catNum = 1; catNum <= categoryCount; catNum++) {
    const categoryKey = `category_${roundPrefix}_${catNum}`;
    const categoryData: LegacyCategoryData = data[categoryKey];

    if (!categoryData) {
      // Skip missing categories (incomplete games)
      continue;
    }

    const category: Category = {
      id: `${roundPrefix.toLowerCase()}-cat-${catNum}`,
      title: categoryData.category_name || `Category ${catNum}`,
      comment: categoryData.category_comments,
      clues: []
    };

    // Extract clues for this category
    for (let clueNum = 1; clueNum <= cluesPerCategory; clueNum++) {
      // Note: J-Archive uses 'clue_FJ' for Final Jeopardy (not 'clue_FJ_1_1')
      const clueKey = isFinal ? `clue_${roundPrefix}` : `clue_${roundPrefix}_${catNum}_${clueNum}`;
      const clueData: LegacyClueData = data[clueKey];

      if (!clueData) {
        // Add placeholder for missing clues
        const value = calculateClueValue(roundPrefix, clueNum);
        category.clues.push({
          id: `${roundPrefix.toLowerCase()}-clue-${catNum}-${clueNum}`,
          categoryId: category.id,
          value,
          question: '[Missing clue]',
          answer: '[Missing answer]',
          isDailyDouble: false,
          isCompleted: false,
          media: []
        });
        continue;
      }

      const value = calculateClueValue(roundPrefix, clueNum);
      
      const clue: Clue = {
        id: `${roundPrefix.toLowerCase()}-clue-${catNum}-${clueNum}`,
        categoryId: category.id,
        value,
        question: stripHtml(clueData.clue_text || clueData.clue_html || ''),
        answer: clueData.correct_response || '',
        isDailyDouble: clueData.daily_double || false,
        isCompleted: false,
        tripleStumper: clueData.triple_stumper,
        media: processMediaUrls(clueData.media)
      };

      category.clues.push(clue);
    }

    categories.push(category);
  }

  return categories;
}

function calculateClueValue(roundPrefix: 'J' | 'DJ' | 'FJ', clueNum: number): number {
  if (roundPrefix === 'FJ') return 0; // Final Jeopardy has no fixed value
  if (roundPrefix === 'J') return clueNum * 200; // 200, 400, 600, 800, 1000
  if (roundPrefix === 'DJ') return clueNum * 400; // 400, 800, 1200, 1600, 2000
  return 0;
}

function stripHtml(html: string): string {
  // Basic HTML stripping - replace with more sophisticated parsing if needed
  return html
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .trim();
}

function processMediaUrls(media?: string[]): string[] {
  if (!media || !Array.isArray(media)) return [];
  
  // Media URLs from J! Archive are already proxied to /media/* by backend
  // Just return them as-is
  return media.filter(url => typeof url === 'string' && url.length > 0);
}

/**
 * Extracts game metadata from legacy format
 */
export function extractGameMetadata(legacyData: LegacyGameData) {
  return {
    id: legacyData.id,
    title: legacyData.game_title,
    comments: legacyData.game_comments,
    isComplete: legacyData.game_complete || false
  };
}

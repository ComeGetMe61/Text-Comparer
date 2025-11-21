
import { DiffLine, DiffType, DiffResult, DiffPart } from '../types';

/**
 * Computes a character-level diff between two strings.
 */
const computeCharDiff = (text1: string, text2: string): DiffPart[] => {
  const chars1 = text1.split('');
  const chars2 = text2.split('');
  
  const matrix: number[][] = [];
  for (let i = 0; i <= chars1.length; i++) {
    matrix[i] = new Array(chars2.length + 1).fill(0);
  }

  for (let i = 1; i <= chars1.length; i++) {
    for (let j = 1; j <= chars2.length; j++) {
      if (chars1[i - 1] === chars2[j - 1]) {
        matrix[i][j] = matrix[i - 1][j - 1] + 1;
      } else {
        matrix[i][j] = Math.max(matrix[i - 1][j], matrix[i][j - 1]);
      }
    }
  }

  const result: DiffPart[] = [];
  let i = chars1.length;
  let j = chars2.length;

  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && chars1[i - 1] === chars2[j - 1]) {
      result.unshift({ type: DiffType.EQUAL, content: chars1[i - 1] });
      i--;
      j--;
    } else if (j > 0 && (i === 0 || matrix[i][j - 1] >= matrix[i - 1][j])) {
      result.unshift({ type: DiffType.INSERT, content: chars2[j - 1] });
      j--;
    } else {
      result.unshift({ type: DiffType.DELETE, content: chars1[i - 1] });
      i--;
    }
  }
  
  // Merge consecutive parts of same type
  const merged: DiffPart[] = [];
  if (result.length > 0) {
    let current = result[0];
    for (let k = 1; k < result.length; k++) {
      if (result[k].type === current.type) {
        current.content += result[k].content;
      } else {
        merged.push(current);
        current = result[k];
      }
    }
    merged.push(current);
  }

  return merged;
};

/**
 * computes a simple line-by-line diff using a basic LCS approach.
 */
export const computeDiff = (text1: string, text2: string): DiffResult => {
  const lines1 = text1.split(/\r?\n/);
  const lines2 = text2.split(/\r?\n/);

  const matrix: number[][] = [];
  for (let i = 0; i <= lines1.length; i++) {
    matrix[i] = new Array(lines2.length + 1).fill(0);
  }

  for (let i = 1; i <= lines1.length; i++) {
    for (let j = 1; j <= lines2.length; j++) {
      if (lines1[i - 1] === lines2[j - 1]) {
        matrix[i][j] = matrix[i - 1][j - 1] + 1;
      } else {
        matrix[i][j] = Math.max(matrix[i - 1][j], matrix[i][j - 1]);
      }
    }
  }

  const originalLines: DiffLine[] = [];
  const modifiedLines: DiffLine[] = [];

  let i = lines1.length;
  let j = lines2.length;
  let additions = 0;
  let deletions = 0;

  const rawDiff: { type: DiffType, content: string, oldLn?: number, newLn?: number }[] = [];

  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && lines1[i - 1] === lines2[j - 1]) {
      rawDiff.unshift({ type: DiffType.EQUAL, content: lines1[i - 1], oldLn: i, newLn: j });
      i--;
      j--;
    } else if (j > 0 && (i === 0 || matrix[i][j - 1] >= matrix[i - 1][j])) {
      rawDiff.unshift({ type: DiffType.INSERT, content: lines2[j - 1], newLn: j });
      j--;
      additions++;
    } else {
      rawDiff.unshift({ type: DiffType.DELETE, content: lines1[i - 1], oldLn: i });
      i--;
      deletions++;
    }
  }

  // Process raw diff into side-by-side structure
  
  let rawIndex = 0;
  while (rawIndex < rawDiff.length) {
    const change = rawDiff[rawIndex];
    
    if (change.type === DiffType.EQUAL) {
      originalLines.push({ type: DiffType.EQUAL, content: change.content, originalLineNumber: change.oldLn });
      modifiedLines.push({ type: DiffType.EQUAL, content: change.content, modifiedLineNumber: change.newLn });
      rawIndex++;
    } else if (change.type === DiffType.DELETE) {
      // Check if next is insert (modification)
      let modification = false;
      // Look ahead for inserts to align them if possible (simple heuristic)
      let lookAhead = rawIndex + 1;
      while (lookAhead < rawDiff.length && rawDiff[lookAhead].type === DiffType.INSERT) {
         modification = true;
         break;
      }
      
      if (modification && rawDiff[rawIndex+1]?.type === DiffType.INSERT) {
         // It's a replace block essentially, calculate character diffs
         const oldLine = change.content;
         const newLine = rawDiff[rawIndex+1].content;
         const charDiffs = computeCharDiff(oldLine, newLine);

         // Filter parts for original line (Keep EQUAL and DELETE)
         const originalParts = charDiffs.filter(p => p.type !== DiffType.INSERT);
         
         // Filter parts for modified line (Keep EQUAL and INSERT)
         const modifiedParts = charDiffs.filter(p => p.type !== DiffType.DELETE);

         originalLines.push({ 
           type: DiffType.DELETE, 
           content: change.content, 
           originalLineNumber: change.oldLn,
           parts: originalParts 
         });
         
         modifiedLines.push({ 
           type: DiffType.INSERT, 
           content: rawDiff[rawIndex+1].content, 
           modifiedLineNumber: rawDiff[rawIndex+1].newLn,
           parts: modifiedParts
         });
         rawIndex += 2;
      } else {
        originalLines.push({ type: DiffType.DELETE, content: change.content, originalLineNumber: change.oldLn });
        modifiedLines.push({ type: DiffType.EMPTY, content: '', modifiedLineNumber: undefined });
        rawIndex++;
      }
    } else if (change.type === DiffType.INSERT) {
       originalLines.push({ type: DiffType.EMPTY, content: '', originalLineNumber: undefined });
       modifiedLines.push({ type: DiffType.INSERT, content: change.content, modifiedLineNumber: change.newLn });
       rawIndex++;
    }
  }

  return {
    originalLines,
    modifiedLines,
    additions,
    deletions
  };
};

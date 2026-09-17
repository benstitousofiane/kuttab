import fs from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'path';

export interface PatchBlock {
  filePath: string;
  searchContent: string;
  replaceContent: string;
}

export function parsePatch(patchContent: string): PatchBlock[] {
  const blocks: PatchBlock[] = [];
  const regex = /<<<<<<< SEARCH:\s*([^\r\n]+)\s*[\r\n]+([\s\S]*?)=======[\r\n]+([\s\S]*?)>>>>>>> REPLACE/g;

  let match: RegExpExecArray | null;
  while ((match = regex.exec(patchContent)) !== null) {
    blocks.push({
      filePath: match[1].trim(),
      searchContent: match[2],
      replaceContent: match[3]
    });
  }

  return blocks;
}

export async function applyPatch(patchContent: string, cwd: string = process.cwd()): Promise<{ applied: number; failed: number }> {
  const blocks = parsePatch(patchContent);
  let applied = 0;
  let failed = 0;

  if (blocks.length === 0) {
    throw new Error("Aucun bloc SEARCH/REPLACE valide n'a été trouvé dans le patch.");
  }

  for (const block of blocks) {
    const fullPath = path.join(cwd, block.filePath);

    if (!existsSync(fullPath)) {
      console.error(`❌ Fichier introuvable : ${block.filePath}`);
      failed++;
      continue;
    }

    const rawContent = await fs.readFile(fullPath, 'utf-8');

    // Normalisation Linux (\r\n -> \n)
    const normalizedFile = rawContent.replace(/\r\n/g, '\n');
    const normalizedSearch = block.searchContent.replace(/\r\n/g, '\n');
    const normalizedReplace = block.replaceContent.replace(/\r\n/g, '\n');

    // 1. Match Exact
    if (normalizedFile.includes(normalizedSearch)) {
      const updatedContent = normalizedFile.replace(normalizedSearch, normalizedReplace);
      await fs.writeFile(fullPath, updatedContent, 'utf-8');
      console.log(`✅ Modifié : ${block.filePath}`);
      applied++;
      continue;
    }

    // 2. Match Ligne par Ligne (Ignorer les espaces de fin de ligne et les lignes vides parasites)
    const fileLines = normalizedFile.split('\n');
    let searchLines = normalizedSearch.split('\n').map(l => l.trimEnd());
    
    // Nettoyer les lignes vides au début/fin du bloc SEARCH générées par la regex
    if (searchLines.length > 1 && searchLines[searchLines.length - 1] === '') {
      searchLines.pop();
    }
    if (searchLines.length > 1 && searchLines[0] === '') {
      searchLines.shift();
    }

    let matchLineIndex = -1;
    for (let i = 0; i <= fileLines.length - searchLines.length; i++) {
      let match = true;
      for (let j = 0; j < searchLines.length; j++) {
        if (fileLines[i + j].trimEnd() !== searchLines[j]) {
          match = false;
          break;
        }
      }
      if (match) {
        matchLineIndex = i;
        break;
      }
    }

    if (matchLineIndex !== -1) {
      let replaceLines = normalizedReplace.split('\n');
      if (replaceLines.length > 1 && replaceLines[replaceLines.length - 1] === '') {
        replaceLines.pop();
      }
      fileLines.splice(matchLineIndex, searchLines.length, ...replaceLines);
      await fs.writeFile(fullPath, fileLines.join('\n'), 'utf-8');
      console.log(`✅ Modifié (mode flexible Linux) : ${block.filePath}`);
      applied++;
      continue;
    }

    console.error(`❌ Impossible d'aligner le bloc SEARCH dans : ${block.filePath}`);
    failed++;
  }

  return { applied, failed };
}
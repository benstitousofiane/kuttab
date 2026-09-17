import fs from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'path';
import glob from 'fast-glob';
import ignore from 'ignore';

export interface CollectorOptions {
  output?: string;
  cwd?: string;
  targetDir?: string;
}

export async function collectContext(options: CollectorOptions = {}): Promise<string> {
  const cwd = options.cwd || process.cwd();
  const outputFile = options.output || 'kuttab-context.txt';
  const targetDir = options.targetDir ? options.targetDir.replace(/^\//, '') : '';

  const ig = ignore();

  ig.add([
    '.git',
    'node_modules',
    'dist',
    'build',
    'coverage',
    '.DS_Store',
    'package-lock.json',
    'yarn.lock',
    'pnpm-lock.yaml',
    outputFile
  ]);

  const gitignorePath = path.join(cwd, '.gitignore');
  if (existsSync(gitignorePath)) {
    const gitignoreContent = await fs.readFile(gitignorePath, 'utf-8');
    ig.add(gitignoreContent);
  }

  const globPattern = targetDir ? `${targetDir}/**/*` : '**/*';

  const rawFiles = await glob(globPattern, {
    cwd,
    dot: true,
    onlyFiles: true,
    ignore: ['node_modules/**', '.git/**']
  });

  const files = rawFiles.filter((file) => !ig.ignores(file));

  let output = `# KUTTAB CONTEXT & INSTRUCTION FILE

System Instruction for the AI:
When suggesting code modifications, NEVER write full file replacements unless requested.
Always output edits using one or more Kuttab SEARCH/REPLACE blocks formatted EXACTLY as follows:

<<<<<<< SEARCH: relative/path/to/file.ext
[exact lines of code currently in the file to be replaced]
=======
[new lines of code to insert]
>>>>>>> REPLACE

CRITICAL RULES FOR SEARCH/REPLACE BLOCKS:
1. The SEARCH block must match the existing target file content EXACTLY, line-for-line (including spaces, indentation, and empty lines).
2. Keep SEARCH blocks as small as possible—only include 2-4 lines of surrounding context to uniquely identify the location.
3. Do NOT add extra whitespace or comments after the file path in the SEARCH header line.
4. Multiple SEARCH/REPLACE blocks can be provided in a single response for one or more files.

---

## Project Structure
`;

  files.forEach((file) => {
    output += `- ${file}\n`;
  });

  output += '\n---\n\n## File Contents\n\n';

  for (const file of files) {
    const filePath = path.join(cwd, file);
    try {
      const content = await fs.readFile(filePath, 'utf-8');
      output += `================================================\n`;
      output += `FILE: ${file}\n`;
      output += `================================================\n`;
      output += `${content}\n\n`;
    } catch {
      output += `================================================\n`;
      output += `FILE: ${file} (Error reading file)\n`;
      output += `================================================\n\n`;
    }
  }

  const outputPath = path.join(cwd, outputFile);
  await fs.writeFile(outputPath, output, 'utf-8');

  return outputPath;
}

export const generateContext = collectContext;
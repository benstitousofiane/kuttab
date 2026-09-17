#!/usr/bin/env node

import { Command } from 'commander';
import chalk from 'chalk';
import fs from 'node:fs/promises';
import { collectContext } from '../core/collector';
import { applyPatch } from '../core/applier';

const program = new Command();

program
  .name('kuttab')
  .description('CLI local-first pour la gestion et le refactoring de code par IA')
  .version('1.0.0');

// Commande PACK avec support d'un sous-dossier optionnel
program
  .command('pack [directory]')
  .description('Génère le fichier de contexte pour tout le projet ou un sous-dossier spécifique')
  .option('-o, --output <filename>', 'Nom du fichier de sortie', 'kuttab-context.txt')
  .action(async (directory, options) => {
    try {
      const targetMessage = directory ? `du dossier "${directory}"` : 'du projet';
      console.log(chalk.blue(`📦 Analyse ${targetMessage} en cours...`));

      const outputPath = await collectContext({
        output: options.output,
        targetDir: directory
      });

      console.log(chalk.green(`✨ Fichier de contexte généré avec succès : ${chalk.bold(outputPath)}`));
    } catch (error: any) {
      console.error(chalk.red(`❌ Erreur lors de la génération du contexte : ${error.message}`));
      process.exit(1);
    }
  });

// Commande APPLY
program
  .command('apply [patchFile]')
  .description('Applique les blocs SEARCH/REPLACE générés par l\'IA sur le disque')
  .action(async (patchFile) => {
    try {
      let patchContent = '';

      if (patchFile) {
        patchContent = await fs.readFile(patchFile, 'utf-8');
      } else {
        if (process.stdin.isTTY) {
          console.error(chalk.yellow('⚠️ Veuillez fournir un fichier patch ou rediriger du texte via stdin.'));
          process.exit(1);
        }

        const chunks: Buffer[] = [];
        for await (const chunk of process.stdin) {
          chunks.push(Buffer.from(chunk));
        }
        patchContent = Buffer.concat(chunks).toString('utf-8');
      }

      console.log(chalk.blue('🔄 Application des modifications...'));
      const result = await applyPatch(patchContent);

      console.log(
        chalk.green(`\n🎉 Terminé ! Modifiés : ${result.applied} | Échecs : ${result.failed}`)
      );
    } catch (error: any) {
      console.error(chalk.red(`❌ Erreur lors de l'application du patch : ${error.message}`));
      process.exit(1);
    }
  });

program.parse(process.argv);
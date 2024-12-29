#!/usr/bin/env node

const { translate } = require('../translate-gen/translate');
const { Command } = require('commander');
const path = require(`path`);
const program = new Command();
program.description('A CLI for generating static translation files').version('0.0.1')
program.option('-trg_langs, --target_languages <target_languages...>', 'Language to generate')
program.option('-dir, --directory <directory>', 'Directory to start generating translations from')
program.option('-ext, --extensions <extensions...>', 'File extensions to search for')
program.option('-ignore, --ignore_directories <ignore_directories...>', 'Directories to ignore')
program.option('-src_lang, --source_language <source_language>', 'Source language to translate from')
program.option('-ignore_files, --ignore_files <ignore_files...>', 'Files to ignore')
program.option('-ignore_functions, --ignore_functions <ignore_functions...>', 'Functions to ignore')
program.option('-ignore_attributes, --ignore_strings <ignore_strings...>', 'Strings to ignore')

program.parse();

const languages = program.opts().target_languages
const dir = program.opts().directory ? path.join(__dirname, program.opts().directory) : path.join(__dirname, `../../React-Next-Revision/react-next-revision/18-healthcare-main`)
const src_lang = program.opts().source_language ? program.opts().source_language : 'eng_Latn'
console.log(languages)
if (!languages) {
  console.error('Please specify a language');
  process.exit(1);
}else {
  console.log(`Generating language translation file`);
  translate(languages,dir,src_lang)
}
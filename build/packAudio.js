import fs from 'fs';
import path from 'path';
import ffmpeg from 'fluent-ffmpeg';

const sfxInputDir = path.resolve('resources', 'sfx');
const sfxOutputDir = path.resolve('public', 'assets', 'sfx');

const musicInputDir = path.resolve('resources', 'music');
const musicOutputDir = path.resolve('public', 'assets', 'music');

function findAudio(dir) {
   const exts = ['.mp3', '.ogg', '.flac', '.m4a', '.wav'];
   const files = [];
   fs.readdirSync(dir).forEach(filename=>{
      const fullPath = path.resolve(dir, filename);
      const stat = fs.statSync(fullPath);
      if( stat && stat.isDirectory() ) files.push(...findAudio(fullPath));
      else if( stat && stat.isFile() && exts.includes(path.extname(filename).toLowerCase()) ) files.push(fullPath);
   });
   return files;
}

function convertAudio(files, outputDir) {
   fs.mkdirSync(outputDir, { recursive: true });
   files.forEach(fullPath=>{
      const ext = path.extname(fullPath);
      const name = path.basename(fullPath, ext);
      ffmpeg(fullPath)
         .noVideo()
         .output(path.resolve(outputDir, name + '.ogg'))
         .run();
   });
}

convertAudio(findAudio(sfxInputDir), sfxOutputDir);
convertAudio(findAudio(musicInputDir), musicOutputDir);
console.log('Audio packing complete.');

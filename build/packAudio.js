import fs from 'fs';
import path from 'path';
import ffmpeg from 'fluent-ffmpeg';

const sfxInputDir = path.resolve('resources', 'sfx');
const sfxOutputDir = path.resolve('public', 'assets', 'sfx');

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

function convertAudio(files) {
   fs.mkdirSync(sfxOutputDir, { recursive: true });
   files.forEach(fullPath=>{
      const ext = path.extname(fullPath);
      const name = path.basename(fullPath, ext);
      ffmpeg(fullPath).output(path.resolve(sfxOutputDir, name + '.ogg')).run();
   });
}

convertAudio(findAudio(sfxInputDir));
console.log('Audio packing complete.');

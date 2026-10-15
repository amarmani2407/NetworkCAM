import fs from 'fs';
import path from 'path';
import { ANDROID_PROJECT_FILES } from '../src/data/androidProject';

const targetBase = path.resolve(process.cwd(), 'android');
const rootDir = process.cwd();

console.log('Writing all Android files to both root and android/ directories...');

for (const file of ANDROID_PROJECT_FILES) {
  // Write to android/ folder
  const destPath = path.join(targetBase, file.path);
  const dir = path.dirname(destPath);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(destPath, file.content, 'utf8');

  // Also write to root directory
  const rootDest = path.join(rootDir, file.path);
  const rootDirName = path.dirname(rootDest);
  fs.mkdirSync(rootDirName, { recursive: true });
  fs.writeFileSync(rootDest, file.content, 'utf8');
}

// Make gradlew executable
try {
  fs.chmodSync(path.join(rootDir, 'gradlew'), 0o755);
  fs.chmodSync(path.join(targetBase, 'gradlew'), 0o755);
} catch (e) {
  // Ignore permission errors in some envs
}

console.log('Successfully written and synchronized all files across root and android/!');

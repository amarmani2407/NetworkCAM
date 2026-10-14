import fs from 'fs';
import path from 'path';
import { ANDROID_PROJECT_FILES } from '../src/data/androidProject';

const targetBase = path.resolve(process.cwd(), 'android');

console.log('Writing all Android files to:', targetBase);

for (const file of ANDROID_PROJECT_FILES) {
  // If the path starts with .github, skip or write to root
  const destPath = path.join(targetBase, file.path);
  const dir = path.dirname(destPath);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(destPath, file.content, 'utf8');
  console.log('Wrote:', destPath);
}

// Also ensure root settings.gradle.kts and build.gradle.kts exist so whether GitHub Actions builds root or android, both work!
fs.writeFileSync(path.resolve(process.cwd(), 'settings.gradle.kts'), `pluginManagement {
    repositories {
        google()
        mavenCentral()
        gradlePluginPortal()
    }
}
dependencyResolutionManagement {
    repositoriesMode.set(RepositoriesMode.FAIL_ON_PROJECT_REPOS)
    repositories {
        google()
        mavenCentral()
    }
}
rootProject.name = "LocalCamStreamer"
include(":android:app")
project(":android:app").projectDir = file("android/app")
`, 'utf8');

console.log('Successfully written all files!');

import fs from 'fs';
import path from 'path';
import { ANDROID_PROJECT_FILES } from '../src/data/androidProject';

const targetBase = path.resolve(process.cwd(), 'android');

console.log('Writing all Android files to:', targetBase);

for (const file of ANDROID_PROJECT_FILES) {
  const destPath = path.join(targetBase, file.path);
  const dir = path.dirname(destPath);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(destPath, file.content, 'utf8');
  console.log('Wrote:', destPath);
}

// Also ensure root build configuration files exist
const rootDir = process.cwd();

fs.writeFileSync(path.join(rootDir, 'settings.gradle.kts'), `pluginManagement {
    repositories {
        google {
            content {
                includeGroupByRegex("com\\\\.android.*")
                includeGroupByRegex("com\\\\.google.*")
                includeGroupByRegex("androidx.*")
            }
        }
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

if (file("app").isDirectory) {
    include(":app")
} else if (file("android/app").isDirectory) {
    include(":app")
    project(":app").projectDir = file("android/app")
}
`, 'utf8');

fs.writeFileSync(path.join(rootDir, 'build.gradle.kts'), `// Top-level build file
plugins {
    id("com.android.application") version "8.2.2" apply false
    id("org.jetbrains.kotlin.android") version "1.9.22" apply false
    id("org.jetbrains.kotlin.plugin.serialization") version "1.9.22" apply false
}
`, 'utf8');

fs.writeFileSync(path.join(rootDir, 'gradle.properties'), `org.gradle.jvmargs=-Xmx2048m -Dfile.encoding=UTF-8
android.useAndroidX=true
android.nonTransitiveRClass=true
kotlin.code.style=official
`, 'utf8');

console.log('Successfully written all files!');

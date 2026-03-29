const fs = require('fs');
const path = require('path');

function copyFile(src, dest) {
  if (fs.existsSync(src)) {
    fs.copyFileSync(src, dest);
    console.log(`Restored: ${dest}`);
  }
}

function copyDir(src, dest) {
  if (!fs.existsSync(dest)) fs.mkdirSync(dest, { recursive: true });
  const entries = fs.readdirSync(src, { withFileTypes: true });
  for (let entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      copyDir(srcPath, destPath);
    } else {
      copyFile(srcPath, destPath);
    }
  }
}

console.log('Restoring native Android overrides...');

// Java files
const javaDestDir = 'android/app/src/main/java/com/trackshi/app';
if (!fs.existsSync(javaDestDir)) fs.mkdirSync(javaDestDir, { recursive: true });

copyFile('native-overrides/MainActivity.java', path.join(javaDestDir, 'MainActivity.java'));

// Manifest
copyFile('native-overrides/AndroidManifest.xml', 'android/app/src/main/AndroidManifest.xml');

// Res folder (icons, colors, etc)
copyDir('native-overrides/res', 'android/app/src/main/res');

console.log('Native overrides restored successfully!');

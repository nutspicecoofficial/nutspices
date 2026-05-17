const fs = require('fs');
const path = require('path');

const projectRoot = __dirname;
const targetDirs = ['src', 'tests'];
const targetFiles = ['package.json', 'package-lock.json'];

function replaceInFile(filePath) {
    try {
        let content = fs.readFileSync(filePath, 'utf8');
        let originalContent = content;
        
        // Case sensitive replaces first to be safe, then case insensitive if needed
        // Actually, let's just do exact case replacements
        content = content.replace(/Ashwaah/g, 'Nutspice');
        content = content.replace(/ashwaah/g, 'nutspice');
        content = content.replace(/ASHWAAH/g, 'NUTSPICE');

        if (content !== originalContent) {
            fs.writeFileSync(filePath, content, 'utf8');
            console.log(`Updated: ${filePath}`);
        }
    } catch (e) {
        console.error(`Failed to process ${filePath}:`, e);
    }
}

function processDirectory(dir) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const fullPath = path.join(dir, file);
        const stat = fs.statSync(fullPath);
        if (stat.isDirectory()) {
            processDirectory(fullPath);
        } else if (stat.isFile()) {
            // Only process text files like ts, tsx, js, json, css, html, md
            if (/\.(ts|tsx|js|jsx|json|css|html|md|txt)$/.test(fullPath)) {
                replaceInFile(fullPath);
            }
        }
    }
}

// Process target directories
targetDirs.forEach(dir => {
    const fullPath = path.join(projectRoot, dir);
    if (fs.existsSync(fullPath)) {
        processDirectory(fullPath);
    }
});

// Process specific target files
targetFiles.forEach(file => {
    const fullPath = path.join(projectRoot, file);
    if (fs.existsSync(fullPath)) {
        replaceInFile(fullPath);
    }
});

console.log('Renaming complete.');

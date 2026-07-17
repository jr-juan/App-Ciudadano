const fs = require('fs');
const path = require('path');

const root = process.cwd();
const skipDirs = new Set(['.git', 'node_modules', 'www', 'android', 'ios', 'dist', 'coverage']);
const textExts = new Set([
  '.ts', '.js', '.scss', '.css', '.html', '.md', '.json', '.yml', '.yaml', '.xml', '.txt'
]);
const specialNames = new Set(['.gitignore', '.browserslistrc']);
const triggerPhrases = [
  '',
  ''
];

function canProcess(filePath) {
  const ext = path.extname(filePath);
  const name = path.basename(filePath);
  return textExts.has(ext) || specialNames.has(name);
}

function isCommentLine(line) {
  return /^\s*(\/\/|#|<!--|\/\*|\*|\*\/|-->)/.test(line);
}

function stripHeader(text) {
  const lines = text.split(/\r?\n/);
  let i = 0;

  while (i < lines.length && lines[i].trim() === '') {
    i++;
  }

  if (i >= lines.length || !isCommentLine(lines[i])) {
    return text;
  }

  let j = i;
  while (j < lines.length) {
    const line = lines[j];
    if (line.trim() === '') {
      const next = lines[j + 1];
      if (next !== undefined && (isCommentLine(next) || next.trim() === '')) {
        j++;
        continue;
      }
      break;
    }
    if (!isCommentLine(line)) {
      break;
    }
    j++;
  }

  const block = lines.slice(i, j).join('\n');
  if (!triggerPhrases.some(p => block.includes(p))) {
    return text;
  }

  let rest = lines.slice(j).join('\n');
  rest = rest.replace(/^\n+/, '');
  rest = rest.replace(/\n{3,}/g, '\n\n');
  return rest;
}

function walk(dir) {
  let changed = 0;

  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === '.git') {
      continue;
    }

    const full = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      if (skipDirs.has(entry.name)) {
        continue;
      }
      changed += walk(full);
      continue;
    }

    if (!entry.isFile() || !canProcess(full)) {
      continue;
    }

    const text = fs.readFileSync(full, 'utf8');
    if (!triggerPhrases.some(p => text.includes(p))) {
      continue;
    }

    const cleaned = stripHeader(text);
    if (cleaned !== text) {
      fs.writeFileSync(full, cleaned);
      changed++;
      console.log('Cleaned:', full.replace(root + path.sep, ''));
    }
  }

  return changed;
}

const count = walk(root);
console.log('Total cleaned:', count);

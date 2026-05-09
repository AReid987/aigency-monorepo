#!/bin/bash
# wiki-check.sh — Check if wiki needs updates based on recent code changes
# Usage: wiki-check.sh [--auto-fix]

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "${SCRIPT_DIR}/../.." && pwd)"

cd "$REPO_ROOT"

AUTO_FIX=false
if [ "${1:-}" = "--auto-fix" ]; then
  AUTO_FIX=true
fi

WIKI_DIR="$REPO_ROOT/wiki"
WIKI_INDEX="$WIKI_DIR/index.md"
NEEDS_UPDATE=false
CHANGES_LOG=""

# Ensure wiki directory exists
mkdir -p "$WIKI_DIR"

# Check for API surface changes (exports added/removed)
echo "🔍 Checking for API surface changes..."
STAGED_FILES=$(git diff --cached --name-only --diff-filter=ACM 2>/dev/null || git diff --name-only --diff-filter=ACM HEAD~1 2>/dev/null || echo "")

for file in $STAGED_FILES; do
  # Check if any package's src/index.ts or main export file changed
  if echo "$file" | grep -qE "packages/.+/src/(index|main|exports)\.ts$"; then
    NEEDS_UPDATE=true
    CHANGES_LOG="$CHANGES_LOG\n  - API exports changed: $file"
  fi

  # Check if new packages were added
  if echo "$file" | grep -qE "^packages/.+/package\.json$"; then
    NEEDS_UPDATE=true
    CHANGES_LOG="$CHANGES_LOG\n  - Package metadata changed: $file"
  fi

  # Check if AGENTS.md or CLAUDE.md changed
  if echo "$file" | grep -qE "AGENTS\.md$|CLAUDE\.md$"; then
    NEEDS_UPDATE=true
    CHANGES_LOG="$CHANGES_LOG\n  - Agent docs changed: $file"
  fi

  # Check if README changed
  if echo "$file" | grep -qE "README\.md$"; then
    NEEDS_UPDATE=true
    CHANGES_LOG="$CHANGES_LOG\n  - README updated: $file"
  fi
done

# Check if wiki index exists and is older than 7 days
if [ -f "$WIKI_INDEX" ]; then
  WIKI_AGE=$(( ($(date +%s) - $(stat -c %Y "$WIKI_INDEX" 2>/dev/null || stat -f %m "$WIKI_INDEX")) / 86400 ))
  if [ "$WIKI_AGE" -gt 7 ]; then
    NEEDS_UPDATE=true
    CHANGES_LOG="$CHANGES_LOG\n  - Wiki index is $WIKI_AGE days old (stale)"
  fi
else
  NEEDS_UPDATE=true
  CHANGES_LOG="$CHANGES_LOG\n  - Wiki index does not exist"
fi

# Check for undocumented packages
for pkg_dir in packages/* apps/*/; do
  pkg_name=$(basename "$pkg_dir")
  pkg_readme="$pkg_dir/README.md"
  pkg_wiki="$WIKI_DIR/$pkg_name.md"

  if [ ! -f "$pkg_wiki" ] && [ -f "$pkg_dir/package.json" ]; then
    NEEDS_UPDATE=true
    CHANGES_LOG="$CHANGES_LOG\n  - Missing wiki page for: $pkg_name"
  fi
done

if [ "$NEEDS_UPDATE" = false ]; then
  echo "✅ Wiki is up to date — no changes needed"
  exit 0
fi

echo "🧠 Wiki updates needed:$CHANGES_LOG"

if [ "$AUTO_FIX" = false ]; then
  echo ""
  echo "💡 To update wiki automatically, run:"
  echo "   wiki-check.sh --auto-fix"
  echo ""
  echo "Or manually update wiki pages in: $WIKI_DIR"
  exit 1
fi

# Auto-fix: Generate or update wiki pages
echo "📝 Auto-updating wiki..."

# Generate package index
node -e "
const fs = require('fs');
const path = require('path');

const packages = [];
for (const dir of ['packages', 'apps']) {
  if (!fs.existsSync(dir)) continue;
  for (const pkg of fs.readdirSync(dir)) {
    const pkgJson = path.join(dir, pkg, 'package.json');
    if (fs.existsSync(pkgJson)) {
      const meta = JSON.parse(fs.readFileSync(pkgJson, 'utf-8'));
      packages.push({
        name: pkg,
        path: path.join(dir, pkg),
        description: meta.description || '',
        version: meta.version || '0.0.0'
      });
    }
  }
}

packages.sort((a, b) => a.name.localeCompare(b.name));

let index = '# Aigency Monorepo Wiki\n\n';
index += '> Auto-generated knowledge base. Last updated: ' + new Date().toISOString() + '\n\n';
index += '## Packages\n\n';

for (const pkg of packages) {
  index += '### ' + pkg.name + '\n\n';
  index += '- **Path:** \`' + pkg.path + '\`\n';
  index += '- **Version:** ' + pkg.version + '\n';
  if (pkg.description) index += '- **Description:** ' + pkg.description + '\n';
  index += '\n';
}

const wikiDir = '$WIKI_DIR';
if (!fs.existsSync(wikiDir)) fs.mkdirSync(wikiDir, { recursive: true });
fs.writeFileSync(path.join(wikiDir, 'index.md'), index);
console.log('Generated wiki/index.md with ' + packages.length + ' packages');
" || true

echo "✅ Wiki auto-updated at: $WIKI_DIR/index.md"

# Stage wiki changes if in a git context
if git rev-parse --git-dir > /dev/null 2>&1; then
  git add "$WIKI_DIR/" 2>/dev/null || true
  echo "📦 Wiki changes staged for commit"
fi

// Used by .github/workflows/release.yml.
//
//   node scripts/release-changelog.js <version> <notes-output-file>
//
// Renames the "### Unreleased" heading in CHANGELOG.md to "### <version> - <date>"
// and writes that section's bullets to <notes-output-file> (used as GitHub release notes).
// Fails if there is no Unreleased section or it is empty.

const fs = require('fs');

const [version, notesFile] = process.argv.slice(2);
if (!version || !notesFile) {
    console.error('Usage: node scripts/release-changelog.js <version> <notes-output-file>');
    process.exit(1);
}

const changelogPath = 'CHANGELOG.md';
const text = fs.readFileSync(changelogPath, 'utf8');
const eol = text.includes('\r\n') ? '\r\n' : '\n';
const lines = text.split(/\r?\n/);

const start = lines.findIndex(l => /^###\s+Unreleased\s*$/i.test(l));
if (start < 0) {
    console.error('CHANGELOG.md has no "### Unreleased" section. Add the release notes there first.');
    process.exit(1);
}

let end = lines.findIndex((l, i) => i > start && /^#{1,3}\s/.test(l));
if (end < 0) {
    end = lines.length;
}

const notes = lines.slice(start + 1, end).join('\n').trim();
if (!notes) {
    console.error('The "### Unreleased" section in CHANGELOG.md is empty.');
    process.exit(1);
}

const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July',
    'August', 'September', 'October', 'November', 'December'];
const now = new Date();
const date = `${now.getUTCDate()} ${months[now.getUTCMonth()]} ${now.getUTCFullYear()}`;

lines[start] = `### ${version} - ${date}`;
fs.writeFileSync(changelogPath, lines.join(eol));
fs.writeFileSync(notesFile, notes + '\n');

console.log(`CHANGELOG.md: "Unreleased" -> "${lines[start]}"`);

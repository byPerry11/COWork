const fs = require('fs');
const path = require('path');

const targetFile = path.resolve(__dirname, 'src/components/projects/create-project-dialog.tsx');
let content = fs.readFileSync(targetFile, 'utf8');

// The replacement for Trigger
content = content.replace(/Create Project\r?\n\s*<\/Button>\r?\n\s*<\/DialogTrigger>/g, 'Create Project\n        </Button>\n        )}\n      </DialogTrigger>');

// The replacement for Footer missing block
content = content.replace(/<\/Button>\r?\n\s*\)\}\r?\n\s*<\/DialogFooter>/g, '</Button>\n            </DialogFooter>');

fs.writeFileSync(targetFile, content, 'utf8');
console.log('JSX JSX Successfully repaired using Node RegEx!');

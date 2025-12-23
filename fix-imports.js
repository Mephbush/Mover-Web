import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

function fixImportsInFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    
    // Remove version specifiers from imports like "@package@version"
    // This regex handles patterns like: import { X } from "@package@version";
    const fixed = content
      // Fix pattern: from "@scope/package@version"
      .replace(/from "(@[^/]+\/[^@"]+)@[^"]+"/g, 'from "$1"')
      // Fix pattern: from "package@version"  
      .replace(/from "([^@/"]+)@[^"]+"/g, 'from "$1"')
      // Fix pattern in import statements for re-exports
      .replace(/ from "@([^/]+)\/([^@"]+)@[^"]*"/g, ' from "@$1/$2"')
      // Fix sonner specific imports with version specifiers
      .replace(/from "sonner@[^"]+"/g, 'from "sonner"')
      .replace(/from "next-themes@[^"]+"/g, 'from "next-themes"')
      .replace(/from "class-variance-authority@[^"]+"/g, 'from "class-variance-authority"');
    
    if (content !== fixed) {
      fs.writeFileSync(filePath, fixed, 'utf8');
      console.log(`✓ Fixed: ${filePath}`);
      return true;
    }
    return false;
  } catch (error) {
    console.error(`Error processing ${filePath}:`, error.message);
    return false;
  }
}

function walkDir(dir) {
  let fixed = 0;
  const files = fs.readdirSync(dir);
  
  for (const file of files) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      fixed += walkDir(filePath);
    } else if (file.endsWith('.tsx') || file.endsWith('.ts') || file.endsWith('.jsx') || file.endsWith('.js')) {
      if (fixImportsInFile(filePath)) {
        fixed++;
      }
    }
  }
  
  return fixed;
}

console.log('Fixing import statements...');
const componentsFixed = walkDir(path.join(__dirname, 'components'));
const utilsFixed = walkDir(path.join(__dirname, 'utils'));
const total = componentsFixed + utilsFixed;

console.log(`\n✅ Total files fixed: ${total}`);

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

function fixImportsInFile(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let fixed = content;
    
    // Fix all version specifiers in imports
    // Pattern 1: from "anything@version"
    fixed = fixed.replace(/from\s+["']([^"']+)@[\d.]+["']/g, 'from "$1"');
    
    // Pattern 2: import statements with version specifiers
    fixed = fixed.replace(/import\s+.*from\s+["']([^"']+)@[\d.]+["']/g, (match) => {
      return match.replace(/@[\d.]+/g, '');
    });
    
    // Pattern 3: specific package fixes
    fixed = fixed.replace(/["']sonner@[\d.]+["']/g, '"sonner"');
    fixed = fixed.replace(/["']next-themes@[\d.]+["']/g, '"next-themes"');
    fixed = fixed.replace(/["']class-variance-authority@[\d.]+["']/g, '"class-variance-authority"');
    
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

console.log('Fixing all remaining import version specifiers...');
const componentsFixed = walkDir(path.join(__dirname, 'components'));
const utilsFixed = walkDir(path.join(__dirname, 'utils'));
const total = componentsFixed + utilsFixed;

console.log(`\n✅ Total files fixed: ${total}`);

#!/usr/bin/env node

/**
 * Tool Name Validation Script
 * Validates that all MCP tool names are <= 64 characters
 * Run: node scripts/validate-tool-names.js
 */

const fs = require('fs');
const glob = require('glob');
const path = require('path');

const MAX_NAME_LENGTH = 64;

function validateToolNames() {
  console.log('🔍 Validating MCP tool names...\n');
  
  // Find all tool definition files
  const files = glob.sync('src/mcp-tool/tools/**/*.ts');
  const violations = [];
  let totalTools = 0;
  
  files.forEach(file => {
    const content = fs.readFileSync(file, 'utf8');
    
    // Find tool name definitions
    const matches = content.match(/name:\s*['"]([^'"]+)['"],?/g);
    
    if (matches) {
      matches.forEach(match => {
        const nameMatch = match.match(/name:\s*['"]([^'"]+)['"],?/);
        if (nameMatch) {
          const name = nameMatch[1];
          totalTools++;
          
          if (name.length > MAX_NAME_LENGTH) {
            violations.push({
              file: path.relative(process.cwd(), file),
              name,
              length: name.length,
              excess: name.length - MAX_NAME_LENGTH
            });
          }
        }
      });
    }
  });
  
  // Report results
  console.log(`📊 Total tools scanned: ${totalTools}`);
  console.log(`📏 Maximum allowed length: ${MAX_NAME_LENGTH} characters`);
  
  if (violations.length === 0) {
    console.log('✅ All tool names are within the 64-character limit!');
    process.exit(0);
  } else {
    console.log(`❌ Found ${violations.length} tool name(s) exceeding the limit:\n`);
    
    violations.forEach((v, i) => {
      console.log(`${i + 1}. ${v.name}`);
      console.log(`   Length: ${v.length} chars (+${v.excess} over limit)`);
      console.log(`   File: ${v.file}\n`);
    });
    
    console.log('💡 Suggested fixes:');
    console.log('- Use abbreviations: application → app, permission → perm');
    console.log('- Remove redundant words: batchCreateAuthorization → batchCreateAuth');
    console.log('- Use snake_case instead of camelCase if shorter');
    
    process.exit(1);
  }
}

if (require.main === module) {
  validateToolNames();
}

module.exports = { validateToolNames };
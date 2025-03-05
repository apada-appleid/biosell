#!/usr/bin/env node

/**
 * Pre-deployment verification script
 * This script validates that the application is ready for production deployment
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Colors for console output
const colors = {
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m',
};

console.log(`${colors.blue}Running pre-deployment checks...${colors.reset}\n`);

let errors = 0;
let warnings = 0;

// Function to check if a file exists
function fileExists(filePath) {
  try {
    return fs.existsSync(filePath);
  } catch (err) {
    return false;
  }
}

// Check if production environment file exists
function checkEnvFile() {
  console.log(`${colors.blue}Checking environment files...${colors.reset}`);
  
  const envProdPath = path.join(process.cwd(), '.env.production');
  
  if (!fileExists(envProdPath)) {
    console.log(`${colors.yellow}⚠️ Warning: .env.production file not found${colors.reset}`);
    console.log(`   Create it with the required environment variables for production.`);
    warnings++;
  } else {
    console.log(`${colors.green}✓ .env.production file exists${colors.reset}`);
    
    // Check for required variables
    const envContent = fs.readFileSync(envProdPath, 'utf8');
    const requiredVars = ['DATABASE_URL', 'NEXTAUTH_URL', 'NEXTAUTH_SECRET'];
    
    for (const variable of requiredVars) {
      if (!envContent.includes(`${variable}=`)) {
        console.log(`${colors.yellow}⚠️ Warning: ${variable} not found in .env.production${colors.reset}`);
        warnings++;
      }
    }
  }
}

// Check if the build passes
function checkBuild() {
  console.log(`\n${colors.blue}Checking build...${colors.reset}`);
  
  try {
    execSync('npm run build', { stdio: 'ignore' });
    console.log(`${colors.green}✓ Build successful${colors.reset}`);
  } catch (error) {
    console.log(`${colors.red}✗ Build failed${colors.reset}`);
    console.log(`  Run 'npm run build' to see detailed errors.`);
    errors++;
  }
}

// Check for TypeScript errors
function checkTypeScript() {
  console.log(`\n${colors.blue}Checking TypeScript...${colors.reset}`);
  
  try {
    execSync('npx tsc --noEmit', { stdio: 'ignore' });
    console.log(`${colors.green}✓ TypeScript validation passed${colors.reset}`);
  } catch (error) {
    console.log(`${colors.red}✗ TypeScript validation failed${colors.reset}`);
    console.log(`  Run 'npx tsc --noEmit' to see detailed errors.`);
    errors++;
  }
}

// Check for package vulnerabilities
function checkDependencies() {
  console.log(`\n${colors.blue}Checking dependencies...${colors.reset}`);
  
  try {
    const output = execSync('npm audit --production', { encoding: 'utf8' });
    
    if (output.includes('found 0 vulnerabilities')) {
      console.log(`${colors.green}✓ No vulnerabilities found${colors.reset}`);
    } else {
      console.log(`${colors.yellow}⚠️ Warning: Vulnerabilities found in dependencies${colors.reset}`);
      console.log(`  Run 'npm audit' for details.`);
      warnings++;
    }
  } catch (error) {
    console.log(`${colors.yellow}⚠️ Warning: Vulnerabilities found in dependencies${colors.reset}`);
    console.log(`  Run 'npm audit' for details.`);
    warnings++;
  }
}

// Run the checks
checkEnvFile();
checkTypeScript();
checkBuild();
checkDependencies();

// Print summary
console.log(`\n${colors.blue}Deployment check summary:${colors.reset}`);
if (errors === 0 && warnings === 0) {
  console.log(`${colors.green}✓ All checks passed! The application is ready for deployment.${colors.reset}`);
} else {
  if (errors > 0) {
    console.log(`${colors.red}✗ Found ${errors} error(s) that must be fixed before deployment.${colors.reset}`);
  }
  
  if (warnings > 0) {
    console.log(`${colors.yellow}⚠️ Found ${warnings} warning(s) that should be reviewed.${colors.reset}`);
  }
}

// Exit with appropriate code
process.exit(errors > 0 ? 1 : 0); 
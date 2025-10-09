#!/usr/bin/env node

/**
 * Environment Variables Injection Script
 * This script injects environment variables into HTML files for non-Vite environments
 */

const fs = require('fs');
const path = require('path');

// Load environment variables from .env file
function loadEnvFile() {
    const envPath = path.join(process.cwd(), '.env');
    const env = {};
    
    if (fs.existsSync(envPath)) {
        const envContent = fs.readFileSync(envPath, 'utf8');
        const lines = envContent.split('\n');
        
        for (const line of lines) {
            const trimmedLine = line.trim();
            if (trimmedLine && !trimmedLine.startsWith('#')) {
                const [key, ...valueParts] = trimmedLine.split('=');
                const value = valueParts.join('=').replace(/^["']|["']$/g, ''); // Remove quotes
                env[key.trim()] = value.trim();
            }
        }
    }
    
    return env;
}

// Inject environment variables into HTML files
function injectEnvIntoHTML(env) {
    const htmlFiles = [
        'index.html',
        'about.html',
        'contact.html',
        'career.html',
        'login.html',
        'register.html',
        'pitch-submission.html',
        'AI_analyzer.html',
        'mentor-dashboard.html',
        'mentor-matching.html',
        'history.html',
        'settings.html',
        'privacy-policy.html',
        'terms-of-service.html'
    ];
    
    const envScript = `
    <script type="application/json" data-env>
    ${JSON.stringify(env, null, 2)}
    </script>
    `;
    
    for (const htmlFile of htmlFiles) {
        const filePath = path.join(process.cwd(), htmlFile);
        
        if (fs.existsSync(filePath)) {
            let content = fs.readFileSync(filePath, 'utf8');
            
            // Check if env script already exists
            if (!content.includes('data-env')) {
                // Inject before closing head tag
                content = content.replace('</head>', `${envScript}\n</head>`);
                
                fs.writeFileSync(filePath, content);
                console.log(`Injected environment variables into ${htmlFile}`);
            } else {
                console.log(`Environment variables already injected into ${htmlFile}`);
            }
        }
    }
}

// Main function
function main() {
    console.log('Loading environment variables...');
    const env = loadEnvFile();
    
    if (Object.keys(env).length === 0) {
        console.log('No environment variables found in .env file');
        return;
    }
    
    console.log(`Loaded ${Object.keys(env).length} environment variables`);
    injectEnvIntoHTML(env);
    console.log('Environment variables injection completed');
}

// Run if called directly
if (require.main === module) {
    main();
}

module.exports = { loadEnvFile, injectEnvIntoHTML };

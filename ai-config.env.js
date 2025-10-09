// AI Configuration File with Environment Variables
// This file loads configuration from environment variables

// Environment configuration loader
function loadAIEnvironmentConfig() {
    // Check if we're in a Vite environment
    if (typeof import.meta !== 'undefined' && import.meta.env) {
        return {
            OPENAI_API_KEY: import.meta.env.VITE_OPENAI_API_KEY || 'your-openai-api-key-here',
            OPENAI_API_URL: import.meta.env.VITE_OPENAI_API_URL || 'https://api.openai.com/v1/chat/completions',
            ANTHROPIC_API_KEY: import.meta.env.VITE_ANTHROPIC_API_KEY || 'your-anthropic-api-key-here',
            ANTHROPIC_API_URL: import.meta.env.VITE_ANTHROPIC_API_URL || 'https://api.anthropic.com/v1/messages',
            USE_AI_SERVICE: import.meta.env.VITE_USE_AI_SERVICE || 'mock',
            MAX_CONTENT_LENGTH: parseInt(import.meta.env.VITE_MAX_CONTENT_LENGTH) || 4000,
            ANALYSIS_TIMEOUT: parseInt(import.meta.env.VITE_ANALYSIS_TIMEOUT) || 30000,
            DEV_MODE: import.meta.env.VITE_DEV_MODE === 'true',
            DEBUG_MODE: import.meta.env.VITE_DEBUG_MODE === 'true'
        };
    }
    
    // Fallback for non-Vite environments
    return {
        OPENAI_API_KEY: 'your-openai-api-key-here',
        OPENAI_API_URL: 'https://api.openai.com/v1/chat/completions',
        ANTHROPIC_API_KEY: 'your-anthropic-api-key-here',
        ANTHROPIC_API_URL: 'https://api.anthropic.com/v1/messages',
        USE_AI_SERVICE: 'mock',
        MAX_CONTENT_LENGTH: 4000,
        ANALYSIS_TIMEOUT: 30000,
        DEV_MODE: false,
        DEBUG_MODE: false
    };
}

// Load configuration
const envConfig = loadAIEnvironmentConfig();

// Validate API keys
function validateAPIKeys(config) {
    const warnings = [];
    
    if (config.USE_AI_SERVICE === 'openai' && config.OPENAI_API_KEY === 'your-openai-api-key-here') {
        warnings.push('OpenAI API key not configured');
    }
    
    if (config.USE_AI_SERVICE === 'anthropic' && config.ANTHROPIC_API_KEY === 'your-anthropic-api-key-here') {
        warnings.push('Anthropic API key not configured');
    }
    
    if (warnings.length > 0) {
        console.warn('AI Configuration Warnings:', warnings);
        if (config.DEBUG_MODE) {
            console.warn('Consider setting up API keys or using mock mode for testing');
        }
    }
}

validateAPIKeys(envConfig);

// Export AI configuration
export const AI_CONFIG = {
    // OpenAI Configuration
    OPENAI_API_KEY: envConfig.OPENAI_API_KEY,
    OPENAI_API_URL: envConfig.OPENAI_API_URL,
    
    // Anthropic Claude Configuration
    ANTHROPIC_API_KEY: envConfig.ANTHROPIC_API_KEY,
    ANTHROPIC_API_URL: envConfig.ANTHROPIC_API_URL,
    
    // Which AI service to use: 'openai', 'anthropic', or 'mock' for testing
    USE_AI_SERVICE: envConfig.USE_AI_SERVICE,
    
    // Analysis settings
    MAX_CONTENT_LENGTH: envConfig.MAX_CONTENT_LENGTH,
    ANALYSIS_TIMEOUT: envConfig.ANALYSIS_TIMEOUT,
    
    // Development settings
    DEV_MODE: envConfig.DEV_MODE,
    DEBUG_MODE: envConfig.DEBUG_MODE
};

// Instructions for getting API keys:
/*
1. OpenAI API Key:
   - Go to https://platform.openai.com/api-keys
   - Sign up or log in
   - Create a new API key
   - Set VITE_OPENAI_API_KEY in your .env file
   - Set VITE_USE_AI_SERVICE to 'openai'

2. Anthropic Claude API Key:
   - Go to https://console.anthropic.com/
   - Sign up or log in
   - Create a new API key
   - Set VITE_ANTHROPIC_API_KEY in your .env file
   - Set VITE_USE_AI_SERVICE to 'anthropic'

3. For testing without API keys:
   - Keep VITE_USE_AI_SERVICE as 'mock'
   - The system will use simulated analysis results

4. Environment Variables:
   - Copy env.example to .env
   - Fill in your actual API keys and configuration
   - Never commit .env files to version control
*/

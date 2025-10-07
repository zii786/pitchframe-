// AI Configuration File
// Replace the placeholder values with your actual API keys

export const AI_CONFIG = {
    // OpenAI Configuration
    OPENAI_API_KEY: 'your-openai-api-key-here', // Get from https://platform.openai.com/api-keys
    OPENAI_API_URL: 'https://api.openai.com/v1/chat/completions',
    
    // Anthropic Claude Configuration
    ANTHROPIC_API_KEY: 'your-anthropic-api-key-here', // Get from https://console.anthropic.com/
    ANTHROPIC_API_URL: 'https://api.anthropic.com/v1/messages',
    
    // Which AI service to use: 'openai', 'anthropic', or 'mock' for testing
    USE_AI_SERVICE: 'mock', // Change to 'openai' or 'anthropic' when you have API keys
    
    // Analysis settings
    MAX_CONTENT_LENGTH: 4000, // Maximum characters to send to AI for analysis
    ANALYSIS_TIMEOUT: 30000, // 30 seconds timeout for AI analysis
};

// Instructions for getting API keys:
/*
1. OpenAI API Key:
   - Go to https://platform.openai.com/api-keys
   - Sign up or log in
   - Create a new API key
   - Copy the key and replace 'your-openai-api-key-here' above
   - Set USE_AI_SERVICE to 'openai'

2. Anthropic Claude API Key:
   - Go to https://console.anthropic.com/
   - Sign up or log in
   - Create a new API key
   - Copy the key and replace 'your-anthropic-api-key-here' above
   - Set USE_AI_SERVICE to 'anthropic'

3. For testing without API keys:
   - Keep USE_AI_SERVICE as 'mock'
   - The system will use simulated analysis results
*/

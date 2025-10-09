// Environment Variables Utility
// This file provides environment variable loading for non-Vite environments

// Simple environment variable loader for vanilla JavaScript
class EnvironmentLoader {
    constructor() {
        this.env = {};
        this.loadEnvironmentVariables();
    }

    loadEnvironmentVariables() {
        // Try to load from window.env if available (set by build process)
        if (typeof window !== 'undefined' && window.env) {
            this.env = { ...window.env };
            return;
        }

        // Try to load from process.env if available (Node.js environment)
        if (typeof process !== 'undefined' && process.env) {
            this.env = { ...process.env };
            return;
        }

        // Fallback: try to load from a script tag with environment variables
        this.loadFromScriptTag();
    }

    loadFromScriptTag() {
        const envScript = document.querySelector('script[type="application/json"][data-env]');
        if (envScript) {
            try {
                this.env = JSON.parse(envScript.textContent);
            } catch (error) {
                console.warn('Failed to parse environment variables from script tag:', error);
            }
        }
    }

    get(key, defaultValue = null) {
        return this.env[key] || defaultValue;
    }

    getBoolean(key, defaultValue = false) {
        const value = this.get(key, defaultValue.toString());
        return value === 'true' || value === true;
    }

    getNumber(key, defaultValue = 0) {
        const value = this.get(key, defaultValue.toString());
        const parsed = parseFloat(value);
        return isNaN(parsed) ? defaultValue : parsed;
    }

    getAll() {
        return { ...this.env };
    }

    // Check if we're in development mode
    isDevelopment() {
        return this.getBoolean('VITE_DEV_MODE') || 
               this.getBoolean('NODE_ENV') === 'development' ||
               window.location.hostname === 'localhost' ||
               window.location.hostname === '127.0.0.1';
    }

    // Check if we're in production mode
    isProduction() {
        return this.getBoolean('NODE_ENV') === 'production' ||
               !this.isDevelopment();
    }

    // Get Firebase configuration
    getFirebaseConfig() {
        return {
            apiKey: this.get('VITE_FIREBASE_API_KEY'),
            authDomain: this.get('VITE_FIREBASE_AUTH_DOMAIN'),
            projectId: this.get('VITE_FIREBASE_PROJECT_ID'),
            storageBucket: this.get('VITE_FIREBASE_STORAGE_BUCKET'),
            messagingSenderId: this.get('VITE_FIREBASE_MESSAGING_SENDER_ID'),
            appId: this.get('VITE_FIREBASE_APP_ID')
        };
    }

    // Get AI configuration
    getAIConfig() {
        return {
            OPENAI_API_KEY: this.get('VITE_OPENAI_API_KEY'),
            OPENAI_API_URL: this.get('VITE_OPENAI_API_URL', 'https://api.openai.com/v1/chat/completions'),
            ANTHROPIC_API_KEY: this.get('VITE_ANTHROPIC_API_KEY'),
            ANTHROPIC_API_URL: this.get('VITE_ANTHROPIC_API_URL', 'https://api.anthropic.com/v1/messages'),
            USE_AI_SERVICE: this.get('VITE_USE_AI_SERVICE', 'mock'),
            MAX_CONTENT_LENGTH: this.getNumber('VITE_MAX_CONTENT_LENGTH', 4000),
            ANALYSIS_TIMEOUT: this.getNumber('VITE_ANALYSIS_TIMEOUT', 30000),
            DEV_MODE: this.getBoolean('VITE_DEV_MODE', false),
            DEBUG_MODE: this.getBoolean('VITE_DEBUG_MODE', false)
        };
    }

    // Get contact information
    getContactConfig() {
        return {
            CONTACT_EMAIL: this.get('VITE_CONTACT_EMAIL', 'hello@pitchframe.com'),
            SUPPORT_EMAIL: this.get('VITE_SUPPORT_EMAIL', 'support@pitchframe.com'),
            LEGAL_EMAIL: this.get('VITE_LEGAL_EMAIL', 'legal@pitchframe.com'),
            CAREERS_EMAIL: this.get('VITE_CAREERS_EMAIL', 'careers@pitchframe.com'),
            CONTACT_PHONE: this.get('VITE_CONTACT_PHONE', '+1 (555) 012-3456'),
            COMPANY_ADDRESS: this.get('VITE_COMPANY_ADDRESS', '123 Innovation Drive, San Francisco, CA 94105')
        };
    }

    // Get social media links
    getSocialConfig() {
        return {
            TWITTER_URL: this.get('VITE_TWITTER_URL', 'https://twitter.com/pitchframe'),
            LINKEDIN_URL: this.get('VITE_LINKEDIN_URL', 'https://linkedin.com/company/pitchframe'),
            FACEBOOK_URL: this.get('VITE_FACEBOOK_URL', 'https://facebook.com/pitchframe'),
            INSTAGRAM_URL: this.get('VITE_INSTAGRAM_URL', 'https://instagram.com/pitchframe')
        };
    }

    // Get feature flags
    getFeatureFlags() {
        return {
            ENABLE_CHATBOT: this.getBoolean('VITE_ENABLE_CHATBOT', true),
            ENABLE_DARK_MODE: this.getBoolean('VITE_ENABLE_DARK_MODE', true),
            ENABLE_ANALYTICS: this.getBoolean('VITE_ENABLE_ANALYTICS', false),
            ENABLE_ERROR_TRACKING: this.getBoolean('VITE_ENABLE_ERROR_TRACKING', false)
        };
    }
}

// Create global instance
const envLoader = new EnvironmentLoader();

// Export for use in other modules
export default envLoader;

// Also make available globally for non-module scripts
if (typeof window !== 'undefined') {
    window.envLoader = envLoader;
}

// Utility functions for easy access
export const getEnv = (key, defaultValue = null) => envLoader.get(key, defaultValue);
export const getEnvBoolean = (key, defaultValue = false) => envLoader.getBoolean(key, defaultValue);
export const getEnvNumber = (key, defaultValue = 0) => envLoader.getNumber(key, defaultValue);
export const isDevelopment = () => envLoader.isDevelopment();
export const isProduction = () => envLoader.isProduction();
export const getFirebaseConfig = () => envLoader.getFirebaseConfig();
export const getAIConfig = () => envLoader.getAIConfig();
export const getContactConfig = () => envLoader.getContactConfig();
export const getSocialConfig = () => envLoader.getSocialConfig();
export const getFeatureFlags = () => envLoader.getFeatureFlags();

# Environment Variables Setup Guide

This guide explains how to set up environment variables for the PitchFrame application to keep sensitive data secure.

## 🔐 Security Overview

Environment variables are used to store sensitive configuration data like API keys, database credentials, and service URLs. This prevents accidental exposure of secrets in your codebase.

## 📁 Files Overview

- `.env` - Your actual environment variables (DO NOT COMMIT)
- `env.example` - Template file with placeholder values
- `.gitignore` - Prevents `.env` files from being committed
- `env-loader.js` - Loads environment variables in the browser
- `inject-env.js` - Script to inject env vars into HTML files
- `firebase-config.js` - Updated to use environment variables
- `ai-config.js` - Updated to use environment variables

## 🚀 Quick Setup

### 1. Copy the Example File
```bash
cp env.example .env
```

### 2. Fill in Your Values
Edit `.env` with your actual values:
```bash
# Firebase Configuration
VITE_FIREBASE_API_KEY=your-actual-firebase-api-key
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
# ... etc
```

### 3. Inject Environment Variables (for non-Vite environments)
```bash
npm run inject-env
```

## 🔧 Detailed Configuration

### Firebase Configuration

Get your Firebase config from the Firebase Console:

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Go to Project Settings > General
4. Scroll down to "Your apps" section
5. Copy the config values

```env
VITE_FIREBASE_API_KEY=AIzaSy...
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123456789:web:abcdef...
```

### AI Service Configuration

#### OpenAI Setup
1. Go to [OpenAI API Keys](https://platform.openai.com/api-keys)
2. Create a new API key
3. Add to your `.env`:

```env
VITE_OPENAI_API_KEY=sk-...
VITE_USE_AI_SERVICE=openai
```

#### Anthropic Setup
1. Go to [Anthropic Console](https://console.anthropic.com/)
2. Create a new API key
3. Add to your `.env`:

```env
VITE_ANTHROPIC_API_KEY=sk-ant-...
VITE_USE_AI_SERVICE=anthropic
```

#### Mock Mode (for testing)
```env
VITE_USE_AI_SERVICE=mock
```

### Contact Information

Update contact details in your `.env`:

```env
VITE_CONTACT_EMAIL=hello@yourcompany.com
VITE_SUPPORT_EMAIL=support@yourcompany.com
VITE_CONTACT_PHONE=+1 (555) 123-4567
VITE_COMPANY_ADDRESS=Your Company Address
```

### Social Media Links

```env
VITE_TWITTER_URL=https://twitter.com/yourcompany
VITE_LINKEDIN_URL=https://linkedin.com/company/yourcompany
VITE_FACEBOOK_URL=https://facebook.com/yourcompany
VITE_INSTAGRAM_URL=https://instagram.com/yourcompany
```

### Feature Flags

Control which features are enabled:

```env
VITE_ENABLE_CHATBOT=true
VITE_ENABLE_DARK_MODE=true
VITE_ENABLE_ANALYTICS=false
VITE_ENABLE_ERROR_TRACKING=false
```

## 🛠️ Development Workflow

### Local Development
1. Copy `env.example` to `.env`
2. Fill in your development values
3. Run the injection script: `npm run inject-env`
4. Start the development server: `npm run dev`

### Production Deployment
1. Set up production environment variables in your hosting platform
2. Run the injection script: `npm run inject-env`
3. Deploy: `npm run deploy`

## 🔒 Security Best Practices

### ✅ Do:
- Use environment variables for all sensitive data
- Keep `.env` files out of version control
- Use different values for development and production
- Regularly rotate API keys
- Use least-privilege access for API keys

### ❌ Don't:
- Commit `.env` files to git
- Hardcode secrets in your code
- Share API keys in chat or email
- Use production keys in development
- Store secrets in client-side code

## 🐛 Troubleshooting

### Environment Variables Not Loading

1. **Check file location**: Ensure `.env` is in the project root
2. **Check syntax**: No spaces around `=` signs
3. **Check quotes**: Remove quotes around values unless needed
4. **Run injection script**: `npm run inject-env`

### Firebase Connection Issues

1. **Verify config**: Check all Firebase config values
2. **Check project ID**: Ensure it matches your Firebase project
3. **Check API key**: Verify the API key is correct
4. **Check permissions**: Ensure API key has required permissions

### AI Service Issues

1. **Check API key**: Verify the API key is valid
2. **Check service setting**: Ensure `VITE_USE_AI_SERVICE` is set correctly
3. **Check quotas**: Verify you haven't exceeded API limits
4. **Check network**: Ensure you can reach the API endpoints

## 📝 Environment Variable Reference

### Required Variables
- `VITE_FIREBASE_API_KEY`
- `VITE_FIREBASE_AUTH_DOMAIN`
- `VITE_FIREBASE_PROJECT_ID`
- `VITE_FIREBASE_STORAGE_BUCKET`
- `VITE_FIREBASE_MESSAGING_SENDER_ID`
- `VITE_FIREBASE_APP_ID`

### Optional Variables
- `VITE_OPENAI_API_KEY` (if using OpenAI)
- `VITE_ANTHROPIC_API_KEY` (if using Anthropic)
- `VITE_USE_AI_SERVICE` (default: 'mock')
- `VITE_CONTACT_EMAIL` (default: 'hello@pitchframe.com')
- `VITE_ENABLE_CHATBOT` (default: 'true')
- `VITE_ENABLE_DARK_MODE` (default: 'true')

### Development Variables
- `VITE_DEV_MODE` (default: 'false')
- `VITE_DEBUG_MODE` (default: 'false')
- `VITE_FIREBASE_AUTH_EMULATOR_HOST` (for local emulator)
- `VITE_FIREBASE_FIRESTORE_EMULATOR_HOST` (for local emulator)

## 🔄 Migration from Hardcoded Values

If you're migrating from hardcoded values:

1. **Identify hardcoded secrets** in your codebase
2. **Create environment variables** for each secret
3. **Update configuration files** to use environment variables
4. **Test thoroughly** to ensure everything works
5. **Remove hardcoded values** from your code

## 📞 Support

If you encounter issues with environment variable setup:

1. Check this guide first
2. Review the troubleshooting section
3. Check the console for error messages
4. Contact support with specific error details

---

**Remember**: Never commit your `.env` file to version control!

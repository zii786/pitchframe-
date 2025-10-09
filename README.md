# PitchFrame - AI-Powered Startup Pitch Analysis Platform

![PitchFrame Logo](pics/header.webp)

PitchFrame is a comprehensive platform that empowers startups with AI-powered pitch analysis and expert mentorship to accelerate their growth journey. Our platform combines cutting-edge artificial intelligence with human expertise to provide actionable feedback on pitch decks and connect entrepreneurs with industry mentors.

## 🚀 Features

### For Startups
- **AI Pitch Analysis**: Get instant, comprehensive feedback on your pitch deck quality, clarity, market fit, and more
- **Mentor Matching**: Connect with industry experts who can provide personalized guidance
- **Pitch Submission**: Upload your pitch deck and track your analysis progress
- **Progress Tracking**: Monitor your pitch improvement over time with detailed analytics

### For Mentors
- **Mentor Dashboard**: Manage your mentorship activities and provide feedback to startups
- **Smart Matching**: Get matched with startups that align with your expertise and interests
- **Feedback Tools**: Provide structured, actionable feedback to help startups improve
- **Community**: Join a network of experienced professionals helping the next generation of entrepreneurs

### Platform Features
- **Secure File Handling**: Robust security for pitch deck uploads and analysis
- **Real-time Updates**: Live status updates during analysis and feedback processes
- **Responsive Design**: Optimized for desktop, tablet, and mobile devices
- **Accessibility**: Built with accessibility standards in mind

## 🛠️ Technology Stack

### Frontend
- **HTML5/CSS3**: Modern, semantic markup with responsive design
- **Bootstrap 5**: Component library for consistent UI/UX
- **JavaScript (ES6+)**: Modern JavaScript with async/await patterns
- **Font Awesome**: Icon library for enhanced visual elements

### Backend & Services
- **Firebase Authentication**: Secure user authentication and authorization
- **Firebase Firestore**: NoSQL database for real-time data storage
- **Firebase Storage**: Secure file storage for pitch decks and documents
- **Firebase Cloud Functions**: Serverless functions for AI analysis and PDF processing
- **Firebase Hosting**: Fast, secure web hosting

### AI & Analysis
- **OpenAI API**: GPT models for intelligent pitch analysis
- **Anthropic API**: Claude models for enhanced analysis capabilities
- **PDF.js**: Client-side PDF text extraction
- **pdf-parse**: Server-side PDF processing

### Development Tools
- **Firebase CLI**: Development and deployment tools
- **Git**: Version control
- **ESLint**: Code quality and consistency

## 📁 Project Structure

```
PitchFrame/
├── index.html                 # Homepage
├── about.html                 # About us page
├── contact.html               # Contact page
├── career.html                # Careers page
├── login.html                 # User login
├── register.html              # User registration
├── pitch-submission.html      # Pitch submission form
├── AI_analyzer.html          # AI analysis interface
├── mentor-dashboard.html      # Mentor dashboard
├── mentor-matching.html       # Mentor matching interface
├── mentor-notification.html   # Mentor notifications
├── history.html              # User pitch history
├── settings.html             # User settings
├── pitch-details.html        # Pitch details view
├── investor-dashboard.html   # Investor dashboard
├── blog.html                 # Blog page
├── 404.html                  # Error page
├── styles.css                # Main stylesheet
├── dark-mode.css             # Dark mode styles
├── dark-mode.js              # Dark mode functionality
├── scripts.js                # Main JavaScript file
├── navigation.js             # Navigation functionality
├── auth-guard.js             # Authentication guard
├── firebase-config.js        # Firebase configuration
├── ai-service.js             # AI analysis service
├── ai-config.js              # AI configuration
├── chatbot.js                # Chatbot functionality
├── history.js                # History page functionality
├── settings.js               # Settings functionality
├── investor-dashboard.js     # Investor dashboard logic
├── mentor-dashboard.js       # Mentor dashboard logic
├── check-data.js             # Data validation
├── migrate-data.js           # Data migration utilities
├── functions/                # Firebase Cloud Functions
│   ├── index.js              # Cloud Functions entry point
│   └── package.json          # Functions dependencies
├── dataconnect/              # Firebase Data Connect
│   ├── dataconnect.yaml      # Data Connect configuration
│   ├── connector/            # Connector definitions
│   └── schema/               # Database schema
├── pics/                     # Images and assets
├── firebase.json             # Firebase configuration
├── firestore.rules           # Firestore security rules
├── firestore.indexes.json    # Firestore indexes
├── storage.rules             # Storage security rules
├── sitemap.xml               # SEO sitemap
├── robots.txt                # Search engine directives
├── site.webmanifest          # PWA manifest
├── privacy-policy.html       # Privacy policy
├── terms-of-service.html     # Terms of service
└── README.md                 # This file
```

## 🚀 Getting Started

### Prerequisites
- Node.js (v18 or higher)
- Firebase CLI
- Git

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/zii786/pitchframe-.git
   cd pitchframe-
   ```

2. **Install Firebase CLI**
   ```bash
   npm install -g firebase-tools
   ```

3. **Login to Firebase**
   ```bash
   firebase login
   ```

4. **Install dependencies**
   ```bash
   cd functions
   npm install
   cd ..
   ```

5. **Configure Firebase**
   - Create a new Firebase project at [Firebase Console](https://console.firebase.google.com/)
   - Enable Authentication, Firestore, Storage, and Cloud Functions
   - Update `firebase-config.js` with your project configuration

6. **Deploy to Firebase**
   ```bash
   firebase deploy
   ```

### Local Development

1. **Start Firebase emulators**
   ```bash
   firebase emulators:start
   ```

2. **Serve the application**
   ```bash
   firebase serve
   ```

3. **Access the application**
   - Web app: http://localhost:5000
   - Emulator UI: http://localhost:4000

## 🔧 Configuration

### Environment Variables Setup

PitchFrame uses environment variables to keep sensitive data secure. Follow these steps:

1. **Copy the example file**:
   ```bash
   cp env.example .env
   ```

2. **Fill in your values** in `.env`:
   ```env
   # Firebase Configuration
   VITE_FIREBASE_API_KEY=your-firebase-api-key
   VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
   VITE_FIREBASE_PROJECT_ID=your-project-id
   # ... etc
   ```

3. **Inject environment variables** (for non-Vite environments):
   ```bash
   npm run inject-env
   ```

See [ENVIRONMENT_SETUP.md](ENVIRONMENT_SETUP.md) for detailed instructions.

### Firebase Configuration
The Firebase configuration is now loaded from environment variables. Update your `.env` file:

```env
VITE_FIREBASE_API_KEY=your-api-key
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
VITE_FIREBASE_APP_ID=your-app-id
```

### AI Service Configuration
Configure AI services in your `.env` file:

```env
# OpenAI
VITE_OPENAI_API_KEY=your-openai-key
VITE_USE_AI_SERVICE=openai

# Anthropic
VITE_ANTHROPIC_API_KEY=your-anthropic-key
VITE_USE_AI_SERVICE=anthropic

# Mock mode for testing
VITE_USE_AI_SERVICE=mock
```

## 🔒 Security

### Environment Variables
- All sensitive data stored in environment variables
- `.env` files excluded from version control
- Different configurations for development and production
- Secure API key management

### Authentication
- Email verification required for all accounts
- Secure password policies
- Role-based access control (founder, mentor, investor)

### Data Protection
- All data encrypted in transit and at rest
- Secure file upload with type and size validation
- Comprehensive Firestore and Storage security rules

### Privacy
- GDPR compliant data handling
- User data deletion capabilities
- Transparent privacy policy

## 📊 Database Schema

### Collections

#### Users
```javascript
{
  uid: string,
  email: string,
  firstName: string,
  lastName: string,
  userType: 'founder' | 'mentor' | 'investor',
  createdAt: timestamp,
  lastLogin: timestamp
}
```

#### Pitches
```javascript
{
  pitchId: string,
  userId: string,
  fileName: string,
  fileUrl: string,
  status: 'draft' | 'submitted' | 'analyzing' | 'analyzed' | 'completed' | 'error',
  analysis: object,
  createdAt: timestamp,
  updatedAt: timestamp
}
```

#### Mentors
```javascript
{
  userId: string,
  firstName: string,
  lastName: string,
  email: string,
  domain: string,
  availability: boolean,
  yearsOfExperience: number,
  rating: number,
  totalReviews: number,
  lastActive: timestamp
}
```

## 🚀 Deployment

### Production Deployment
```bash
firebase deploy --project your-production-project
```

### Staging Deployment
```bash
firebase deploy --project your-staging-project
```

### Environment Variables
Set up environment variables for Cloud Functions:
```bash
firebase functions:config:set openai.api_key="your-key"
firebase functions:config:set anthropic.api_key="your-key"
```

## 🧪 Testing

### Manual Testing
- Test all user flows (registration, login, pitch submission, analysis)
- Verify mentor matching functionality
- Test file upload and analysis processes
- Validate security rules and access controls

### Automated Testing
```bash
cd functions
npm test
```

## 📈 Performance Optimization

### Frontend
- Lazy loading for images and components
- Minified CSS and JavaScript
- CDN delivery for static assets
- Progressive Web App (PWA) capabilities

### Backend
- Firestore indexes for efficient queries
- Cloud Functions for serverless processing
- Firebase Storage for optimized file handling
- Caching strategies for frequently accessed data

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines
- Follow the existing code style
- Write meaningful commit messages
- Add tests for new features
- Update documentation as needed

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

- **Documentation**: Check this README and inline code comments
- **Issues**: Report bugs and request features via GitHub Issues
- **Contact**: Reach out to us at support@pitchframe.com

## 🙏 Acknowledgments

- Firebase team for the excellent platform
- OpenAI and Anthropic for AI capabilities
- Bootstrap team for the UI framework
- All contributors and users who help improve PitchFrame

## 📞 Contact

- **Website**: https://pitchframe.com
- **Email**: hello@pitchframe.com
- **Twitter**: @PitchFrame
- **LinkedIn**: PitchFrame

---

Made with ❤️ for entrepreneurs worldwide.

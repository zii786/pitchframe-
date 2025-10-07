import { db } from './firebase-config.js';
import { collection, addDoc, query, orderBy, limit, onSnapshot } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';

document.addEventListener('DOMContentLoaded', () => {
    // DOM elements
    const chatbotToggle = document.getElementById('chatbotToggle');
    const chatbotContainer = document.getElementById('chatbotContainer');
    const closeChatbot = document.getElementById('closeChatbot');
    const chatbotMessages = document.getElementById('chatbotMessages');
    const userInput = document.getElementById('userInput');
    const sendMessage = document.getElementById('sendMessage');

    // Check if chatbot elements exist on the page before proceeding
    if (!chatbotToggle || !chatbotContainer) {
        return;
    }

    // Chatbot responses
    const responses = {
        'hello': 'Hello! How can I help you with your pitch today? Here are a few common topics:',
        'help': 'I can help with pitch creation, feedback, investment advice, and mentor connections. What would you like to know more about?',
        'pitch': 'A great pitch starts with a clear problem, a compelling solution, and a strong team. For more details, you can check out our blog or use our AI tools.',
        'pitch_tips': 'To create a great pitch:\n1. Start with a clear problem statement\n2. Present your compelling solution\n3. Show market potential and traction\n4. Explain your business model clearly\n5. Introduce your amazing team!',
        'feedback': 'Our AI Pitch Analyzer provides instant, detailed feedback. You can also connect with our expert mentors for personalized guidance. Which would you prefer?',
        'investor': 'To attract investors, focus on showing clear market potential, demonstrating traction, and presenting a strong financial plan. Our mentors can help you refine this.',
        'mentor': 'We can match you with mentors based on your industry and startup stage. Would you like to start the matching process?',
        'analyze': 'Great! You can upload your pitch deck for instant analysis on our AI Analyzer page. <a href="AI_analyzer.html">Click here to get started.</a>',
        'default': 'I\'m not sure I understand. Could you please rephrase your question? I can help with pitch creation, feedback, investor relations, or mentor connections.'
    };

    // Toggle chatbot visibility
    chatbotToggle.addEventListener('click', () => {
        chatbotContainer.classList.remove('hidden');
        chatbotToggle.classList.add('hidden');
    });

    closeChatbot.addEventListener('click', () => {
        chatbotContainer.classList.add('hidden');
        chatbotToggle.classList.remove('hidden');
    });

    // Send message function
    async function sendMessageToChat(message) {
        // Remove any existing suggestion buttons
        clearSuggestions();
        // Add user message to chat
        addMessage(message, 'user');
        
        // Get bot response
        const botMessage = getBotResponse(message);
        
        // Save conversation to Firestore
        try {
            // We only save the user message, the response is deterministic
            // Or we can save both if we want to log what the bot said
            await addDoc(collection(db, 'chatbot_conversations'), {
                userMessage: message,
                botResponse: botMessage, // Save the returned bot message
                timestamp: new Date()
            });
        } catch (error) {
            console.error('Error saving conversation:', error);
        }
    }

    // Get bot response
    function getBotResponse(message) {
        const lowerMessage = message.toLowerCase();
        
        let responseText;

        if (lowerMessage.includes('hello') || lowerMessage.includes('hi') || lowerMessage.includes('help')) {
            responseText = responses.hello;
            addMessage(responseText, 'bot', true);
            addSuggestionButtons(['Analyze my Pitch', 'Find a Mentor', 'Pitching Tips']);
        } else if (lowerMessage.includes('analyze') || lowerMessage.includes('analysis')) {
            responseText = responses.analyze;
            addMessage(responseText, 'bot', true); // Allow HTML
            addSuggestionButtons(['Find a Mentor', 'Pitching Tips']);
        } else if (lowerMessage.includes('pitching tips') || lowerMessage.includes('pitch tips')) {
            responseText = responses.pitch_tips;
            addMessage(responseText, 'bot');
            addSuggestionButtons(['Analyze my Pitch', 'Find a Mentor']);
        } else if (lowerMessage.includes('pitch')) {
            responseText = responses.pitch;
            addMessage(responseText, 'bot');
            addSuggestionButtons(['Submit for Analysis', 'Read Blog']);
        } else if (lowerMessage.includes('feedback')) {
            responseText = responses.feedback;
            addMessage(responseText, 'bot', true);
            addSuggestionButtons(['AI Analyzer', 'Connect with Mentors']);
        } else if (lowerMessage.includes('investor')) {
            responseText = responses.investor;
            addMessage(responseText, 'bot');
        } else if (lowerMessage.includes('mentor') || lowerMessage.includes('matching')) {
            responseText = responses.mentor;
            addMessage(responseText, 'bot', true);
            addSuggestionButtons(['Start Matching']);
        } else {
            responseText = responses.default;
            addMessage(responseText, 'bot', true);
        }
        return responseText;
    }

    // Add message to chat
    function addMessage(message, sender, allowHTML = false) {
        const messageDiv = document.createElement('div');
        messageDiv.classList.add('message');
        messageDiv.classList.add(sender === 'user' ? 'user-message' : 'bot-message');
        if (allowHTML) {
            messageDiv.innerHTML = message;
        } else {
            messageDiv.textContent = message;
        }
        chatbotMessages.appendChild(messageDiv);
        chatbotMessages.scrollTop = chatbotMessages.scrollHeight;
    }
    // Add suggestion buttons to the chat
    function addSuggestionButtons(suggestions) {
        const suggestionsDiv = document.createElement('div');
        suggestionsDiv.classList.add('suggestions');
        
        suggestions.forEach(text => {
            const button = document.createElement('button');
            button.textContent = text;
            button.classList.add('suggestion-btn');
            button.addEventListener('click', () => {
                sendMessageToChat(text);
            });
            suggestionsDiv.appendChild(button);
        });
        
        chatbotMessages.appendChild(suggestionsDiv);
        chatbotMessages.scrollTop = chatbotMessages.scrollHeight;
    }

    // Clear suggestion buttons
    function clearSuggestions() {
        const suggestions = chatbotMessages.querySelector('.suggestions');
        if (suggestions) {
            suggestions.remove();
        }
    }

    // Event listeners
    sendMessage.addEventListener('click', () => {
        const message = userInput.value.trim();
        if (message) {
            sendMessageToChat(message);
            userInput.value = '';
        }
    });

    userInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            const message = userInput.value.trim();
            if (message) {
                sendMessageToChat(message);
                userInput.value = '';
            }
        }
    });

    function loadInitialChat() {
        // Load previous conversations (optional, can be noisy)
        // const q = query(collection(db, 'chatbot_conversations'), orderBy('timestamp', 'desc'), limit(10));
        // onSnapshot(q, (snapshot) => {
        //     // To prevent duplicates, we'd need a more robust way to handle this
        //     // For now, let's keep it simple and not load history to avoid confusion.
        // });

        // Clear any old messages and add initial greeting and suggestions
        chatbotMessages.innerHTML = `
            <div class="message bot-message">
                Hello! I'm your PitchFrame assistant. How can I help you today?
            </div>
        `;
        addSuggestionButtons(['Help', 'Tell me about PitchFrame']);
    }

    loadInitialChat();
});
import { getFirestore, collection, addDoc, query, orderBy, limit, onSnapshot } from 'https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore.js';
import { getApp } from 'https://www.gstatic.com/firebasejs/9.22.0/firebase-app.js';

// Get the existing Firebase app instance instead of initializing a new one
const app = getApp();
const db = getFirestore(app);

// DOM elements
const chatbotToggle = document.getElementById('chatbotToggle');
const chatbotContainer = document.getElementById('chatbotContainer');
const closeChatbot = document.getElementById('closeChatbot');
const chatbotMessages = document.getElementById('chatbotMessages');
const userInput = document.getElementById('userInput');
const sendMessage = document.getElementById('sendMessage');

// Chatbot responses
const responses = {
    'hello': 'Hello! How can I help you with your pitch today?',
    'help': 'I can help you with:\n- Pitch deck creation\n- Feedback on your pitch\n- Investment advice\n- Mentor connections\nWhat would you like to know more about?',
    'pitch': 'To create a great pitch:\n1. Start with a clear problem statement\n2. Present your solution\n3. Show market potential\n4. Explain your business model\n5. Introduce your team\nWould you like more details on any of these?',
    'feedback': 'I can help you get feedback on your pitch. Please share your pitch deck or key points, and I\'ll provide constructive feedback.',
    'investor': 'To attract investors:\n1. Show clear market potential\n2. Demonstrate traction\n3. Present a strong team\n4. Have a clear financial plan\nWould you like to discuss any of these aspects?',
    'mentor': 'I can help you connect with mentors. Please tell me what specific guidance you\'re looking for.',
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
    // Add user message to chat
    addMessage(message, 'user');
    
    // Get bot response
    const response = getBotResponse(message);
    
    // Add bot response to chat
    addMessage(response, 'bot');
    
    // Save conversation to Firestore
    try {
        await addDoc(collection(db, 'chatbot_conversations'), {
            userMessage: message,
            botResponse: response,
            timestamp: new Date()
        });
    } catch (error) {
        console.error('Error saving conversation:', error);
    }
}

// Get bot response
function getBotResponse(message) {
    const lowerMessage = message.toLowerCase();
    
    if (lowerMessage.includes('hello') || lowerMessage.includes('hi')) {
        return responses.hello;
    } else if (lowerMessage.includes('help')) {
        return responses.help;
    } else if (lowerMessage.includes('pitch')) {
        return responses.pitch;
    } else if (lowerMessage.includes('feedback')) {
        return responses.feedback;
    } else if (lowerMessage.includes('investor')) {
        return responses.investor;
    } else if (lowerMessage.includes('mentor')) {
        return responses.mentor;
    } else {
        return responses.default;
    }
}

// Add message to chat
function addMessage(message, sender) {
    const messageDiv = document.createElement('div');
    messageDiv.classList.add('message');
    messageDiv.classList.add(sender === 'user' ? 'user-message' : 'bot-message');
    messageDiv.textContent = message;
    chatbotMessages.appendChild(messageDiv);
    chatbotMessages.scrollTop = chatbotMessages.scrollHeight;
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

// Load previous conversations
const q = query(collection(db, 'chatbot_conversations'), orderBy('timestamp', 'desc'), limit(10));
onSnapshot(q, (snapshot) => {
    snapshot.docChanges().forEach((change) => {
        if (change.type === 'added') {
            const data = change.doc.data();
            addMessage(data.userMessage, 'user');
            addMessage(data.botResponse, 'bot');
        }
    });
}); 
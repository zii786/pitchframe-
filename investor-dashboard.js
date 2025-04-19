import { auth, db, onAuthStateChanged, signOut } from './firebase-config.js';
import { collection, query, where, getDocs, doc, getDoc, addDoc, updateDoc, onSnapshot } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore.js";

// Authentication Check
onAuthStateChanged(auth, (user) => {
    if (!user) {
        window.location.href = 'login.html';
    } else {
        loadUserData(user);
        loadStartups();
    }
});

// Load User Data
async function loadUserData(user) {
    const userDoc = await getDoc(doc(db, 'users', user.uid));
    if (userDoc.exists()) {
        const userData = userDoc.data();
        // Update UI with user data if needed
    }
}

// Load Startups
async function loadStartups(filters = {}) {
    const startupsRef = collection(db, 'startups');
    let q = query(startupsRef);
    
    if (filters.industry && filters.industry !== 'all') {
        q = query(q, where('industry', '==', filters.industry));
    }
    if (filters.stage && filters.stage !== 'all') {
        q = query(q, where('stage', '==', filters.stage));
    }

    const querySnapshot = await getDocs(q);
    const startupList = document.getElementById('startupList');
    startupList.innerHTML = '';

    querySnapshot.forEach((doc) => {
        const startup = doc.data();
        const startupCard = createStartupCard(startup, doc.id);
        startupList.appendChild(startupCard);
    });
}

// Create Startup Card
function createStartupCard(startup, id) {
    const col = document.createElement('div');
    col.className = 'col-md-6 mb-4';
    
    col.innerHTML = `
        <div class="startup-card card h-100" data-bs-toggle="modal" data-bs-target="#startupDetailModal" data-startup-id="${id}">
            <div class="card-body">
                <div class="d-flex align-items-center mb-3">
                    <img src="${startup.logo || 'https://via.placeholder.com/60'}" alt="${startup.name} Logo" class="startup-logo me-3">
                    <div>
                        <h5 class="card-title mb-0">${startup.name}</h5>
                        <span class="startup-status status-${startup.stage.toLowerCase().replace(' ', '-')}">${startup.stage}</span>
                    </div>
                </div>
                <p class="card-text">${startup.description}</p>
                <div class="d-flex justify-content-between align-items-center">
                    <div>
                        <small class="text-muted">Valuation: $${startup.valuation}M</small>
                    </div>
                    <div>
                        <button class="btn btn-sm btn-outline-primary favorite-btn" data-startup-id="${id}">
                            <i class="fas fa-heart"></i>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;

    return col;
}

// Handle Filters
document.getElementById('industryFilter').addEventListener('change', (e) => {
    const filters = {
        industry: e.target.value,
        stage: document.getElementById('stageFilter').value
    };
    loadStartups(filters);
});

document.getElementById('stageFilter').addEventListener('change', (e) => {
    const filters = {
        industry: document.getElementById('industryFilter').value,
        stage: e.target.value
    };
    loadStartups(filters);
});

// Handle Search
document.querySelector('.input-group input').addEventListener('input', (e) => {
    const searchTerm = e.target.value.toLowerCase();
    const startupCards = document.querySelectorAll('.startup-card');
    
    startupCards.forEach(card => {
        const title = card.querySelector('.card-title').textContent.toLowerCase();
        const description = card.querySelector('.card-text').textContent.toLowerCase();
        
        if (title.includes(searchTerm) || description.includes(searchTerm)) {
            card.closest('.col-md-6').style.display = '';
        } else {
            card.closest('.col-md-6').style.display = 'none';
        }
    });
});

// Handle Favorites
document.addEventListener('click', async (e) => {
    if (e.target.closest('.favorite-btn')) {
        const btn = e.target.closest('.favorite-btn');
        const startupId = btn.dataset.startupId;
        const userId = auth.currentUser.uid;
        
        try {
            const favoriteRef = doc(db, 'favorites', `${userId}_${startupId}`);
            const favoriteDoc = await getDoc(favoriteRef);
            
            if (favoriteDoc.exists()) {
                await updateDoc(favoriteRef, { isFavorite: !favoriteDoc.data().isFavorite });
            } else {
                await addDoc(collection(db, 'favorites'), {
                    userId,
                    startupId,
                    isFavorite: true,
                    timestamp: new Date()
                });
            }
            
            btn.classList.toggle('active');
        } catch (error) {
            console.error('Error updating favorite:', error);
        }
    }
});

// Handle Startup Detail Modal
document.addEventListener('click', async (e) => {
    if (e.target.closest('.startup-card')) {
        const card = e.target.closest('.startup-card');
        const startupId = card.dataset.startupId;
        
        const startupDoc = await getDoc(doc(db, 'startups', startupId));
        if (startupDoc.exists()) {
            const startup = startupDoc.data();
            updateStartupModal(startup);
        }
    }
});

function updateStartupModal(startup) {
    document.querySelector('#startupDetailModal .modal-title').textContent = startup.name;
    document.querySelector('#startupDetailModal .metric-value').textContent = `$${startup.valuation}M`;
    // Update other modal content as needed
}

// Handle Chat
const chatMessages = document.querySelector('.chat-window');
const chatInput = document.querySelector('#chatModal input');

chatInput.addEventListener('keypress', async (e) => {
    if (e.key === 'Enter' && chatInput.value.trim()) {
        const message = chatInput.value.trim();
        const userId = auth.currentUser.uid;
        
        try {
            await addDoc(collection(db, 'messages'), {
                userId,
                startupId: currentStartupId,
                message,
                timestamp: new Date()
            });
            
            chatInput.value = '';
        } catch (error) {
            console.error('Error sending message:', error);
        }
    }
});

// Listen for new messages
let currentStartupId = null;
function listenForMessages(startupId) {
    currentStartupId = startupId;
    const messagesRef = collection(db, 'messages');
    const q = query(messagesRef, where('startupId', '==', startupId));
    
    onSnapshot(q, (snapshot) => {
        chatMessages.innerHTML = '';
        snapshot.forEach((doc) => {
            const message = doc.data();
            const messageElement = document.createElement('div');
            messageElement.className = `message ${message.userId === auth.currentUser.uid ? 'sent' : 'received'}`;
            messageElement.textContent = message.message;
            chatMessages.appendChild(messageElement);
        });
        chatMessages.scrollTop = chatMessages.scrollHeight;
    });
}

// Handle Logout
document.getElementById('logoutBtn').addEventListener('click', async () => {
    try {
        await signOut(auth);
        window.location.href = 'login.html';
    } catch (error) {
        console.error('Error signing out:', error);
    }
}); 
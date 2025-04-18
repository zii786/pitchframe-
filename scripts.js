// Wait for document to be fully loaded
document.addEventListener('DOMContentLoaded', function() {
    
    // Initialize Bootstrap tooltips
    var tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
    var tooltipList = tooltipTriggerList.map(function (tooltipTriggerEl) {
        return new bootstrap.Tooltip(tooltipTriggerEl);
    });
    
    // Character counter for pitch description
    const pitchDescription = document.getElementById('pitch-description');
    const charCount = document.getElementById('char-count');
    
    if (pitchDescription && charCount) {
        pitchDescription.addEventListener('input', function() {
            const remainingChars = 140 - this.value.length;
            charCount.textContent = remainingChars;
            
            if (remainingChars < 20) {
                charCount.classList.add('text-danger');
            } else {
                charCount.classList.remove('text-danger');
            }
        });
    }
    
    // Pitch form submission
    const pitchForm = document.getElementById('pitch-form');
    
    if (pitchForm) {
        pitchForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            // Get form values
            const startupName = document.getElementById('startup-name').value;
            const pitchCategory = document.getElementById('pitch-category').value;
            const industry = document.getElementById('industry').value;
            const description = document.getElementById('pitch-description').value;
            const tags = document.getElementById('tags').value;
            
            // Check which tab is active for pitch materials
            const activeTab = document.querySelector('#pitchTabs .nav-link.active');
            let pitchMaterial = '';
            
            if (activeTab.id === 'pdf-tab') {
                const pdfFile = document.getElementById('pdf-upload').files[0];
                if (!pdfFile) {
                    alert('Please upload a PDF file');
                    return;
                }
                pitchMaterial = 'PDF: ' + pdfFile.name;
            } else if (activeTab.id === 'video-tab') {
                const videoLink = document.getElementById('video-link').value;
                if (!videoLink) {
                    alert('Please provide a video link');
                    return;
                }
                pitchMaterial = 'Video: ' + videoLink;
            } else if (activeTab.id === 'slide-tab') {
                const slideLink = document.getElementById('slide-link').value;
                if (!slideLink) {
                    alert('Please provide a SlideShare link');
                    return;
                }
                pitchMaterial = 'SlideShare: ' + slideLink;
            }
            
            // Simulate submission
            showSuccessMessage('Your pitch has been submitted successfully!');
            
            // Reset form
            pitchForm.reset();
            charCount.textContent = '140';
        });
    }
    
    // Login form handling
    const startupLoginForm = document.getElementById('startup-login-form');
    const mentorLoginForm = document.getElementById('mentor-login-form');
    
    if (startupLoginForm) {
        startupLoginForm.addEventListener('submit', function(e) {
            e.preventDefault();
            simulateLogin('startup');
        });
    }
    
    if (mentorLoginForm) {
        mentorLoginForm.addEventListener('submit', function(e) {
            e.preventDefault();
            simulateLogin('mentor');
        });
    }
    
    // Login button
    const loginBtn = document.querySelector('a[href="#login"]');
    
    if (loginBtn) {
        loginBtn.addEventListener('click', function(e) {
            e.preventDefault();
            
            // Create and show modal
            const loginModal = new bootstrap.Modal(document.getElementById('loginModal'));
            loginModal.show();
        });
    }
    
    // Add animation to visible elements on scroll
    const animateOnScroll = function() {
        const elements = document.querySelectorAll('.feature-card, .unique-feature-card, .section-title, .dashboard-preview, .analytics-preview');
        
        elements.forEach(function(element) {
            const elementPosition = element.getBoundingClientRect().top;
            const screenPosition = window.innerHeight / 1.3;
            
            if (elementPosition < screenPosition) {
                element.classList.add('fade-in');
            }
        });
    };
    
    // Run animation check on scroll
    window.addEventListener('scroll', animateOnScroll);
    
    // Run once on load
    animateOnScroll();
    
    // Smooth scrolling for navigation links
    const navLinks = document.querySelectorAll('.navbar-nav a.nav-link');
    
    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            // Only for internal links
            if (this.getAttribute('href').startsWith('#')) {
                e.preventDefault();
                
                const targetId = this.getAttribute('href');
                if (targetId === '#login') return; // Skip login as it's handled separately
                
                const targetElement = document.querySelector(targetId);
                
                if (targetElement) {
                    // Scroll to element
                    window.scrollTo({
                        top: targetElement.offsetTop - 80, // Account for fixed navbar
                        behavior: 'smooth'
                    });
                    
                    // Update active link
                    navLinks.forEach(link => link.classList.remove('active'));
                    this.classList.add('active');
                }
            }
        });
    });
    
    // AI Rating Simulation
    const demoButton = document.querySelector('.btn-primary.mt-3');
    
    if (demoButton) {
        demoButton.addEventListener('click', function(e) {
            e.preventDefault();
            showAIAnalysisDemo();
        });
    }
});

// Utility Functions

// Show success message
function showSuccessMessage(message) {
    // Create toast element
    const toastEl = document.createElement('div');
    toastEl.className = 'position-fixed bottom-0 end-0 p-3';
    toastEl.style.zIndex = '9999';
    
    toastEl.innerHTML = `
        <div class="toast show" role="alert" aria-live="assertive" aria-atomic="true">
            <div class="toast-header bg-success text-white">
                <strong class="me-auto">Success</strong>
                <button type="button" class="btn-close btn-close-white" data-bs-dismiss="toast" aria-label="Close"></button>
            </div>
            <div class="toast-body">
                ${message}
            </div>
        </div>
    `;
    
    document.body.appendChild(toastEl);
    
    // Remove after 3 seconds
    setTimeout(function() {
        document.body.removeChild(toastEl);
    }, 3000);
}

// Simulate login
function simulateLogin(userType) {
    // Hide modal
    const loginModal = bootstrap.Modal.getInstance(document.getElementById('loginModal'));
    loginModal.hide();
    
    // Show success message
    const message = userType === 'startup' 
        ? 'Logged in successfully as Startup. Redirecting to dashboard...' 
        : 'Logged in successfully as Mentor. Redirecting to mentor dashboard...';
    
    showSuccessMessage(message);
    
    // Simulate redirect (in real app would navigate to dashboard)
    setTimeout(function() {
        if (userType === 'startup') {
            window.scrollTo({
                top: document.getElementById('pitch-analytics').offsetTop - 80,
                behavior: 'smooth'
            });
        } else {
            window.scrollTo({
                top: document.getElementById('mentor-dashboard').offsetTop - 80,
                behavior: 'smooth'
            });
        }
    }, 2000);
}

// Show AI Analysis Demo
function showAIAnalysisDemo() {
    // Create modal element
    const modalEl = document.createElement('div');
    modalEl.className = 'modal fade';
    modalEl.id = 'aiAnalysisModal';
    modalEl.tabIndex = '-1';
    modalEl.setAttribute('aria-hidden', 'true');
    
    modalEl.innerHTML = `
        <div class="modal-dialog modal-dialog-centered modal-lg">
            <div class="modal-content">
                <div class="modal-header">
                    <h5 class="modal-title">AI Pitch Analysis</h5>
                    <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                </div>
                <div class="modal-body">
                    <div class="ai-analysis-results">
                        <div class="analysis-header d-flex justify-content-between align-items-center mb-4">
                            <div>
                                <h5 class="mb-1">TechSprint: AI-Powered Workflow Automation</h5>
                                <span class="badge bg-primary">SaaS</span>
                                <span class="badge bg-secondary">AI/ML</span>
                                <span class="badge bg-info">Early Traction</span>
                            </div>
                            <div class="overall-score">
                                <div class="score-circle">
                                    <span>83</span>
                                </div>
                                <p class="mb-0 text-center"><small>Overall Score</small></p>
                            </div>
                        </div>
                        
                        <div class="analysis-section mb-4">
                            <h6 class="section-header">Problem Statement</h6>
                            <div class="progress mb-2" style="height: 10px;">
                                <div class="progress-bar bg-success" role="progressbar" style="width: 90%" aria-valuenow="90" aria-valuemin="0" aria-valuemax="100"></div>
                            </div>
                            <p class="text-success mb-0">Strong and clear problem identification with market validation.</p>
                        </div>
                        
                        <div class="analysis-section mb-4">
                            <h6 class="section-header">Solution & Value Proposition</h6>
                            <div class="progress mb-2" style="height: 10px;">
                                <div class="progress-bar bg-primary" role="progressbar" style="width: 85%" aria-valuenow="85" aria-valuemin="0" aria-valuemax="100"></div>
                            </div>
                            <p class="mb-0">Good solution with clear benefits, but could highlight USP more.</p>
                        </div>
                        
                        <div class="analysis-section mb-4">
                            <h6 class="section-header">Market Opportunity</h6>
                            <div class="progress mb-2" style="height: 10px;">
                                <div class="progress-bar bg-warning" role="progressbar" style="width: 65%" aria-valuenow="65" aria-valuemin="0" aria-valuemax="100"></div>
                            </div>
                            <p class="text-warning mb-0">Market size mentioned but lacks detailed segmentation and growth projections.</p>
                        </div>
                        
                        <div class="analysis-section mb-4">
                            <h6 class="section-header">Business Model</h6>
                            <div class="progress mb-2" style="height: 10px;">
                                <div class="progress-bar bg-danger" role="progressbar" style="width: 50%" aria-valuenow="50" aria-valuemin="0" aria-valuemax="100"></div>
                            </div>
                            <p class="text-danger mb-0">Revenue model unclear. Consider adding pricing tiers and unit economics.</p>
                        </div>
                        
                        <div class="analysis-section mb-4">
                            <h6 class="section-header">Competition & Differentiation</h6>
                            <div class="progress mb-2" style="height: 10px;">
                                <div class="progress-bar bg-primary" role="progressbar" style="width: 80%" aria-valuenow="80" aria-valuemin="0" aria-valuemax="100"></div>
                            </div>
                            <p class="mb-0">Good competitive analysis with clear differentiation points.</p>
                        </div>
                        
                        <div class="key-recommendations mt-4">
                            <h6>Key Recommendations:</h6>
                            <ul class="list-group">
                                <li class="list-group-item"><i class="fas fa-exclamation-circle text-danger me-2"></i> Add detailed pricing model and go-to-market strategy</li>
                                <li class="list-group-item"><i class="fas fa-exclamation-circle text-warning me-2"></i> Include more specific market size data and growth trends</li>
                                <li class="list-group-item"><i class="fas fa-exclamation-circle text-primary me-2"></i> Strengthen executive team slide with more relevant experience highlights</li>
                            </ul>
                        </div>
                    </div>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
                    <button type="button" class="btn btn-primary">Download Analysis</button>
                </div>
            </div>
        </div>
    `;
    
    document.body.appendChild(modalEl);
    
    // Show modal
    const aiModal = new bootstrap.Modal(document.getElementById('aiAnalysisModal'));
    aiModal.show();
    
    // Add custom styles for the analysis
    const styleEl = document.createElement('style');
    styleEl.innerHTML = `
        .overall-score .score-circle {
            width: 60px;
            height: 60px;
            border-radius: 50%;
            background-color: var(--primary-color);
            color: white;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 1.5rem;
            font-weight: bold;
            margin: 0 auto;
        }
        
        .section-header {
            font-weight: 600;
            margin-bottom: 0.5rem;
        }
    `;
    
    document.head.appendChild(styleEl);
    
    // Clean up on modal close
    document.getElementById('aiAnalysisModal').addEventListener('hidden.bs.modal', function() {
        document.body.removeChild(modalEl);
        document.head.removeChild(styleEl);
    });
} 
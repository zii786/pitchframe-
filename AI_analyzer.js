// Check authentication state
auth.onAuthStateChanged((user) => {
    if (!user) {
        window.location.href = 'login.html';
    }
});

// Handle logout
document.getElementById('logoutBtn').addEventListener('click', async (e) => {
    e.preventDefault();
    try {
        await logoutUser();
        window.location.href = 'login.html';
    } catch (error) {
        console.error('Logout error:', error);
        alert('Error logging out: ' + error.message);
    }
});

// File upload handling
const dropZone = document.getElementById('dropZone');
const fileInput = document.getElementById('fileInput');
const uploadProgress = document.getElementById('uploadProgress');
const progressBar = uploadProgress.querySelector('.progress-bar');

// Drag and drop handlers
dropZone.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropZone.style.borderColor = '#0d6efd';
    dropZone.style.backgroundColor = '#f8f9fa';
});

dropZone.addEventListener('dragleave', () => {
    dropZone.style.borderColor = '#dee2e6';
    dropZone.style.backgroundColor = 'white';
});

dropZone.addEventListener('drop', (e) => {
    e.preventDefault();
    dropZone.style.borderColor = '#dee2e6';
    dropZone.style.backgroundColor = 'white';
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
        handleFileUpload(files[0]);
    }
});

// File input change handler
fileInput.addEventListener('change', (e) => {
    if (e.target.files.length > 0) {
        handleFileUpload(e.target.files[0]);
    }
});

// Handle file upload
async function handleFileUpload(file) {
    // Validate file type
    const validTypes = ['application/pdf', 'application/vnd.ms-powerpoint', 'application/vnd.openxmlformats-officedocument.presentationml.presentation'];
    if (!validTypes.includes(file.type)) {
        alert('Please upload a PDF or PowerPoint file');
        return;
    }

    try {
        // Show progress bar
        uploadProgress.classList.remove('d-none');
        progressBar.style.width = '0%';

        // Create a unique filename
        const timestamp = new Date().getTime();
        const filename = `${auth.currentUser.uid}/${timestamp}_${file.name}`;

        // Upload file to Firebase Storage
        const storageRef = firebase.storage().ref();
        const fileRef = storageRef.child(filename);
        const uploadTask = fileRef.put(file);

        // Monitor upload progress
        uploadTask.on('state_changed', 
            (snapshot) => {
                const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                progressBar.style.width = `${progress}%`;
            },
            (error) => {
                console.error('Upload error:', error);
                alert('Error uploading file: ' + error.message);
                uploadProgress.classList.add('d-none');
            },
            async () => {
                // Get download URL
                const downloadURL = await uploadTask.snapshot.ref.getDownloadURL();

                // Save file metadata to Firestore
                const docRef = await firebase.firestore().collection('pitch_decks').add({
                    userId: auth.currentUser.uid,
                    filename: file.name,
                    downloadURL: downloadURL,
                    uploadDate: firebase.firestore.FieldValue.serverTimestamp(),
                    status: 'processing'
                });

                // Start AI analysis
                await analyzePitchDeck(downloadURL, docRef.id);

                // Hide progress bar
                uploadProgress.classList.add('d-none');

                // Close modal
                bootstrap.Modal.getInstance(document.getElementById('uploadModal')).hide();

                // Show success message
                alert('File uploaded successfully! AI analysis in progress.');
            }
        );
    } catch (error) {
        console.error('Error:', error);
        alert('Error: ' + error.message);
        uploadProgress.classList.add('d-none');
    }
}

// Function to analyze pitch deck
async function analyzePitchDeck(fileUrl, docId) {
    try {
        // Show processing alert
        document.getElementById('processingAlert').classList.remove('d-none');
        
        // Call the AI analysis service
        const response = await fetch('https://api.pitchframe.ai/analyze', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${await auth.currentUser.getIdToken()}`
            },
            body: JSON.stringify({
                fileUrl: fileUrl,
                userId: auth.currentUser.uid,
                docId: docId,
                analysisType: 'pitch_deck',
                options: {
                    analyzeClarity: true,
                    analyzeEngagement: true,
                    generateRecommendations: true,
                    language: 'en'
                }
            })
        });

        if (!response.ok) {
            throw new Error('AI analysis service failed');
        }

        const analysis = await response.json();

        // Update Firestore with analysis results
        await firebase.firestore().collection('pitch_decks').doc(docId).update({
            status: 'completed',
            analysis: {
                clarityScore: analysis.clarityScore,
                engagementScore: analysis.engagementScore,
                clarityFeedback: analysis.clarityFeedback,
                engagementFeedback: analysis.engagementFeedback,
                recommendations: analysis.recommendations,
                timestamp: firebase.firestore.FieldValue.serverTimestamp()
            },
            analysisDate: firebase.firestore.FieldValue.serverTimestamp()
        });

        // Hide processing alert
        document.getElementById('processingAlert').classList.add('d-none');
        
        // Update UI with analysis results
        updateAnalysisResults(analysis);

        return analysis;
    } catch (error) {
        console.error('Analysis error:', error);
        // Hide processing alert
        document.getElementById('processingAlert').classList.add('d-none');
        // Show error alert
        const errorAlert = document.createElement('div');
        errorAlert.className = 'alert alert-danger mt-3';
        errorAlert.innerHTML = `
            <i class="fas fa-exclamation-circle me-2"></i>
            Error during analysis: ${error.message}
        `;
        document.querySelector('.upload-section').appendChild(errorAlert);
        // Update Firestore with error status
        await firebase.firestore().collection('pitch_decks').doc(docId).update({
            status: 'error',
            error: error.message
        });
        throw error;
    }
}

// Function to update analysis results in the UI
function updateAnalysisResults(analysis) {
    // Show analysis results section
    document.getElementById('analysisResults').style.display = 'block';

    // Update clarity score
    const clarityScore = document.getElementById('clarityScore');
    const clarityBadge = document.getElementById('clarityBadge');
    clarityScore.style.width = `${analysis.clarityScore * 10}%`;
    clarityScore.setAttribute('aria-valuenow', analysis.clarityScore);
    clarityBadge.textContent = `${analysis.clarityScore}/10`;
    document.getElementById('clarityFeedback').textContent = analysis.clarityFeedback;

    // Update engagement score
    const engagementScore = document.getElementById('engagementScore');
    const engagementBadge = document.getElementById('engagementBadge');
    engagementScore.style.width = `${analysis.engagementScore * 10}%`;
    engagementScore.setAttribute('aria-valuenow', analysis.engagementScore);
    engagementBadge.textContent = `${analysis.engagementScore}/10`;
    document.getElementById('engagementFeedback').textContent = analysis.engagementFeedback;

    // Update recommendations
    const recommendationsList = document.getElementById('recommendationsList');
    recommendationsList.innerHTML = '';
    analysis.recommendations.forEach(rec => {
        const li = document.createElement('li');
        li.className = 'list-group-item';
        li.innerHTML = `
            <i class="fas fa-check-circle text-success me-2"></i>
            ${rec}
        `;
        recommendationsList.appendChild(li);
    });
}

// Listen for real-time updates on pitch deck analysis
firebase.firestore().collection('pitch_decks')
    .where('userId', '==', auth.currentUser.uid)
    .orderBy('uploadDate', 'desc')
    .limit(1)
    .onSnapshot((snapshot) => {
        snapshot.docChanges().forEach(change => {
            if (change.type === 'modified') {
                const doc = change.doc;
                if (doc.data().status === 'completed') {
                    updateAnalysisResults(doc.data().analysis);
                } else if (doc.data().status === 'error') {
                    alert('Error during AI analysis: ' + doc.data().error);
                }
            }
        });
    });

// Add event listener for download report button
document.getElementById('downloadReportBtn').addEventListener('click', async () => {
    try {
        const docId = sessionStorage.getItem('currentAnalysisId');
        if (!docId) {
            throw new Error('No analysis found to download');
        }

        const doc = await firebase.firestore().collection('pitch_decks').doc(docId).get();
        if (!doc.exists) {
            throw new Error('Analysis not found');
        }

        const analysis = doc.data().analysis;
        const report = {
            clarityScore: analysis.clarityScore,
            engagementScore: analysis.engagementScore,
            clarityFeedback: analysis.clarityFeedback,
            engagementFeedback: analysis.engagementFeedback,
            recommendations: analysis.recommendations,
            timestamp: analysis.timestamp.toDate().toLocaleString()
        };

        // Create and download PDF report
        const response = await fetch('https://api.pitchframe.ai/generate-report', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${await auth.currentUser.getIdToken()}`
            },
            body: JSON.stringify(report)
        });

        if (!response.ok) {
            throw new Error('Failed to generate report');
        }

        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `pitch-analysis-report-${docId}.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
    } catch (error) {
        console.error('Download error:', error);
        alert('Error downloading report: ' + error.message);
    }
});

// Add tooltips to help users understand the scores
document.addEventListener('DOMContentLoaded', () => {
    const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
    tooltipTriggerList.map(function (tooltipTriggerEl) {
        return new bootstrap.Tooltip(tooltipTriggerEl);
    });
}); 
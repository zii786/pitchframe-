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
        // Call your AI analysis service
        const response = await fetch('YOUR_AI_SERVICE_ENDPOINT', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                fileUrl: fileUrl,
                userId: auth.currentUser.uid,
                docId: docId
            })
        });

        if (!response.ok) {
            throw new Error('AI analysis service failed');
        }

        const analysis = await response.json();

        // Update Firestore with analysis results
        await firebase.firestore().collection('pitch_decks').doc(docId).update({
            status: 'completed',
            analysis: analysis,
            analysisDate: firebase.firestore.FieldValue.serverTimestamp()
        });

        return analysis;
    } catch (error) {
        console.error('Analysis error:', error);
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
    // Update clarity score
    document.querySelector('.metric-value').textContent = `${analysis.clarityScore}/10`;
    document.querySelector('.progress-bar.bg-success').style.width = `${analysis.clarityScore * 10}%`;

    // Update engagement score
    document.querySelectorAll('.metric-value')[1].textContent = `${analysis.engagementScore}/10`;
    document.querySelector('.progress-bar.bg-warning').style.width = `${analysis.engagementScore * 10}%`;

    // Update recommendations
    const recommendationsList = document.querySelector('.list-group');
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
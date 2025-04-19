import { db } from './firebase-config.js';
import { COLLECTIONS } from './firebase-db.js';

async function checkFirestoreData() {
    try {
        console.log('Checking Firestore data...');
        
        // Check each collection
        for (const collectionName of Object.values(COLLECTIONS)) {
            const snapshot = await db.collection(collectionName).get();
            console.log(`\nCollection: ${collectionName}`);
            console.log(`Number of documents: ${snapshot.size}`);
            
            snapshot.forEach(doc => {
                console.log(`Document ID: ${doc.id}`);
                console.log('Data:', doc.data());
            });
        }
    } catch (error) {
        console.error('Error checking Firestore data:', error);
    }
}

// Run the check
checkFirestoreData(); 
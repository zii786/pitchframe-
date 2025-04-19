import { db } from './firebase-config.js';
import { COLLECTIONS } from './firebase-db.js';

// Function to migrate data from localStorage to Firestore
async function migrateLocalStorageToFirestore() {
    try {
        // Get all keys from localStorage
        const keys = Object.keys(localStorage);
        
        // Filter keys that match our collections
        const collectionKeys = keys.filter(key => 
            Object.values(COLLECTIONS).includes(key)
        );

        // Migrate each collection
        for (const collectionKey of collectionKeys) {
            const data = JSON.parse(localStorage.getItem(collectionKey));
            
            if (Array.isArray(data)) {
                // If data is an array, add each item to Firestore
                for (const item of data) {
                    try {
                        await db.collection(collectionKey).add({
                            ...item,
                            migratedAt: new Date()
                        });
                        console.log(`Migrated item to ${collectionKey}`);
                    } catch (error) {
                        console.error(`Error migrating item to ${collectionKey}:`, error);
                    }
                }
            } else if (typeof data === 'object' && data !== null) {
                // If data is an object, add it to Firestore
                try {
                    await db.collection(collectionKey).add({
                        ...data,
                        migratedAt: new Date()
                    });
                    console.log(`Migrated data to ${collectionKey}`);
                } catch (error) {
                    console.error(`Error migrating data to ${collectionKey}:`, error);
                }
            }
        }

        console.log('Migration completed successfully!');
    } catch (error) {
        console.error('Error during migration:', error);
    }
}

// Function to clear migrated data from localStorage
function clearMigratedData() {
    try {
        const keys = Object.keys(localStorage);
        const collectionKeys = keys.filter(key => 
            Object.values(COLLECTIONS).includes(key)
        );

        for (const key of collectionKeys) {
            localStorage.removeItem(key);
            console.log(`Cleared ${key} from localStorage`);
        }

        console.log('LocalStorage cleanup completed!');
    } catch (error) {
        console.error('Error clearing localStorage:', error);
    }
}

// Export the functions
export { migrateLocalStorageToFirestore, clearMigratedData }; 
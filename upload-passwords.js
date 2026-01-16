import admin from 'firebase-admin';
import { readFileSync } from 'fs';

const serviceAccount = JSON.parse(readFileSync('./src/serviceAccountkey.json', 'utf8'));

// Initialize Firebase Admin SDK
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  projectId: 'dummy-policies'
});

const db = admin.firestore();

// User data with passwords
const users = [
  {
    userId: 'admin',
    displayName: 'Admin',
    email: 'admin@demopolicymanager.com',
    password: 'Admin@2025',
    role: 'admin'
  },
  {
    userId: 'prakash_jadav',
    displayName: 'Prakash Jadav',
    email: 'prakash@demopolicymanager.com',
    password: 'Prakash@2025',
    role: 'user'
  },
  {
    userId: 'back_office',
    displayName: 'Back Office',
    email: 'backoffice@demopolicymanager.com',
    password: 'BackOffice@2025',
    role: 'user'
  },
  {
    userId: 'arun_patel',
    displayName: 'Arun Patel',
    email: 'arun@demopolicymanager.com',
    password: 'Arun@2025',
    role: 'user'
  }
];

async function uploadUsersToFirebase() {
  try {
    console.log('Starting to upload users to Firebase...');
    
    for (const userData of users) {
      const userDoc = {
        id: userData.userId,
        userId: userData.userId,
        displayName: userData.displayName,
        email: userData.email,
        role: userData.role,
        password: userData.password,
        isActive: true,
        createdAt: admin.firestore.Timestamp.now()
      };

      // Upload user to Firestore
      await db.collection('users').doc(userData.userId).set(userDoc);
      console.log(`✅ User ${userData.displayName} (${userData.userId}) uploaded successfully`);
    }

    console.log('🎉 All users uploaded successfully!');
    console.log('\nLogin credentials:');
    console.log('==================');
    
    users.forEach(user => {
      console.log(`User ID: ${user.userId}`);
      console.log(`Password: ${user.password}`);
      console.log(`Role: ${user.role}`);
      console.log('---');
    });

  } catch (error) {
    console.error('❌ Error uploading users:', error);
  } finally {
    // Terminate the admin app
    process.exit(0);
  }
}

// Run the upload function
uploadUsersToFirebase();

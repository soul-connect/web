import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore, serverTimestamp } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { doc, setDoc, getDocs, collection } from "firebase/firestore";
import { getMessaging, getToken, onMessage } from "firebase/messaging";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

// Initialize Firebase
export const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication
export const auth = getAuth(app);

// Initialize Firestore
export const db = getFirestore(app);

// Initialize Firebase Storage
export const storage = getStorage(app);

// Initialize Firebase Messaging (only on the client side)
let messaging: any;
if (typeof window !== "undefined" && "serviceWorker" in navigator) {
  try {
    messaging = getMessaging(app);
  } catch (error) {
    console.error("Error initializing Firebase Messaging:", error);
  }
}

// Google Auth Provider
export const provider = new GoogleAuthProvider();

// Add these to your existing firebase exports
export const createUserIfNotExists = async (user: any) => {
  const userRef = doc(db, "users", user.uid);
  await setDoc(userRef, {
    uid: user.uid,
    displayName: user.displayName,
    email: user.email,
    photoURL: user.photoURL,
    lastSeen: serverTimestamp(),
  }, { merge: true });
};

export const getUsers = async () => {
  const snapshot = await getDocs(collection(db, "users"));
  return snapshot.docs.map(doc => doc.data());
};

// Request FCM Token
export const requestNotificationToken = () => {
  if (!messaging) return;

  getToken(messaging, {
    vapidKey: process.env.NEXT_PUBLIC_VAP_ID // Replace with your generated public VAPID key
  })
    .then((token) => {
      if (token) {
        // console.log("FCM Token:", token);
        // Send the token to your server to save it for sending notifications
      } else {
        console.log("No registration token available.");
      }
    })
    .catch((error) => {
      console.error("Error getting FCM token:", error);
    });
};

export const firestore = getFirestore(app);
export { serverTimestamp };

// Handle incoming messages
if (messaging) {
  onMessage(messaging, (payload) => {
    console.log("Message received. ", payload);
  });
}

if (typeof window !== "undefined" && "serviceWorker" in navigator) {
  navigator.serviceWorker
    .register("/firebase-messaging-sw.js")
    .then((registration) => {
      console.log("Service Worker registered with scope:", registration.scope);
    })
    .catch((error) => {
      console.error("Service Worker registration failed:", error);
    });
}
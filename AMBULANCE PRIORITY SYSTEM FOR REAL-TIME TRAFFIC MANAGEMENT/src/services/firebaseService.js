// Firebase SDK Integration for Ambulance Priority Traffic System
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getDatabase, ref, onValue, set, update } from "firebase/database";
import { getFirestore, doc, onSnapshot, setDoc } from "firebase/firestore";

export const firebaseConfig = {
  apiKey: "AIzaSyBQHJK04S4TyGblQMtZpuynP4uPOBJbxYo",
  authDomain: "ambulance-detection-b47d5.firebaseapp.com",
  databaseURL: "https://ambulance-detection-b47d5-default-rtdb.firebaseio.com",
  projectId: "ambulance-detection-b47d5",
  storageBucket: "ambulance-detection-b47d5.firebasestorage.app",
  messagingSenderId: "144491627325",
  appId: "1:144491627325:web:776578f4c34e9a23783b54",
  measurementId: "G-0FKMXM9ZP2"
};

// Initialize Firebase
let app;
let analytics;
let database;
let firestore;
let isInitialized = false;

try {
  app = initializeApp(firebaseConfig);
  if (typeof window !== 'undefined') {
    try { analytics = getAnalytics(app); } catch (e) {}
  }
  database = getDatabase(app);
  firestore = getFirestore(app);
  isInitialized = true;
  console.log("🔥 Firebase initialized successfully for project: ambulance-detection-b47d5");
} catch (error) {
  console.warn("Firebase initialization warning:", error);
}

export { app, analytics, database, firestore, isInitialized };

// Realtime Telemetry Sync Helpers
export function syncAmbulanceTelemetryToFirebase(telemetryData) {
  if (!isInitialized || !database) return;
  try {
    const ambRef = ref(database, 'telemetry/ambulance_101');
    set(ambRef, {
      ...telemetryData,
      lastUpdated: new Date().toISOString()
    });
  } catch (err) {
    console.warn("Firebase telemetry write error:", err);
  }
}

export function syncJunctionStatesToFirebase(junctionsData) {
  if (!isInitialized || !database) return;
  try {
    const junctionsRef = ref(database, 'traffic/junctions');
    set(junctionsRef, {
      nodes: junctionsData,
      lastUpdated: new Date().toISOString()
    });
  } catch (err) {
    console.warn("Firebase junctions write error:", err);
  }
}

export function subscribeToRemoteAmbulance(callback) {
  if (!isInitialized || !database) return () => {};
  const ambRef = ref(database, 'telemetry/ambulance_101');
  return onValue(ambRef, (snapshot) => {
    const data = snapshot.val();
    if (data && callback) callback(data);
  });
}

export function subscribeToRemoteJunctions(callback) {
  if (!isInitialized || !database) return () => {};
  const junctionsRef = ref(database, 'traffic/junctions');
  return onValue(junctionsRef, (snapshot) => {
    const data = snapshot.val();
    if (data && data.nodes && callback) callback(data.nodes);
  });
}

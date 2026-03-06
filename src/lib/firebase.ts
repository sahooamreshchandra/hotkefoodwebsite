import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

// ⚠️ IMPORTANT: Replace this with your actual Firebase config from the console
const firebaseConfig = {
    apiKey: "AIzaSyDhmIr8WtRta-kl4j7_XCw-wurR7XMtaaU",
    authDomain: "hotkefoods.firebaseapp.com",
    projectId: "hotkefoods",
    storageBucket: "hotkefoods.firebasestorage.app",
    messagingSenderId: "949704232396",
    appId: "1:949704232396:web:55ef1b3ffdfcda561a6169",
    measurementId: "G-1T0ZPC36Q7"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);

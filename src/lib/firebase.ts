// Import the functions you need from the SDKs you need
import { getApp, getApps, initializeApp } from "firebase/app"
import { getFirestore } from "firebase/firestore"
import { getAuth } from "firebase/auth"

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDtoNJt4eIyOBVbNuSqHzC-XUpl-bqhkYc",
  authDomain: "projeck1-3333d.firebaseapp.com",
  projectId: "projeck1-3333d",
  storageBucket: "projeck1-3333d.appspot.com",
  messagingSenderId: "407147695851",
  appId: "1:407147695851:web:8f04030ddf719febb478ae"
};

// Initialize Firebase for SSR
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp()
const db = getFirestore(app)
const auth = getAuth(app)

export { app, db, auth }

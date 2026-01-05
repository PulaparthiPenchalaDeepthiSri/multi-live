// js/firebase.js

import { initializeApp } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-app.js";
import { getDatabase } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-database.js";

// ✅ Your Firebase configuration (correctly converted)
const firebaseConfig = {
  apiKey: "AIzaSyA58ad86aG163C6NHOSLYfcdxaHxM_nIdc",
  authDomain: "live-location-tracker-52fdd.firebaseapp.com",
  databaseURL: "https://live-location-tracker-52fdd-default-rtdb.firebaseio.com",
  projectId: "live-location-tracker-52fdd",
  storageBucket: "live-location-tracker-52fdd.appspot.com",
  messagingSenderId: "145584171246",
  appId: "1:145584171246:web:eb9357ab9e19ff522cebff"
};

// Initialize Firebase
export const app = initializeApp(firebaseConfig);
export const db = getDatabase(app);

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getDatabase, ref, onValue } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";

const firebaseConfig = {
    apiKey: "AIzaSyD1WSoRS_4l3XYgoh5JaBB7RTTMU6-pPbw",
    authDomain: "smart-irrigation-system-id.firebaseapp.com",
    databaseURL: "https://smart-irrigation-system-id-default-rtdb.firebaseio.com",
    projectId: "smart-irrigation-system-id",
    storageBucket: "smart-irrigation-system-id.firebasestorage.app",
    messagingSenderId: "670164001815",
    appId: "1:670164001815:web:fe0346a97bb1bf57e72852"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

const moistureRef = ref(db, "irrigation/moisture");

onValue(moistureRef, (snapshot) => {
    const el = document.getElementById('test-output');
    if (el) {
        el.innerHTML += `<br>Timestamp: ${new Date().toLocaleTimeString()} | Value: ${snapshot.val()}`;
    }
}, (error) => {
    const el = document.getElementById('test-output');
    if (el) {
        el.innerHTML += `<br><b>FIREBASE ERROR:</b> ${error.message}`;
    }
});

// -------- Firebase Setup --------
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getDatabase, ref, onValue, set } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";

const firebaseConfig = {
    apiKey: "AIzaSyD1WSoRS_4l3XYgoh5JaBB7RTTMU6-pPbw",
    authDomain: "smart-irrigation-system-id.firebaseapp.com",
    databaseURL: "https://smart-irrigation-system-id-default-rtdb.firebaseio.com",
    projectId: "smart-irrigation-system-id",
    storageBucket: "smart-irrigation-system-id.firebasestorage.app",
    messagingSenderId: "670164001815",
    appId: "1:670164001815:web:fe0346a97bb1bf57e72852",
    measurementId: "G-HD9V6WR7TG"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);


// -------- System State --------
let isMotorOn = false;
let currentMoisture = 0;
let chartInstance = null;
const maxDataPoints = 15;


// -------- DOM Elements --------
const moistureValueEl = document.getElementById('moisture-value');
const moistureProgressEl = document.getElementById('moisture-progress');
const motorStatusTextEl = document.getElementById('motor-status-text');
const wateringStatusTextEl = document.getElementById('watering-status-text');
const timestampEl = document.getElementById('timestamp');
const connectionStatusEl = document.getElementById('connection-status');
const statusIndicatorEl = document.querySelector('.status-indicator');

const btnStart = document.getElementById('btn-start');
const btnStop = document.getElementById('btn-stop');
const controlFeedback = document.getElementById('control-feedback');


// -------- Initialization --------
document.addEventListener('DOMContentLoaded', () => {
    initChart();
    updateTimestamp();
    listenToFirebase();
});


// -------- Listen to Firebase --------
function listenToFirebase() {

    const moistureRef = ref(db, "irrigation/moisture");

    onValue(moistureRef, (snapshot) => {

        currentMoisture = Number(snapshot.val()) || 0;
        updateUI();
        updateChart(currentMoisture);
        updateTimestamp();

    });


    const motorRef = ref(db, "irrigation/motor");

    onValue(motorRef, (snapshot) => {

        const motorState = snapshot.val();

        if (motorState && String(motorState).toLowerCase() === "on") {
            isMotorOn = true;
        } else {
            isMotorOn = false;
        }

        updateUI();

    });

}


// -------- Motor Controls --------
btnStart.addEventListener('click', () => {

    set(ref(db, "irrigation/motor"), "On");

});

btnStop.addEventListener('click', () => {

    set(ref(db, "irrigation/motor"), "Off");

});


// -------- UI Updates --------
function updateUI() {

    moistureValueEl.textContent = currentMoisture;
    moistureProgressEl.style.width = currentMoisture + "%";

    if (currentMoisture < 30) {

        moistureProgressEl.style.backgroundColor = 'red';

    }
    else if (currentMoisture > 80) {

        moistureProgressEl.style.backgroundColor = 'blue';

    }
    else {

        moistureProgressEl.style.backgroundColor = 'green';

    }


    if (isMotorOn) {

        motorStatusTextEl.textContent = "ON";
        wateringStatusTextEl.textContent = "Active";

        btnStart.disabled = true;
        btnStop.disabled = false;

        controlFeedback.textContent = "Irrigation Running";

    }
    else {

        motorStatusTextEl.textContent = "OFF";
        wateringStatusTextEl.textContent = "Inactive";

        btnStart.disabled = false;
        btnStop.disabled = true;

        controlFeedback.textContent = "System Ready";

    }

}


// -------- Chart --------
function initChart() {

    const ctx = document.getElementById("moistureChart").getContext("2d");

    chartInstance = new Chart(ctx, {

        type: "line",

        data: {
            labels: [],
            datasets: [{
                label: "Soil Moisture %",
                data: [],
                borderColor: "#4caf50",
                backgroundColor: "rgba(76,175,80,0.1)",
                borderWidth: 3,
                tension: 0.4
            }]
        },

        options: {
            responsive: true,
            scales: {
                y: {
                    min: 0,
                    max: 100
                }
            }
        }

    });

}


function updateChart(value) {

    const time = new Date().toLocaleTimeString();

    chartInstance.data.labels.push(time);
    chartInstance.data.datasets[0].data.push(value);

    if (chartInstance.data.labels.length > maxDataPoints) {

        chartInstance.data.labels.shift();
        chartInstance.data.datasets[0].data.shift();

    }

    chartInstance.update();

}


// -------- Time --------
function updateTimestamp() {

    const time = new Date().toLocaleTimeString();
    const timestampEl = document.getElementById('timestamp');
    if (timestampEl) timestampEl.textContent = time;

}
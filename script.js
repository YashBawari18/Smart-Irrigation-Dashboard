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


// -------- Plant Threshold Data --------
// threshold = auto-pump triggers when moisture drops below this %
const plantThresholds = {
    "tomato":     { threshold: 60, range: "60–80%",  display: "Tomato"     },
    "cactus":     { threshold: 10, range: "10–20%",  display: "Cactus"     },
    "rose":       { threshold: 50, range: "50–70%",  display: "Rose"       },
    "fern":       { threshold: 70, range: "70–90%",  display: "Fern"       },
    "wheat":      { threshold: 40, range: "40–60%",  display: "Wheat"      },
    "lettuce":    { threshold: 65, range: "65–80%",  display: "Lettuce"    },
    "mint":       { threshold: 55, range: "55–75%",  display: "Mint"       },
    "aloe vera":  { threshold: 15, range: "15–30%",  display: "Aloe Vera"  },
    "orchid":     { threshold: 45, range: "45–65%",  display: "Orchid"     },
    "sunflower":  { threshold: 35, range: "35–55%",  display: "Sunflower"  }
};


// -------- System State --------
let isMotorOn = false;
let currentMoisture = 0;
let currentThreshold = 30; // default, will update from Firebase
let chartInstance = null;
const maxDataPoints = 15;


// -------- DOM Elements --------
const moistureValueEl    = document.getElementById('moisture-value');
const moistureProgressEl = document.getElementById('moisture-progress');
const motorStatusTextEl  = document.getElementById('motor-status-text');
const wateringStatusTextEl = document.getElementById('watering-status-text');
const timestampEl        = document.getElementById('timestamp');
const connectionStatusEl = document.getElementById('connection-status');
const statusIndicatorEl  = document.querySelector('.status-indicator');

const btnStart       = document.getElementById('btn-start');
const btnStop        = document.getElementById('btn-stop');
const controlFeedback = document.getElementById('control-feedback');

// Plant Profile Elements
const plantInput          = document.getElementById('plant-input');
const btnSetPlant         = document.getElementById('btn-set-plant');
const plantInfo           = document.getElementById('plant-info');
const plantNameDisplay    = document.getElementById('plant-name-display');
const plantThreshDisplay  = document.getElementById('plant-threshold-display');
const plantRangeDisplay   = document.getElementById('plant-range-display');
const plantFeedback       = document.getElementById('plant-feedback');


// -------- Initialization --------
document.addEventListener('DOMContentLoaded', () => {
    initChart();
    updateTimestamp();
    listenToFirebase();
    setupPlantControls();
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
        isMotorOn = motorState && String(motorState).toLowerCase() === "on";
        updateUI();
    });

    // Listen to threshold from Firebase (updated by plant selector)
    const thresholdRef = ref(db, "irrigation/threshold");
    onValue(thresholdRef, (snapshot) => {
        const val = snapshot.val();
        if (val !== null && !isNaN(Number(val))) {
            currentThreshold = Number(val);
        }
        updateUI();
    });

    // Restore plant info if previously saved in Firebase
    const plantRef = ref(db, "irrigation/plant");
    onValue(plantRef, (snapshot) => {
        const savedPlant = snapshot.val();
        if (savedPlant) {
            const key = savedPlant.toLowerCase();
            if (plantThresholds[key]) {
                showPlantInfo(plantThresholds[key]);
            }
        }
    });
}


// -------- Motor Controls --------
btnStart.addEventListener('click', () => {
    set(ref(db, "irrigation/motor"), "On");
});

btnStop.addEventListener('click', () => {
    set(ref(db, "irrigation/motor"), "Off");
});


// -------- Plant Profile Controls --------
function setupPlantControls() {
    btnSetPlant.addEventListener('click', () => {
        const entered = plantInput.value.trim();
        if (!entered) {
            showPlantFeedback("Please enter a plant name.", "error");
            return;
        }

        const key = entered.toLowerCase();
        const plant = plantThresholds[key];

        if (!plant) {
            showPlantFeedback(`"${entered}" not found. Try: Tomato, Rose, Cactus, Fern…`, "error");
            plantInfo.style.display = "none";
            return;
        }

        // Write threshold and plant name to Firebase
        set(ref(db, "irrigation/threshold"), plant.threshold);
        set(ref(db, "irrigation/plant"), plant.display);

        showPlantInfo(plant);
        showPlantFeedback(`✅ ${plant.display} profile applied! Threshold set to ${plant.threshold}%.`, "success");
    });

    // Allow pressing Enter in the input
    plantInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') btnSetPlant.click();
    });
}

function showPlantInfo(plant) {
    plantNameDisplay.textContent   = plant.display;
    plantThreshDisplay.textContent = plant.threshold + "%";
    plantRangeDisplay.textContent  = plant.range;
    plantInfo.style.display        = "block";
}

function showPlantFeedback(msg, type) {
    plantFeedback.textContent  = msg;
    plantFeedback.className    = `plant-feedback plant-feedback-${type}`;
    // Clear after 4 seconds
    setTimeout(() => {
        plantFeedback.textContent = "";
        plantFeedback.className   = "plant-feedback";
    }, 4000);
}


// -------- UI Updates --------
function updateUI() {

    moistureValueEl.textContent = currentMoisture;
    moistureProgressEl.style.width = currentMoisture + "%";

    // Color based on dynamic threshold
    if (currentMoisture < currentThreshold) {
        moistureProgressEl.style.backgroundColor = 'red';
    } else if (currentMoisture > 80) {
        moistureProgressEl.style.backgroundColor = '#0288d1';
    } else {
        moistureProgressEl.style.backgroundColor = '#4caf50';
    }

    if (isMotorOn) {
        motorStatusTextEl.textContent    = "ON";
        motorStatusTextEl.className      = "status-on";
        wateringStatusTextEl.textContent = "Active";
        wateringStatusTextEl.className   = "status-active";
        btnStart.disabled  = true;
        btnStop.disabled   = false;
        controlFeedback.textContent = "Irrigation Running";
    } else {
        motorStatusTextEl.textContent    = "OFF";
        motorStatusTextEl.className      = "status-off";
        wateringStatusTextEl.textContent = "Inactive";
        wateringStatusTextEl.className   = "status-inactive";
        btnStart.disabled  = false;
        btnStop.disabled   = true;
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
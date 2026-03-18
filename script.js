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
    "tomato":     { threshold: 60, stopAt: 80, range: "60–80%",  display: "Tomato"     },
    "cactus":     { threshold: 10, stopAt: 20, range: "10–20%",  display: "Cactus"     },
    "rose":       { threshold: 50, stopAt: 70, range: "50–70%",  display: "Rose"       },
    "fern":       { threshold: 70, stopAt: 90, range: "70–90%",  display: "Fern"       },
    "wheat":      { threshold: 40, stopAt: 60, range: "40–60%",  display: "Wheat"      },
    "lettuce":    { threshold: 65, stopAt: 80, range: "65–80%",  display: "Lettuce"    },
    "mint":       { threshold: 55, stopAt: 75, range: "55–75%",  display: "Mint"       },
    "aloe vera":  { threshold: 15, stopAt: 30, range: "15–30%",  display: "Aloe Vera"  },
    "orchid":     { threshold: 45, stopAt: 65, range: "45–65%",  display: "Orchid"     },
    "sunflower":  { threshold: 35, stopAt: 55, range: "35–55%",  display: "Sunflower"  }
};


// -------- System State --------
let isMotorOn = false;
let currentMoisture = 0;
let currentThreshold = 30; 
let chartInstance = null;
const maxDataPoints = 15;
let selectedPlantKey = null; // Track selection in overlay


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

// Selection View Elements
const selectionView       = document.getElementById('selection-view');
const dashboardView       = document.getElementById('dashboard-view');
const plantCards          = document.querySelectorAll('.plant-card');
const btnEnterDashboard   = document.getElementById('btn-enter-dashboard');
const btnChangePlant      = document.getElementById('btn-change-plant');

// Dashboard Info Display
const plantNameDisplay    = document.getElementById('plant-name-display');
const plantRangeDisplay   = document.getElementById('plant-range-display');


// -------- Initialization --------
document.addEventListener('DOMContentLoaded', () => {
    initChart();
    updateTimestamp();
    setupViewLogic();
    listenToFirebase();
});


// -------- View & Selection Logic --------
function setupViewLogic() {
    // 1. Plant Card Selection
    plantCards.forEach(card => {
        card.addEventListener('click', () => {
            // Remove active from others
            plantCards.forEach(c => c.classList.remove('active'));
            // Set active
            card.classList.add('active');
            selectedPlantKey = card.dataset.plant;
            btnEnterDashboard.disabled = false;
        });
    });

    // 2. Enter Dashboard Button
    btnEnterDashboard.addEventListener('click', () => {
        if (!selectedPlantKey) return;
        
        const plant = plantThresholds[selectedPlantKey];
        if (plant) {
            // Write to Firebase
            set(ref(db, "irrigation/threshold"), plant.threshold);
            set(ref(db, "irrigation/stopThreshold"), plant.stopAt);
            set(ref(db, "irrigation/plant"), plant.display);
            
            // UI Transition
            showDashboard();
        }
    });

    // 3. Change Plant Button (Dashboard Nav)
    btnChangePlant.addEventListener('click', () => {
        showSelection();
    });
}

function showDashboard() {
    selectionView.classList.add('hidden');
    setTimeout(() => {
        selectionView.style.display = 'none';
        dashboardView.style.display = 'block';
        btnChangePlant.style.display = 'block';
        // Trigger resize for chart
        if (chartInstance) chartInstance.resize();
    }, 500);
}

function showSelection() {
    selectionView.style.display = 'flex';
    setTimeout(() => {
        selectionView.classList.remove('hidden');
    }, 10);
}


// -------- Listen to Firebase --------
function listenToFirebase() {
    // Data Listeners
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

    const thresholdRef = ref(db, "irrigation/threshold");
    onValue(thresholdRef, (snapshot) => {
        const val = snapshot.val();
        if (val !== null && !isNaN(Number(val))) {
            currentThreshold = Number(val);
        }
        updateUI();
    });

    // PERSISTENCE: Sync saved plant info if it exists
    const plantRef = ref(db, "irrigation/plant");
    onValue(plantRef, (snapshot) => {
        const savedPlant = snapshot.val();
        if (savedPlant) {
            const key = savedPlant.toLowerCase();
            if (plantThresholds[key]) {
                const plant = plantThresholds[key];
                plantNameDisplay.textContent = plant.display;
                plantRangeDisplay.textContent = plant.range;
                
                // Note: We no longer auto-jump to dashboard on load.
                // The selection screen stays visible until the user clicks Enter.
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
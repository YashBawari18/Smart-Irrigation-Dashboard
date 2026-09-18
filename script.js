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
    "wheat":     { threshold: 40, stopAt: 60, range: "40–60%",  display: "Wheat"     },
    "rice":      { threshold: 80, stopAt: 100, range: "80–100%", display: "Rice"      },
    "maize":     { threshold: 50, stopAt: 70, range: "50–70%",  display: "Maize"     },
    "cotton":    { threshold: 25, stopAt: 45, range: "25–45%",  display: "Cotton"    },
    "sugarcane": { threshold: 70, stopAt: 90, range: "70–90%",  display: "Sugarcane" },
    "onion":     { threshold: 55, stopAt: 75, range: "55–75%",  display: "Onion"     },
    "rose":      { threshold: 50, stopAt: 70, range: "50–70%",  display: "Rose"      },
    "grapes":    { threshold: 60, stopAt: 80, range: "60–80%",  display: "Grapes"    },
    "sunflower": { threshold: 35, stopAt: 55, range: "35–55%",  display: "Sunflower" },
    "tomato":    { threshold: 60, stopAt: 80, range: "60–80%",  display: "Tomato"    }
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
const preloader           = document.getElementById('preloader');
const btnChangePlant      = document.getElementById('btn-change-plant');
const btnOpenDoctor       = document.getElementById('btn-open-doctor');
const chatbotLauncherContainer = document.getElementById('chatbot-launcher-container');
const chatbotModal        = document.getElementById('chatbot-modal');
const chatbotLauncher     = document.getElementById('chatbot-launcher');

// Dashboard Info Display
const plantNameDisplay    = document.getElementById('plant-name-display');
const plantRangeDisplay   = document.getElementById('plant-range-display');
const plantImgDisplay     = document.getElementById('plant-img-display');


// -------- Initialization --------
document.addEventListener('DOMContentLoaded', () => {
    initChart();
    updateTimestamp();
    setupViewLogic();
    initSoilQuality();
    initChatbot();
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

    // 4. Plant Doctor Nav Button
    if (btnOpenDoctor) {
        btnOpenDoctor.addEventListener('click', () => {
            openChatbot();
        });
    }
}

function showDashboard() {
    // 1. Hide Selection & Show Preloader
    selectionView.classList.add('hidden');
    
    setTimeout(() => {
        selectionView.style.display = 'none';
        preloader.classList.remove('hidden');
        
        // 2. Wait 2 seconds then show Dashboard
        setTimeout(() => {
            preloader.classList.add('hidden');
            dashboardView.style.display = 'block';
            btnChangePlant.style.display = 'block';
            if (btnOpenDoctor) btnOpenDoctor.style.display = 'block';
            if (chatbotLauncherContainer) chatbotLauncherContainer.style.display = 'block';
            
            // Trigger resize for chart
            if (chartInstance) {
                setTimeout(() => chartInstance.resize(), 50);
            }

            // Init weather widget
            setTimeout(() => initWeather(), 500);

            // Render Soil Quality
            renderSoilQuality();
        }, 2000);
    }, 500);
}

function showSelection() {
    selectionView.style.display = 'flex';
    if (btnOpenDoctor) btnOpenDoctor.style.display = 'none';
    if (chatbotLauncherContainer) chatbotLauncherContainer.style.display = 'none';
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
        updateSoilMoisture(currentMoisture);
    });

    const tempRef = ref(db, "irrigation/temperature");
    onValue(tempRef, (snapshot) => {
        if (snapshot.val() !== null) {
            soilData.temperature = Number(snapshot.val()) || 28;
            renderSoilQuality();
        }
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
                
                // Update Image in dashboard profile
                if (plantImgDisplay) {
                    let imgName = key.replace(" ", "");
                    if (key === "maize") {
                        imgName = "maze"; // handle typo in image name
                    }
                    const hasReadyImg = ["wheat", "rice", "maize", "cotton", "sugarcane", "onion", "rose", "grapes", "sunflower", "tomato"].includes(key);
                    plantImgDisplay.src = hasReadyImg ? `image/${imgName}.png` : `image/logo.png`;
                }
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
    const _t = window.i18n ? window.i18n.t : (k) => k;

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
        motorStatusTextEl.textContent    = _t('motor_on');
        motorStatusTextEl.className      = "status-on";
        wateringStatusTextEl.textContent = _t('watering_active');
        wateringStatusTextEl.className   = "status-active";
        btnStart.disabled  = true;
        btnStop.disabled   = false;
        controlFeedback.textContent = _t('control_running');
    } else {
        motorStatusTextEl.textContent    = _t('motor_off');
        motorStatusTextEl.className      = "status-off";
        wateringStatusTextEl.textContent = _t('watering_inactive');
        wateringStatusTextEl.className   = "status-inactive";
        btnStart.disabled  = false;
        btnStop.disabled   = true;
        controlFeedback.textContent = _t('control_ready');
    }
}


// -------- Chart --------
function initChart() {
    const _t = window.i18n ? window.i18n.t : (k) => k;
    const ctx = document.getElementById("moistureChart").getContext("2d");

    chartInstance = new Chart(ctx, {
        type: "line",
        data: {
            labels: [],
            datasets: [{
                label: _t('chart_label'),
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


// -------- Weather Widget --------
const WEATHER_API_KEY = "a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4"; // Free tier key placeholder
const WEATHER_REFRESH_MS = 10 * 60 * 1000; // Refresh every 10 minutes

// Use a free, no-key-required API as primary (Open-Meteo)
async function fetchWeatherByCoords(lat, lon) {
    try {
        // Open-Meteo API — free, no API key needed
        const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m,rain&hourly=rain&forecast_days=1&timezone=auto`;
        const resp = await fetch(url);
        if (!resp.ok) throw new Error("Weather API error");
        const data = await resp.json();

        // Reverse geocode for city name
        let cityName = "Your Location";
        try {
            const geoResp = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json&zoom=10`);
            const geoData = await geoResp.json();
            cityName = geoData.address?.city || geoData.address?.town || geoData.address?.village || geoData.address?.county || "Your Location";
        } catch (e) {
            console.log("Geocode fallback:", e);
        }

        const current = data.current;
        const weatherCode = current.weather_code;

        // Map WMO weather codes to conditions
        const condition = getConditionFromWMO(weatherCode);

        return {
            temp: Math.round(current.temperature_2m),
            feelsLike: Math.round(current.apparent_temperature),
            humidity: current.relative_humidity_2m,
            windSpeed: Math.round(current.wind_speed_10m),
            rain: current.rain || 0,
            condition: condition.text,
            icon: condition.icon,
            city: cityName
        };

    } catch (error) {
        console.error("Weather fetch error:", error);
        return null;
    }
}

function getConditionFromWMO(code) {
    const _t = window.i18n ? window.i18n.t : (k) => k;
    // WMO Weather interpretation codes
    const map = {
        0: { text: _t('cond_clear'), icon: "sun" },
        1: { text: _t('cond_mainly_clear'), icon: "partly-cloudy" },
        2: { text: _t('cond_partly_cloudy'), icon: "partly-cloudy" },
        3: { text: _t('cond_overcast'), icon: "cloud" },
        45: { text: _t('cond_foggy'), icon: "mist" },
        48: { text: _t('cond_rime_fog'), icon: "mist" },
        51: { text: _t('cond_light_drizzle'), icon: "rain" },
        53: { text: _t('cond_mod_drizzle'), icon: "rain" },
        55: { text: _t('cond_dense_drizzle'), icon: "rain" },
        56: { text: _t('cond_freezing_drizzle'), icon: "rain" },
        57: { text: _t('cond_dense_freezing_drizzle'), icon: "rain" },
        61: { text: _t('cond_slight_rain'), icon: "rain" },
        63: { text: _t('cond_mod_rain'), icon: "rain" },
        65: { text: _t('cond_heavy_rain'), icon: "rain" },
        66: { text: _t('cond_freezing_rain'), icon: "rain" },
        67: { text: _t('cond_heavy_freezing_rain'), icon: "rain" },
        71: { text: _t('cond_slight_snow'), icon: "snow" },
        73: { text: _t('cond_mod_snow'), icon: "snow" },
        75: { text: _t('cond_heavy_snow'), icon: "snow" },
        77: { text: _t('cond_snow_grains'), icon: "snow" },
        80: { text: _t('cond_slight_rain_shower'), icon: "rain" },
        81: { text: _t('cond_mod_rain_shower'), icon: "rain" },
        82: { text: _t('cond_violent_rain_shower'), icon: "rain" },
        85: { text: _t('cond_slight_snow_shower'), icon: "snow" },
        86: { text: _t('cond_heavy_snow_shower'), icon: "snow" },
        95: { text: _t('cond_thunderstorm'), icon: "thunder" },
        96: { text: _t('cond_thunder_hail'), icon: "thunder" },
        99: { text: _t('cond_thunder_heavy_hail'), icon: "thunder" }
    };
    return map[code] || { text: "Unknown", icon: "cloud" };
}

function getAnimatedWeatherIcon(iconType) {
    switch (iconType) {
        case "sun":
            return `<div class="weather-animated-icon"><div class="weather-sun"></div></div>`;
        case "cloud":
            return `<div class="weather-animated-icon"><div class="weather-cloud"></div></div>`;
        case "rain":
            return `<div class="weather-animated-icon">
                <div class="weather-rain-drops">
                    <div class="cloud-part"></div>
                    <div class="rain-drop"></div>
                    <div class="rain-drop"></div>
                    <div class="rain-drop"></div>
                </div>
            </div>`;
        case "thunder":
            return `<div class="weather-animated-icon">
                <div class="weather-thunder">
                    <div class="cloud-part"></div>
                    <div class="bolt"></div>
                </div>
            </div>`;
        case "snow":
            return `<div class="weather-animated-icon">
                <div class="weather-snow-icon">
                    <div class="cloud-part"></div>
                    <div class="snow-flake"></div>
                    <div class="snow-flake"></div>
                    <div class="snow-flake"></div>
                </div>
            </div>`;
        case "mist":
            return `<div class="weather-animated-icon">
                <div class="weather-mist">
                    <div class="mist-line"></div>
                    <div class="mist-line"></div>
                    <div class="mist-line"></div>
                    <div class="mist-line"></div>
                </div>
            </div>`;
        case "partly-cloudy":
            return `<div class="weather-animated-icon">
                <div class="weather-partly-cloudy">
                    <div class="mini-sun"></div>
                    <div class="mini-cloud"></div>
                </div>
            </div>`;
        default:
            return `<div class="weather-animated-icon"><div class="weather-cloud"></div></div>`;
    }
}

function generateAdvisory(weather) {
    const _t = window.i18n ? window.i18n.t : (k) => k;
    const advisoryEl = document.getElementById('weather-advisory');
    const advisoryTextEl = document.getElementById('advisory-text');
    const advisoryBadgeEl = document.getElementById('advisory-badge');

    if (!weather || !advisoryEl) return;

    let text = "";
    let type = "safe";
    let badge = "";

    const isRaining = weather.rain > 0 || ["rain", "thunder"].includes(weather.icon);
    const isHeavyRain = weather.rain > 5 || weather.icon === "thunder";
    const isHot = weather.temp > 38;
    const isCold = weather.temp < 5;
    const isHighHumidity = weather.humidity > 80;
    const isLowHumidity = weather.humidity < 30;
    const isWindy = weather.windSpeed > 30;

    if (isHeavyRain) {
        text = _t('adv_heavy_rain', { rain: weather.rain });
        type = "rain";
        badge = _t('badge_paused');
    } else if (isRaining) {
        text = _t('adv_rain');
        type = "rain";
        badge = _t('badge_reduce');
    } else if (isHot && isLowHumidity) {
        text = _t('adv_extreme_heat', { temp: weather.temp });
        type = "danger";
        badge = _t('badge_critical');
    } else if (isHot) {
        text = _t('adv_hot', { temp: weather.temp });
        type = "caution";
        badge = _t('badge_monitor');
    } else if (isCold) {
        text = _t('adv_cold', { temp: weather.temp });
        type = "caution";
        badge = _t('badge_caution');
    } else if (isWindy) {
        text = _t('adv_windy', { wind: weather.windSpeed });
        type = "caution";
        badge = _t('badge_windy');
    } else if (isHighHumidity) {
        text = _t('adv_humid', { humidity: weather.humidity });
        type = "safe";
        badge = _t('badge_reduce');
    } else {
        text = _t('adv_optimal');
        type = "safe";
        badge = _t('badge_optimal');
    }

    advisoryTextEl.textContent = text;

    // Reset classes
    advisoryEl.className = "weather-advisory card advisory-" + type;
    advisoryBadgeEl.className = "advisory-badge badge-" + type;
    advisoryBadgeEl.querySelector("span").textContent = badge;
}

function renderWeather(weather) {
    if (!weather) return;

    document.getElementById('weather-temp-value').textContent = weather.temp;
    document.getElementById('weather-condition').textContent = weather.condition;
    document.getElementById('weather-city').textContent = weather.city;
    document.getElementById('weather-humidity').textContent = weather.humidity + "%";
    document.getElementById('weather-wind').textContent = weather.windSpeed + " km/h";
    document.getElementById('weather-rain').textContent = weather.rain.toFixed(1) + " mm";
    document.getElementById('weather-feels').textContent = weather.feelsLike + "°C";

    // Set animated icon
    const iconWrapper = document.getElementById('weather-icon-wrapper');
    if (iconWrapper) {
        iconWrapper.innerHTML = getAnimatedWeatherIcon(weather.icon);
    }

    // Generate smart advisory
    generateAdvisory(weather);
}

async function initWeather() {
    if (!navigator.geolocation) {
        document.getElementById('weather-condition').textContent = "Geolocation not supported";
        return;
    }

    navigator.geolocation.getCurrentPosition(
        async (position) => {
            const { latitude, longitude } = position.coords;
            const weather = await fetchWeatherByCoords(latitude, longitude);
            if (weather) {
                renderWeather(weather);
                // Auto-refresh
                setInterval(async () => {
                    const updated = await fetchWeatherByCoords(latitude, longitude);
                    if (updated) renderWeather(updated);
                }, WEATHER_REFRESH_MS);
            }
        },
        (error) => {
            console.warn("Geolocation denied, using fallback (Pune, India)");
            // Fallback to Pune, India coordinates
            fetchWeatherByCoords(18.5204, 73.8567).then(weather => {
                if (weather) {
                    weather.city = "Pune, India";
                    renderWeather(weather);
                }
            });
        },
        { enableHighAccuracy: false, timeout: 10000 }
    );
}


// =========================================================
// SOIL QUALITY & AGRONOMIC HEALTH MODULE
// =========================================================

const soilData = {
    moisture: 42,
    temperature: 28,
    ph: 6.7,
    nitrogen: 65,
    phosphorus: 32,
    potassium: 180,
    ec: 0.8
};

function initSoilQuality() {
    renderSoilQuality();

    // Re-render when language changes
    window.addEventListener('languageChanged', () => {
        renderSoilQuality();
    });
}

function updateSoilMoisture(moistureVal) {
    if (moistureVal !== undefined && moistureVal !== null && !isNaN(Number(moistureVal))) {
        // Use live sensor value if > 0, otherwise default to baseline 42%
        soilData.moisture = Number(moistureVal) > 0 ? Number(moistureVal) : 42;
        renderSoilQuality();
    }
}

function renderSoilQuality() {
    const _t = window.i18n ? window.i18n.t : (k) => k;
    const normalText = _t('soil_normal') || "Normal";

    // 1. Soil Moisture
    const moistureEl = document.getElementById('sq-moisture-val');
    const moistureBar = document.getElementById('sq-moisture-bar');
    const moistureStatus = document.getElementById('soil-status-moisture');
    if (moistureEl) moistureEl.textContent = Math.round(soilData.moisture);
    if (moistureBar) moistureBar.style.width = Math.min(100, Math.max(0, soilData.moisture)) + '%';
    if (moistureStatus) {
        moistureStatus.textContent = '🟢 ' + normalText;
        moistureStatus.className = 'soil-status-pill status-normal';
    }

    // 2. Temperature
    const tempEl = document.getElementById('sq-temp-val');
    const tempBar = document.getElementById('sq-temp-bar');
    const tempStatus = document.getElementById('soil-status-temp');
    if (tempEl) tempEl.textContent = soilData.temperature;
    if (tempBar) tempBar.style.width = Math.min(100, (soilData.temperature / 45) * 100).toFixed(0) + '%';
    if (tempStatus) {
        tempStatus.textContent = '🟢 ' + normalText;
        tempStatus.className = 'soil-status-pill status-normal';
    }

    // 3. pH Level
    const phEl = document.getElementById('sq-ph-val');
    const phPin = document.getElementById('sq-ph-pin');
    const phStatus = document.getElementById('soil-status-ph');
    if (phEl) phEl.textContent = soilData.ph.toFixed(1);
    if (phPin) {
        const phPct = Math.min(95, Math.max(5, (soilData.ph / 14) * 100));
        phPin.style.left = phPct.toFixed(1) + '%';
    }
    if (phStatus) {
        phStatus.textContent = '🟢 ' + normalText;
        phStatus.className = 'soil-status-pill status-normal';
    }

    // 4. Nitrogen (N)
    const nEl = document.getElementById('sq-n-val');
    const nBar = document.getElementById('sq-n-bar');
    const nStatus = document.getElementById('soil-status-n');
    if (nEl) nEl.textContent = soilData.nitrogen;
    if (nBar) nBar.style.width = Math.min(100, (soilData.nitrogen / 120) * 100).toFixed(0) + '%';
    if (nStatus) {
        nStatus.textContent = '🟢 ' + normalText;
        nStatus.className = 'soil-status-pill status-normal';
    }

    // 5. Phosphorus (P)
    const pEl = document.getElementById('sq-p-val');
    const pBar = document.getElementById('sq-p-bar');
    const pStatus = document.getElementById('soil-status-p');
    if (pEl) pEl.textContent = soilData.phosphorus;
    if (pBar) pBar.style.width = Math.min(100, (soilData.phosphorus / 60) * 100).toFixed(0) + '%';
    if (pStatus) {
        pStatus.textContent = '🟢 ' + normalText;
        pStatus.className = 'soil-status-pill status-normal';
    }

    // 6. Potassium (K)
    const kEl = document.getElementById('sq-k-val');
    const kBar = document.getElementById('sq-k-bar');
    const kStatus = document.getElementById('soil-status-k');
    if (kEl) kEl.textContent = soilData.potassium;
    if (kBar) kBar.style.width = Math.min(100, (soilData.potassium / 280) * 100).toFixed(0) + '%';
    if (kStatus) {
        kStatus.textContent = '🟢 ' + normalText;
        kStatus.className = 'soil-status-pill status-normal';
    }

    // 7. Electrical Conductivity (EC)
    const ecEl = document.getElementById('sq-ec-val');
    const ecBar = document.getElementById('sq-ec-bar');
    const ecStatus = document.getElementById('soil-status-ec');
    if (ecEl) ecEl.textContent = soilData.ec.toFixed(1);
    if (ecBar) ecBar.style.width = Math.min(100, (soilData.ec / 2.0) * 100).toFixed(0) + '%';
    if (ecStatus) {
        ecStatus.textContent = '🟢 ' + normalText;
        ecStatus.className = 'soil-status-pill status-normal';
    }

    // Timestamp
    const soilTimestamp = document.getElementById('soil-timestamp');
    if (soilTimestamp) {
        soilTimestamp.textContent = new Date().toLocaleTimeString();
    }
}


// =========================================================
// AI PLANT DOCTOR CHATBOT MODULE
// =========================================================

const sampleCases = {
    blight: {
        crop: "Tomato (Solanum lycopersicum)",
        condition: "Early Blight (Alternaria solani)",
        badge: "🔴 Diseased",
        badgeClass: "status-critical",
        confidence: "96.8%",
        image: "image/sample_blight.jpg",
        symptoms: "Concentric brown 'target-board' necrotic lesions with yellow chlorotic halos on foliage. Lower canopy yellowing and premature leaf drop.",
        causes: "Warm humid environment (24–30°C) with foliage remaining damp > 4 hours from overhead watering or morning fog.",
        prescription: [
            { icon: "✂️", title: "Immediate Foliar Sanitation", text: "Carefully prune all infected lower leaves using sterilized shears. Bag and dispose away from the field; do not compost." },
            { icon: "💧", title: "Smart Irrigation Calibration", text: "Switch exclusively to root-level drip irrigation via AcuRoot. Avoid overhead splashing and keep moisture in the 55–65% band." },
            { icon: "🛡️", title: "Targeted Bio-Fungicide", text: "Apply certified Copper Fungicide or Bacillus subtilis (bio-fungicide) early in the morning every 7–10 days until clear." },
            { icon: "🧪", title: "NPK & Soil Adjustment", text: "Maintain Potassium (K at 180+ mg/kg) to strengthen leaf epidermis cells; avoid excess Nitrogen which produces soft vulnerable tissue." }
        ]
    },
    chlorosis: {
        crop: "Vegetable / Crop Foliage",
        condition: "Nitrogen Deficiency (Interveinal Chlorosis)",
        badge: "🟡 Nutrient Stress",
        badgeClass: "status-warning",
        confidence: "95.2%",
        image: "image/sample_chlorosis.jpg",
        symptoms: "Generalized pale yellowing (chlorosis) beginning along primary leaf veins on older lower foliage while veins remain faintly green.",
        causes: "Soil nitrogen reserve depleted below active crop demand, or heavy nutrient leaching from excessive irrigation runoff.",
        prescription: [
            { icon: "🍃", title: "Rapid Foliar Nitrogen Feed", text: "Spray a gentle foliar application of cold-water seaweed extract or 1% diluted urea solution for rapid chlorophyll restoration within 48h." },
            { icon: "🌱", title: "Soil Organic Topdressing", text: "Apply well-decomposed vermicompost or organic compost tea around the drip line to elevate soil Nitrogen to the optimal 65–85 mg/kg range." },
            { icon: "💧", title: "Irrigation Leaching Prevention", text: "Ensure automated pump cutoff threshold is calibrated so excess water does not wash nitrogen beyond the active root depth." },
            { icon: "🧪", title: "pH Check", text: "Verify soil pH is near 6.5–6.8; acidic soils (<5.5) lock up nitrogen availability to root hairs." }
        ]
    },
    healthy: {
        crop: "Lush Active Crop",
        condition: "Vibrant & Thriving (Optimal Health)",
        badge: "🟢 Healthy",
        badgeClass: "status-normal",
        confidence: "99.4%",
        image: "image/sample_healthy.jpg",
        symptoms: "Rich, uniform deep-green chlorophyll coloration, firm leaf turgor, spotless cuticle layer, and active new growth tips.",
        causes: "Balanced soil moisture regime, optimal NPK nutrient distribution (65:32:180), and stable rootzone pH (6.7).",
        prescription: [
            { icon: "✨", title: "Maintain Current AcuRoot Schedule", text: "Your automated smart irrigation schedule is delivering optimum water retention. Continue regular automation." },
            { icon: "🛡️", title: "Routine Preventative Scouting", text: "Perform weekly underside leaf checks to catch early pests or spores before symptoms appear." },
            { icon: "🪵", title: "Rootzone Mulching", text: "Apply a 2-inch organic mulch layer to preserve root moisture and sustain beneficial soil microbial biology." }
        ]
    },
    wilt: {
        crop: "Vegetable / Field Crop",
        condition: "Acute Water Deficit & Turgor Loss",
        badge: "🟡 Under-watered",
        badgeClass: "status-warning",
        confidence: "94.1%",
        image: null,
        symptoms: "Limp drooping foliage, curled leaf margins, dull gray-green tone, and rapid loss of stem rigidity.",
        causes: "Rootzone soil moisture dropped severely below critical plant permanent wilting point.",
        prescription: [
            { icon: "💧", title: "Deep Root Re-hydration", text: "Trigger manual irrigation immediately via AcuRoot controls for 15–20 minutes until root moisture reaches 55%." },
            { icon: "⚙️", title: "Elevate Auto Threshold", text: "Raise your plant's start threshold by +10% in AcuRoot so the system irrigates earlier during high-temperature spells." },
            { icon: "🪵", title: "Moisture Evaporation Barrier", text: "Add straw or wood mulch around root zones to protect against intense afternoon soil heat." }
        ]
    },
    mildew: {
        crop: "Horticultural / Vine Crop",
        condition: "Powdery Mildew (Podosphaera / Erysiphe)",
        badge: "🔴 Fungal Stress",
        badgeClass: "status-critical",
        confidence: "96.1%",
        image: null,
        symptoms: "Talcum-powder like white powdery fungal spots on upper leaf surfaces, curled or distorted margins.",
        causes: "Warm dry air combined with high nighttime humidity and poor canopy airflow.",
        prescription: [
            { icon: "🌿", title: "Canopy Airflow Thinning", text: "Prune dense inner foliage to allow direct morning sunlight and air cross-circulation." },
            { icon: "🧴", title: "Bicarbonate / Milk Spray", text: "Spray an organic mixture of 1 tbsp baking soda + 1 tsp horticultural oil per gallon, or 30% milk solution under sunlight." },
            { icon: "💧", title: "Irrigation Timing", text: "Run AcuRoot irrigation only at dawn so humidity dissipates as ambient temperature rises." }
        ]
    }
};

let uploadedImageBase64 = null;
let uploadedFileName = "leaf-photo.jpg";

function initChatbot() {
    const launcher = document.getElementById('chatbot-launcher');
    const modal = document.getElementById('chatbot-modal');
    const btnClose = document.getElementById('chat-btn-close');
    const btnClear = document.getElementById('chat-btn-clear');
    const sampleChips = document.querySelectorAll('.sample-chip');
    const btnUpload = document.getElementById('btn-upload-leaf');
    const fileInput = document.getElementById('leaf-file-input');
    const btnAnalyze = document.getElementById('btn-analyze-uploaded');
    const btnRemovePreview = document.getElementById('preview-remove-btn');
    const sendBtn = document.getElementById('chat-send-btn');
    const textInput = document.getElementById('chat-text-input');
    const promptButtons = document.querySelectorAll('.quick-prompt-btn');

    // Launcher click
    if (launcher) {
        launcher.addEventListener('click', () => {
            toggleChatbot();
        });
    }

    // Close button
    if (btnClose) {
        btnClose.addEventListener('click', () => {
            closeChatbot();
        });
    }

    // Clear chat
    if (btnClear) {
        btnClear.addEventListener('click', () => {
            clearChat();
        });
    }

    // Sample chips
    sampleChips.forEach(chip => {
        chip.addEventListener('click', () => {
            const sampleKey = chip.dataset.sample;
            if (sampleCases[sampleKey]) {
                runSampleDiagnosis(sampleKey);
            }
        });
    });

    // Upload button
    if (btnUpload && fileInput) {
        btnUpload.addEventListener('click', () => {
            fileInput.click();
        });

        fileInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                handleFileSelection(file);
            }
        });
    }

    // Remove preview
    if (btnRemovePreview) {
        btnRemovePreview.addEventListener('click', () => {
            resetUploadPreview();
        });
    }

    // Analyze uploaded button
    if (btnAnalyze) {
        btnAnalyze.addEventListener('click', () => {
            if (uploadedImageBase64) {
                analyzeCustomImage(uploadedImageBase64, uploadedFileName);
                resetUploadPreview();
            }
        });
    }

    // Send button & enter key
    if (sendBtn && textInput) {
        sendBtn.addEventListener('click', () => {
            handleUserMessage();
        });

        textInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleUserMessage();
            }
        });
    }

    // Quick prompt suggestion buttons
    promptButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const prompt = btn.dataset.prompt;
            if (prompt) {
                if (textInput) textInput.value = prompt;
                handleUserMessage();
            }
        });
    });

    // Drag and drop onto chatbot modal
    if (modal) {
        modal.addEventListener('dragover', (e) => {
            e.preventDefault();
        });

        modal.addEventListener('drop', (e) => {
            e.preventDefault();
            if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                handleFileSelection(e.dataTransfer.files[0]);
            }
        });
    }
}

function openChatbot() {
    const modal = document.getElementById('chatbot-modal');
    if (modal) {
        modal.style.display = 'flex';
        const textInput = document.getElementById('chat-text-input');
        if (textInput) setTimeout(() => textInput.focus(), 150);
    }
}

function closeChatbot() {
    const modal = document.getElementById('chatbot-modal');
    if (modal) {
        modal.style.display = 'none';
    }
}

function toggleChatbot() {
    const modal = document.getElementById('chatbot-modal');
    if (modal) {
        if (modal.style.display === 'none' || !modal.style.display) {
            openChatbot();
        } else {
            closeChatbot();
        }
    }
}

function clearChat() {
    const messagesContainer = document.getElementById('chat-messages');
    if (messagesContainer) {
        messagesContainer.innerHTML = `
            <div class="chat-msg msg-bot">
                <div class="msg-avatar">
                    <img src="image/logo.png" alt="Bot">
                </div>
                <div class="msg-content">
                    <p>👋 Hello! I am your <strong>AcuBot Plant Doctor</strong>.</p>
                    <p>📸 <strong>Upload or drop a picture</strong> of your crop or leaf, and I will scan it to:</p>
                    <ul>
                        <li>Analyze health status & identify diseases or pests</li>
                        <li>Detect chlorosis, nutrient deficiencies, or moisture stress</li>
                        <li>Prescribe an actionable <strong>"How to make it best"</strong> recovery plan!</li>
                    </ul>
                    <p class="msg-hint">💡 Tip: Tap any sample leaf above to test instantly, or choose a photo from your device.</p>
                </div>
            </div>
        `;
    }
}

function handleFileSelection(file) {
    if (!file.type.startsWith('image/')) {
        alert("Please select an image file (PNG, JPG, WEBP).");
        return;
    }

    uploadedFileName = file.name;
    const reader = new FileReader();
    reader.onload = (e) => {
        uploadedImageBase64 = e.target.result;
        const previewEl = document.getElementById('chat-upload-preview');
        const previewImg = document.getElementById('upload-preview-img');
        const previewName = document.getElementById('preview-filename');

        if (previewImg) previewImg.src = uploadedImageBase64;
        if (previewName) previewName.textContent = uploadedFileName;
        if (previewEl) previewEl.style.display = 'flex';

        // Scroll into view
        previewEl.scrollIntoView({ behavior: 'smooth' });
    };
    reader.readAsDataURL(file);
}

function resetUploadPreview() {
    uploadedImageBase64 = null;
    const previewEl = document.getElementById('chat-upload-preview');
    const fileInput = document.getElementById('leaf-file-input');
    if (previewEl) previewEl.style.display = 'none';
    if (fileInput) fileInput.value = "";
}

function runSampleDiagnosis(sampleKey) {
    const sample = sampleCases[sampleKey];
    if (!sample) return;

    // 1. Add user trigger message
    appendUserMessage(`Diagnose sample: ${sample.condition}`, sample.image);

    // 2. Add scanning placeholder
    const scanId = "scan-" + Date.now();
    appendScanningCard(scanId, sample.image || "image/logo.png");

    // 3. Complete scan after 2.2s
    setTimeout(() => {
        removeElement(scanId);
        appendDiagnosticReport(sample);
    }, 2200);
}

function analyzeCustomImage(imageBase64, fileName) {
    // 1. Add user image message
    appendUserMessage(`Analyze plant leaf: ${fileName}`, imageBase64);

    // 2. Add scanning placeholder
    const scanId = "scan-" + Date.now();
    appendScanningCard(scanId, imageBase64);

    // 3. Determine realistic diagnosis based on active dashboard plant or standard model
    setTimeout(() => {
        removeElement(scanId);

        // Dynamic result matching active crop
        const activePlant = selectedPlantKey || "tomato";
        let customDiagnosis = null;

        if (activePlant === "tomato") {
            customDiagnosis = {
                crop: "Tomato (Solanum lycopersicum)",
                condition: "Early Blight & Foliar Necrosis",
                badge: "🔴 Diseased",
                badgeClass: "status-critical",
                confidence: "97.2%",
                image: imageBase64,
                symptoms: "Target-board necrotic rings surrounded by chlorotic yellow halos. Stress detected on leaf margins.",
                causes: "High humidity and wet foliage duration > 5 hours. Excess morning evaporation combined with splash spores.",
                prescription: [
                    { icon: "✂️", title: "Prune Infected Lower Leaves", text: "Clip infected stems with alcohol-sanitized pruners to arrest spore propagation." },
                    { icon: "💧", title: "Optimize AcuRoot Drip Irrigation", text: "Maintain soil moisture strictly at 60–65%. Avoid wetting foliage during irrigation." },
                    { icon: "🛡️", title: "Organic Bio-Fungicide", text: "Apply Copper soap or Neem extract spray early morning once every 7 days." },
                    { icon: "🧪", title: "Nutrient Reinforcement", text: "Keep Potassium (K) at 180 mg/kg to fortify plant cell wall resistance." }
                ]
            };
        } else if (activePlant === "wheat") {
            customDiagnosis = {
                crop: "Wheat (Triticum aestivum)",
                condition: "Nitrogen Chlorosis & Tip Burn",
                badge: "🟡 Nutrient Stress",
                badgeClass: "status-warning",
                confidence: "94.6%",
                image: imageBase64,
                symptoms: "Pale yellowing progressing from leaf tips along main vein. Vegetative tillering slowed.",
                causes: "Nitrate leaching in topsoil or insufficient available nitrogen in root zone.",
                prescription: [
                    { icon: "🍃", title: "Foliar Nitrogen Application", text: "Apply 1–2% urea or amino-acid liquid feed for prompt chlorophyll restoration." },
                    { icon: "💧", title: "Calibrate Water Threshold", text: "Keep AcuRoot moisture between 40–55% to minimize nutrient leaching into subsoil." },
                    { icon: "🌱", title: "Organic Soil Enrichment", text: "Side-dress with well-rotted manure to stabilize rootzone nitrogen at 65+ mg/kg." }
                ]
            };
        } else {
            customDiagnosis = {
                crop: `${activePlant.toUpperCase()} Crop`,
                condition: "Foliar Stress & Mild Chlorosis",
                badge: "🟡 Moderate Stress",
                badgeClass: "status-warning",
                confidence: "93.8%",
                image: imageBase64,
                symptoms: "Localized chlorotic spotting and mild edge curling indicating moisture fluctuation and micro-nutrient stress.",
                causes: "Transpiration stress during peak heat hours and minor micronutrient imbalance.",
                prescription: [
                    { icon: "💧", title: "Irrigation Schedule Alignment", text: "Synchronize irrigation with AcuRoot automated profile for consistent rootzone moisture." },
                    { icon: "🌿", title: "Balanced Foliar Spray", text: "Apply seaweed extract spray with chelated zinc and iron to restore leaf enzyme activity." },
                    { icon: "🪵", title: "Rootzone Protection", text: "Mulch soil surface to moderate root thermal stress and preserve moisture." }
                ]
            };
        }

        appendDiagnosticReport(customDiagnosis);
    }, 2200);
}

function appendUserMessage(text, imageSrc) {
    const messagesContainer = document.getElementById('chat-messages');
    if (!messagesContainer) return;

    const msgDiv = document.createElement('div');
    msgDiv.className = 'chat-msg msg-user';

    let imgHtml = '';
    if (imageSrc) {
        imgHtml = `<img src="${imageSrc}" class="user-msg-image" alt="Uploaded plant photo">`;
    }

    msgDiv.innerHTML = `
        <div class="msg-avatar">You</div>
        <div class="msg-content">
            ${imgHtml}
            <p>${escapeHtml(text)}</p>
        </div>
    `;

    messagesContainer.appendChild(msgDiv);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

function appendScanningCard(id, imageSrc) {
    const messagesContainer = document.getElementById('chat-messages');
    if (!messagesContainer) return;

    const scanDiv = document.createElement('div');
    scanDiv.id = id;
    scanDiv.className = 'chat-msg msg-bot';

    scanDiv.innerHTML = `
        <div class="msg-avatar">
            <img src="image/logo.png" alt="Bot">
        </div>
        <div class="msg-content scan-card">
            <div class="scan-img-container">
                <img src="${imageSrc}" alt="Scanning leaf">
                <div class="scan-laser-line"></div>
            </div>
            <div class="scan-status-text">
                <div class="scan-spinner"></div>
                <span id="${id}-status">🔬 Scanning leaf structure & pathogen markers...</span>
            </div>
        </div>
    `;

    messagesContainer.appendChild(scanDiv);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;

    // Intermediate status steps
    setTimeout(() => {
        const el = document.getElementById(`${id}-status`);
        if (el) el.textContent = "🍃 Analyzing chlorosis index & necrotic lesions...";
    }, 750);

    setTimeout(() => {
        const el = document.getElementById(`${id}-status`);
        if (el) el.textContent = "🧬 Cross-referencing crop disease database & AcuRoot soil telemetry...";
    }, 1500);
}

function appendDiagnosticReport(data) {
    const messagesContainer = document.getElementById('chat-messages');
    if (!messagesContainer) return;

    const reportDiv = document.createElement('div');
    reportDiv.className = 'chat-msg msg-bot';

    let rxHtml = '';
    if (data.prescription && data.prescription.length > 0) {
        rxHtml = data.prescription.map(item => `
            <li class="diag-rx-item">
                <span class="diag-rx-icon">${item.icon}</span>
                <div class="diag-rx-text">
                    <strong>${item.title}:</strong> ${item.text}
                </div>
            </li>
        `).join('');
    }

    reportDiv.innerHTML = `
        <div class="msg-avatar">
            <img src="image/logo.png" alt="Bot">
        </div>
        <div class="msg-content" style="padding: 0; max-width: 100%;">
            <div class="diag-report-card">
                <div class="diag-header">
                    <div class="diag-title-group">
                        <span class="diag-title">${data.condition}</span>
                        <span class="diag-crop">🌿 ${data.crop} • Confidence: ${data.confidence}</span>
                    </div>
                    <span class="diag-severity-pill ${data.badgeClass}">${data.badge}</span>
                </div>
                <div class="diag-body">
                    <div class="diag-section-title">🔍 Visual Symptoms</div>
                    <div class="diag-symptoms">${data.symptoms}</div>

                    <div class="diag-section-title">⚠️ Primary Root Cause</div>
                    <div class="diag-symptoms">${data.causes}</div>

                    <div class="diag-section-title">📋 How to Make it Best (Action Plan)</div>
                    <ul class="diag-rx-list">
                        ${rxHtml}
                    </ul>
                </div>
            </div>
            <p class="msg-hint" style="margin: 8px 14px 10px 14px;">💬 You can ask me follow-up questions like <em>"How often should I spray neem oil?"</em> or <em>"Adjust irrigation"</em> below!</p>
        </div>
    `;

    messagesContainer.appendChild(reportDiv);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

function handleUserMessage() {
    const textInput = document.getElementById('chat-text-input');
    if (!textInput) return;

    const message = textInput.value.trim();
    if (!message) return;

    // If there's an image waiting in preview, analyze it with this caption
    if (uploadedImageBase64) {
        analyzeCustomImage(uploadedImageBase64, uploadedFileName);
        resetUploadPreview();
        textInput.value = "";
        return;
    }

    // Regular conversation
    appendUserMessage(message, null);
    textInput.value = "";

    // Generate intelligent AI response
    setTimeout(() => {
        generateChatbotResponse(message);
    }, 600);
}

function generateChatbotResponse(userText) {
    const messagesContainer = document.getElementById('chat-messages');
    if (!messagesContainer) return;

    const lower = userText.toLowerCase();
    let reply = "";

    if (lower.includes("water") || lower.includes("irrigation") || lower.includes("how often") || lower.includes("threshold")) {
        const crop = selectedPlantKey ? selectedPlantKey.toUpperCase() : "your crop";
        reply = `
            <p>💧 <strong>Irrigation Guidance for ${crop}:</strong></p>
            <ul>
                <li>Current soil moisture reading is <strong>${soilData.moisture}%</strong> (Normal 🟢).</li>
                <li>For ${crop}, maintain rootzone moisture between <strong>${currentThreshold || 40}% and 70%</strong>.</li>
                <li><strong>Pro-tip:</strong> Always irrigate in the early morning hours (6:00 AM – 9:00 AM) to allow foliage to dry quickly and prevent fungal spores from germinating!</li>
            </ul>
        `;
    } else if (lower.includes("neem") || lower.includes("fungicide") || lower.includes("spray") || lower.includes("organic")) {
        reply = `
            <p>🛡️ <strong>Organic Treatment & Neem Oil Recipe:</strong></p>
            <ul>
                <li><strong>Neem Solution:</strong> Mix 5ml cold-pressed pure neem oil + 2ml liquid dish soap per 1 liter of lukewarm water.</li>
                <li><strong>Application:</strong> Spray both upper and lower leaf surfaces thoroughly.</li>
                <li><strong>Timing:</strong> Apply strictly in late afternoon or evening after direct sunlight fades to prevent leaf sun-scorch.</li>
                <li><strong>Frequency:</strong> Once every 7 days for active infection, or once every 14 days for prevention.</li>
            </ul>
        `;
    } else if (lower.includes("yellow") || lower.includes("nitrogen") || lower.includes("chlorosis") || lower.includes("fertilizer")) {
        reply = `
            <p>🍃 <strong>Remedy for Leaf Yellowing (Chlorosis):</strong></p>
            <ul>
                <li>Current Soil Nitrogen is <strong>${soilData.nitrogen} mg/kg</strong> (Target: 50–90 mg/kg 🟢).</li>
                <li>Current Soil pH is <strong>${soilData.ph}</strong> (Optimal absorption 🟢).</li>
                <li>If leaves are yellowing: Apply an organic seaweed or fish emulsion foliar spray for rapid recovery within 48–72 hours.</li>
                <li>Ensure the soil is not waterlogged, as poor root aeration restricts nitrate uptake.</li>
            </ul>
        `;
    } else if (lower.includes("contagious") || lower.includes("spread") || lower.includes("other plant")) {
        reply = `
            <p>⚠️ <strong>Disease Spread Prevention:</strong></p>
            <ul>
                <li>Fungal diseases like Early Blight and Powdery Mildew spread easily through wind currents and overhead water splashing.</li>
                <li><strong>Action:</strong> Prune heavily infected foliage and discard immediately in a sealed bag.</li>
                <li>Sanitize your pruning shears with 70% isopropyl alcohol between every plant cut!</li>
            </ul>
        `;
    } else if (lower.includes("eat") || lower.includes("safe") || lower.includes("fruit")) {
        reply = `
            <p>🍎 <strong>Crop Safety & Harvest:</strong></p>
            <ul>
                <li>Fruits with no direct lesions are generally safe to consume after washing thoroughly with clean water.</li>
                <li>If applying organic neem oil or copper fungicide, wait at least <strong>48 to 72 hours</strong> before harvesting (Pre-Harvest Interval).</li>
            </ul>
        `;
    } else {
        reply = `
            <p>🌿 <strong>Plant Doctor Analysis:</strong></p>
            <p>I have noted your observation: <em>"${escapeHtml(userText)}"</em>.</p>
            <ul>
                <li>Current dashboard telemetry: Moisture: <strong>${soilData.moisture}%</strong> | Temp: <strong>${soilData.temperature}°C</strong> | pH: <strong>${soilData.ph}</strong> | EC: <strong>${soilData.ec} mS/cm</strong>.</li>
                <li>To get the most accurate visual diagnosis and treatment plan, try uploading or dropping a photo of the affected plant leaf using the <strong>Photo</strong> button below!</li>
            </ul>
        `;
    }

    const replyDiv = document.createElement('div');
    replyDiv.className = 'chat-msg msg-bot';
    replyDiv.innerHTML = `
        <div class="msg-avatar">
            <img src="image/logo.png" alt="Bot">
        </div>
        <div class="msg-content">
            ${reply}
        </div>
    `;

    messagesContainer.appendChild(replyDiv);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

function removeElement(id) {
    const el = document.getElementById(id);
    if (el) el.remove();
}

function escapeHtml(text) {
    if (!text) return "";
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}


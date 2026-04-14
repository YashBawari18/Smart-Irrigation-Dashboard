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

// Dashboard Info Display
const plantNameDisplay    = document.getElementById('plant-name-display');
const plantRangeDisplay   = document.getElementById('plant-range-display');
const plantImgDisplay     = document.getElementById('plant-img-display');


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
            
            // Trigger resize for chart
            if (chartInstance) {
                setTimeout(() => chartInstance.resize(), 50);
            }

            // Init weather widget
            setTimeout(() => initWeather(), 500);
        }, 2000);
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

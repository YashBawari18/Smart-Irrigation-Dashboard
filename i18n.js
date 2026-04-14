// -------- Internationalization (i18n) Module --------

const translations = {
    en: {
        // Nav
        nav_dashboard: "Dashboard",
        nav_team: "Team",
        nav_change_plant: "Change Plant",
        system_connected: "System Connected",

        // Selection View
        welcome_title: "Welcome to AcuRoot",
        welcome_subtitle: "Select your plant to optimize irrigation",
        btn_enter_dashboard: "Enter Dashboard",

        // Plant Names
        plant_wheat: "Wheat",
        plant_rice: "Rice",
        plant_maize: "Maize",
        plant_cotton: "Cotton",
        plant_sugarcane: "Sugarcane",
        plant_onion: "Onion",
        plant_rose: "Rose",
        plant_grapes: "Grapes",
        plant_sunflower: "Sunflower",
        plant_tomato: "Tomato",

        // Preloader
        preloader_status: "Syncing Plant Profile...",

        // Dashboard Cards
        card_soil_moisture: "Soil Moisture Level",
        card_motor_status: "Motor Status",
        card_watering_status: "Watering Status",
        card_pump_indicator: "Pump state indicator",
        card_irrigation_activity: "Irrigation activity",
        motor_on: "ON",
        motor_off: "OFF",
        watering_active: "Active",
        watering_inactive: "Inactive",

        // Weather Widget
        weather_loading: "Loading weather...",
        weather_detecting: "Detecting location...",
        weather_humidity: "Humidity",
        weather_wind: "Wind",
        weather_rain_label: "Rain (1h)",
        weather_feels_like: "Feels Like",
        weather_advisory_label: "Smart Irrigation Advisory",
        weather_analyzing: "Analyzing weather conditions...",
        weather_badge_analyzing: "ANALYZING",

        // Weather Advisories
        adv_heavy_rain: "Heavy rain detected ({rain}mm/h). Irrigation paused — natural watering in progress.",
        adv_rain: "Rain detected in your area. Consider reducing irrigation to conserve water.",
        adv_extreme_heat: "Extreme heat ({temp}°C) with low humidity. Increase irrigation frequency & water during cooler hours.",
        adv_hot: "High temperature ({temp}°C). Monitor soil moisture closely — evaporation rate is elevated.",
        adv_cold: "Low temperature ({temp}°C). Reduce irrigation to prevent root damage from cold waterlogging.",
        adv_windy: "High winds ({wind} km/h). Sprinkler efficiency reduced — consider drip irrigation.",
        adv_humid: "High humidity ({humidity}%). Reduce watering frequency — low evaporation expected.",
        adv_optimal: "Weather conditions are favorable. Automated irrigation schedule is optimal.",
        badge_paused: "PAUSED",
        badge_reduce: "REDUCE",
        badge_critical: "CRITICAL",
        badge_monitor: "MONITOR",
        badge_caution: "CAUTION",
        badge_windy: "WINDY",
        badge_optimal: "OPTIMAL",

        // Weather Conditions
        cond_clear: "Clear Sky",
        cond_mainly_clear: "Mainly Clear",
        cond_partly_cloudy: "Partly Cloudy",
        cond_overcast: "Overcast",
        cond_foggy: "Foggy",
        cond_rime_fog: "Rime Fog",
        cond_light_drizzle: "Light Drizzle",
        cond_mod_drizzle: "Moderate Drizzle",
        cond_dense_drizzle: "Dense Drizzle",
        cond_freezing_drizzle: "Freezing Drizzle",
        cond_dense_freezing_drizzle: "Dense Freezing Drizzle",
        cond_slight_rain: "Slight Rain",
        cond_mod_rain: "Moderate Rain",
        cond_heavy_rain: "Heavy Rain",
        cond_freezing_rain: "Freezing Rain",
        cond_heavy_freezing_rain: "Heavy Freezing Rain",
        cond_slight_snow: "Slight Snowfall",
        cond_mod_snow: "Moderate Snowfall",
        cond_heavy_snow: "Heavy Snowfall",
        cond_snow_grains: "Snow Grains",
        cond_slight_rain_shower: "Slight Rain Showers",
        cond_mod_rain_shower: "Moderate Rain Showers",
        cond_violent_rain_shower: "Violent Rain Showers",
        cond_slight_snow_shower: "Slight Snow Showers",
        cond_heavy_snow_shower: "Heavy Snow Showers",
        cond_thunderstorm: "Thunderstorm",
        cond_thunder_hail: "Thunderstorm with Hail",
        cond_thunder_heavy_hail: "Thunderstorm with Heavy Hail",

        // Chart & Controls
        chart_title: "Real-time Soil Moisture vs Time",
        chart_last_update: "Last update:",
        chart_label: "Soil Moisture %",
        controls_title: "Manual Controls",
        controls_desc: "Override automated schedule manually below.",
        btn_start: "START IRRIGATION",
        btn_stop: "STOP IRRIGATION",
        control_ready: "System Ready",
        control_running: "Irrigation Running",

        // Plant Profile
        profile_title: "Active Profile",
        profile_plant: "🌿 Plant",
        profile_range: "💧 Range",

        // Footer
        footer_text: "© 2026 Smart Irrigation Monitoring System. Crafted for a greener planet.",

        // Team Page
        team_title: "Meet Our Team",
        team_subtitle: "A group of passionate developers building the future of sustainable farming.",
        role_developer: "Developer",

        // Geolocation
        geo_not_supported: "Geolocation not supported",

        // Language Names
        lang_en: "English",
        lang_hi: "हिन्दी",
        lang_mr: "मराठी",
    },

    hi: {
        // Nav
        nav_dashboard: "डैशबोर्ड",
        nav_team: "टीम",
        nav_change_plant: "पौधा बदलें",
        system_connected: "सिस्टम जुड़ा है",

        // Selection View
        welcome_title: "AcuRoot में आपका स्वागत है",
        welcome_subtitle: "सिंचाई को बेहतर बनाने के लिए अपना पौधा चुनें",
        btn_enter_dashboard: "डैशबोर्ड में जाएं",

        // Plant Names
        plant_wheat: "गेहूं",
        plant_rice: "चावल",
        plant_maize: "मक्का",
        plant_cotton: "कपास",
        plant_sugarcane: "गन्ना",
        plant_onion: "प्याज",
        plant_rose: "गुलाब",
        plant_grapes: "अंगूर",
        plant_sunflower: "सूरजमुखी",
        plant_tomato: "टमाटर",

        // Preloader
        preloader_status: "पौधे की प्रोफ़ाइल लोड हो रही है...",

        // Dashboard Cards
        card_soil_moisture: "मिट्टी की नमी का स्तर",
        card_motor_status: "मोटर की स्थिति",
        card_watering_status: "सिंचाई की स्थिति",
        card_pump_indicator: "पंप स्थिति सूचक",
        card_irrigation_activity: "सिंचाई गतिविधि",
        motor_on: "चालू",
        motor_off: "बंद",
        watering_active: "सक्रिय",
        watering_inactive: "निष्क्रिय",

        // Weather Widget
        weather_loading: "मौसम लोड हो रहा है...",
        weather_detecting: "स्थान पता लगा रहे हैं...",
        weather_humidity: "नमी",
        weather_wind: "हवा",
        weather_rain_label: "बारिश (1घं)",
        weather_feels_like: "महसूस",
        weather_advisory_label: "स्मार्ट सिंचाई सलाह",
        weather_analyzing: "मौसम की स्थिति का विश्लेषण...",
        weather_badge_analyzing: "विश्लेषण",

        // Weather Advisories
        adv_heavy_rain: "भारी बारिश ({rain}mm/h) का पता चला। सिंचाई रोकी गई — प्राकृतिक पानी मिल रहा है।",
        adv_rain: "आपके क्षेत्र में बारिश। पानी बचाने के लिए सिंचाई कम करें।",
        adv_extreme_heat: "अत्यधिक गर्मी ({temp}°C) और कम नमी। सिंचाई बढ़ाएं और ठंडे समय में पानी दें।",
        adv_hot: "उच्च तापमान ({temp}°C)। मिट्टी की नमी पर नज़र रखें — वाष्पीकरण बढ़ा है।",
        adv_cold: "कम तापमान ({temp}°C)। ठंडे पानी से जड़ क्षति रोकने के लिए सिंचाई कम करें।",
        adv_windy: "तेज़ हवाएं ({wind} km/h)। स्प्रिंकलर की दक्षता कम — ड्रिप सिंचाई सोचें।",
        adv_humid: "उच्च नमी ({humidity}%)। कम वाष्पीकरण — सिंचाई कम करें।",
        adv_optimal: "मौसम अनुकूल है। स्वचालित सिंचाई शेड्यूल सही है।",
        badge_paused: "रुका",
        badge_reduce: "कम करें",
        badge_critical: "गंभीर",
        badge_monitor: "निगरानी",
        badge_caution: "सावधानी",
        badge_windy: "हवादार",
        badge_optimal: "उत्तम",

        // Weather Conditions
        cond_clear: "साफ़ आसमान",
        cond_mainly_clear: "ज़्यादातर साफ़",
        cond_partly_cloudy: "आंशिक बादल",
        cond_overcast: "घने बादल",
        cond_foggy: "कोहरा",
        cond_rime_fog: "पाला कोहरा",
        cond_light_drizzle: "हल्की बूंदाबांदी",
        cond_mod_drizzle: "मध्यम बूंदाबांदी",
        cond_dense_drizzle: "घनी बूंदाबांदी",
        cond_freezing_drizzle: "जमती बूंदाबांदी",
        cond_dense_freezing_drizzle: "घनी जमती बूंदाबांदी",
        cond_slight_rain: "हल्की बारिश",
        cond_mod_rain: "मध्यम बारिश",
        cond_heavy_rain: "भारी बारिश",
        cond_freezing_rain: "जमती बारिश",
        cond_heavy_freezing_rain: "भारी जमती बारिश",
        cond_slight_snow: "हल्की बर्फबारी",
        cond_mod_snow: "मध्यम बर्फबारी",
        cond_heavy_snow: "भारी बर्फबारी",
        cond_snow_grains: "बर्फ के दाने",
        cond_slight_rain_shower: "हल्की बौछार",
        cond_mod_rain_shower: "मध्यम बौछार",
        cond_violent_rain_shower: "तीव्र बौछार",
        cond_slight_snow_shower: "हल्की बर्फ बौछार",
        cond_heavy_snow_shower: "भारी बर्फ बौछार",
        cond_thunderstorm: "आंधी-तूफ़ान",
        cond_thunder_hail: "ओलों के साथ तूफ़ान",
        cond_thunder_heavy_hail: "भारी ओलों के साथ तूफ़ान",

        // Chart & Controls
        chart_title: "रीयल-टाइम मिट्टी नमी बनाम समय",
        chart_last_update: "अंतिम अपडेट:",
        chart_label: "मिट्टी नमी %",
        controls_title: "मैन्युअल नियंत्रण",
        controls_desc: "नीचे स्वचालित शेड्यूल को मैन्युअल रूप से ओवरराइड करें।",
        btn_start: "सिंचाई शुरू करें",
        btn_stop: "सिंचाई बंद करें",
        control_ready: "सिस्टम तैयार",
        control_running: "सिंचाई चल रही है",

        // Plant Profile
        profile_title: "सक्रिय प्रोफ़ाइल",
        profile_plant: "🌿 पौधा",
        profile_range: "💧 सीमा",

        // Footer
        footer_text: "© 2026 स्मार्ट सिंचाई निगरानी प्रणाली। हरित ग्रह के लिए बनाया गया।",

        // Team Page
        team_title: "हमारी टीम से मिलें",
        team_subtitle: "टिकाऊ खेती का भविष्य बनाने वाले जुनूनी डेवलपर्स का समूह।",
        role_developer: "डेवलपर",

        // Geolocation
        geo_not_supported: "जियोलोकेशन समर्थित नहीं",

        // Language Names
        lang_en: "English",
        lang_hi: "हिन्दी",
        lang_mr: "मराठी",
    },

    mr: {
        // Nav
        nav_dashboard: "डॅशबोर्ड",
        nav_team: "संघ",
        nav_change_plant: "पीक बदला",
        system_connected: "सिस्टम जोडलेले",

        // Selection View
        welcome_title: "AcuRoot मध्ये आपले स्वागत",
        welcome_subtitle: "सिंचन सुधारण्यासाठी आपले पीक निवडा",
        btn_enter_dashboard: "डॅशबोर्ड उघडा",

        // Plant Names
        plant_wheat: "गहू",
        plant_rice: "तांदूळ",
        plant_maize: "मका",
        plant_cotton: "कापूस",
        plant_sugarcane: "ऊस",
        plant_onion: "कांदा",
        plant_rose: "गुलाब",
        plant_grapes: "द्राक्षे",
        plant_sunflower: "सूर्यफूल",
        plant_tomato: "टोमॅटो",

        // Preloader
        preloader_status: "पिकाची माहिती लोड होत आहे...",

        // Dashboard Cards
        card_soil_moisture: "मातीतील ओलावा पातळी",
        card_motor_status: "मोटर स्थिती",
        card_watering_status: "पाणी देण्याची स्थिती",
        card_pump_indicator: "पंप स्थिती दर्शक",
        card_irrigation_activity: "सिंचन क्रिया",
        motor_on: "चालू",
        motor_off: "बंद",
        watering_active: "सक्रिय",
        watering_inactive: "निष्क्रिय",

        // Weather Widget
        weather_loading: "हवामान लोड होत आहे...",
        weather_detecting: "स्थान शोधत आहे...",
        weather_humidity: "आर्द्रता",
        weather_wind: "वारा",
        weather_rain_label: "पाऊस (1तास)",
        weather_feels_like: "जाणवते",
        weather_advisory_label: "स्मार्ट सिंचन सल्ला",
        weather_analyzing: "हवामान परिस्थिती तपासत आहे...",
        weather_badge_analyzing: "तपासणी",

        // Weather Advisories
        adv_heavy_rain: "मुसळधार पाऊस ({rain}mm/h). सिंचन थांबवले — नैसर्गिक पाणी मिळत आहे.",
        adv_rain: "तुमच्या भागात पाऊस आहे. पाणी वाचवण्यासाठी सिंचन कमी करा.",
        adv_extreme_heat: "अत्यंत उष्णता ({temp}°C) आणि कमी आर्द्रता. सिंचन वाढवा आणि थंड वेळी पाणी द्या.",
        adv_hot: "उच्च तापमान ({temp}°C). मातीच्या ओलाव्यावर लक्ष ठेवा — बाष्पीभवन वाढले आहे.",
        adv_cold: "कमी तापमान ({temp}°C). थंड पाण्यामुळे मुळांचे नुकसान टाळण्यासाठी सिंचन कमी करा.",
        adv_windy: "जोरदार वारे ({wind} km/h). तुषार सिंचन कमी प्रभावी — ठिबक सिंचन वापरा.",
        adv_humid: "उच्च आर्द्रता ({humidity}%). कमी बाष्पीभवन — सिंचन कमी करा.",
        adv_optimal: "हवामान अनुकूल आहे. स्वयंचलित सिंचन वेळापत्रक योग्य आहे.",
        badge_paused: "थांबा",
        badge_reduce: "कमी करा",
        badge_critical: "गंभीर",
        badge_monitor: "निरीक्षण",
        badge_caution: "सावधान",
        badge_windy: "वादळी",
        badge_optimal: "उत्तम",

        // Weather Conditions
        cond_clear: "स्वच्छ आकाश",
        cond_mainly_clear: "मुख्यतः स्वच्छ",
        cond_partly_cloudy: "अंशतः ढगाळ",
        cond_overcast: "संपूर्ण ढगाळ",
        cond_foggy: "धुके",
        cond_rime_fog: "दंव धुके",
        cond_light_drizzle: "हलकी रिमझिम",
        cond_mod_drizzle: "मध्यम रिमझिम",
        cond_dense_drizzle: "दाट रिमझिम",
        cond_freezing_drizzle: "गोठवणारी रिमझिम",
        cond_dense_freezing_drizzle: "दाट गोठवणारी रिमझिम",
        cond_slight_rain: "हलका पाऊस",
        cond_mod_rain: "मध्यम पाऊस",
        cond_heavy_rain: "मुसळधार पाऊस",
        cond_freezing_rain: "गोठवणारा पाऊस",
        cond_heavy_freezing_rain: "मुसळधार गोठवणारा पाऊस",
        cond_slight_snow: "हलकी हिमवृष्टी",
        cond_mod_snow: "मध्यम हिमवृष्टी",
        cond_heavy_snow: "मुसळधार हिमवृष्टी",
        cond_snow_grains: "बर्फ कण",
        cond_slight_rain_shower: "हलकी सरी",
        cond_mod_rain_shower: "मध्यम सरी",
        cond_violent_rain_shower: "जोरदार सरी",
        cond_slight_snow_shower: "हलक्या बर्फ सरी",
        cond_heavy_snow_shower: "जोरदार बर्फ सरी",
        cond_thunderstorm: "वादळ-वीज",
        cond_thunder_hail: "गारपिटीसह वादळ",
        cond_thunder_heavy_hail: "जोरदार गारपिटीसह वादळ",

        // Chart & Controls
        chart_title: "रीअल-टाइम मातीतील ओलावा वि. वेळ",
        chart_last_update: "शेवटचे अपडेट:",
        chart_label: "मातीतील ओलावा %",
        controls_title: "मॅन्युअल नियंत्रणे",
        controls_desc: "खालील स्वयंचलित वेळापत्रक मॅन्युअली बदला.",
        btn_start: "सिंचन सुरू करा",
        btn_stop: "सिंचन थांबवा",
        control_ready: "सिस्टम तयार",
        control_running: "सिंचन चालू आहे",

        // Plant Profile
        profile_title: "सक्रिय प्रोफाइल",
        profile_plant: "🌿 पीक",
        profile_range: "💧 श्रेणी",

        // Footer
        footer_text: "© 2026 स्मार्ट सिंचन निरीक्षण प्रणाली. हिरव्या ग्रहासाठी बनवलेले.",

        // Team Page
        team_title: "आमच्या संघाला भेटा",
        team_subtitle: "शाश्वत शेतीचे भविष्य घडवणारे उत्साही डेव्हलपर्स.",
        role_developer: "डेव्हलपर",

        // Geolocation
        geo_not_supported: "जिओलोकेशन समर्थित नाही",

        // Language Names
        lang_en: "English",
        lang_hi: "हिन्दी",
        lang_mr: "मराठी",
    }
};


// -------- i18n Engine --------
let currentLang = localStorage.getItem('acuroot-lang') || 'en';

function t(key, replacements = {}) {
    const dict = translations[currentLang] || translations.en;
    let text = dict[key] || translations.en[key] || key;
    // Replace {variables}
    for (const [k, v] of Object.entries(replacements)) {
        text = text.replace(`{${k}}`, v);
    }
    return text;
}

function applyTranslations() {
    // Apply to all elements with data-i18n attribute
    document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.getAttribute('data-i18n');
        if (key) {
            el.textContent = t(key);
        }
    });

    // Apply to elements with data-i18n-placeholder
    document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
        const key = el.getAttribute('data-i18n-placeholder');
        if (key) {
            el.placeholder = t(key);
        }
    });

    // Update active language button
    document.querySelectorAll('.lang-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.lang === currentLang);
    });

    // Update document lang attribute
    document.documentElement.lang = currentLang === 'en' ? 'en' : currentLang === 'hi' ? 'hi' : 'mr';
}

function setLanguage(lang) {
    currentLang = lang;
    localStorage.setItem('acuroot-lang', lang);
    applyTranslations();

    // Dispatch custom event for dynamic JS content
    window.dispatchEvent(new CustomEvent('languageChanged', { detail: { lang } }));
}

// -------- Language Switcher UI Injection --------
function injectLanguageSwitcher() {
    // Target only the plant selection view header
    const selectionHeader = document.querySelector('.selection-header');
    if (!selectionHeader || document.querySelector('.lang-switcher')) return;

    const switcher = document.createElement('div');
    switcher.className = 'lang-switcher';
    switcher.style.display = 'inline-flex';
    switcher.style.justifyContent = 'center';
    switcher.style.marginBottom = '1.2rem';
    
    switcher.innerHTML = `
        <button class="lang-btn ${currentLang === 'en' ? 'active' : ''}" data-lang="en" title="English">EN</button>
        <button class="lang-btn ${currentLang === 'hi' ? 'active' : ''}" data-lang="hi" title="हिन्दी">हि</button>
        <button class="lang-btn ${currentLang === 'mr' ? 'active' : ''}" data-lang="mr" title="मराठी">म</button>
    `;

    // Insert at the beginning of the selection header
    selectionHeader.insertBefore(switcher, selectionHeader.firstChild);

    // Add click listeners
    switcher.querySelectorAll('.lang-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            setLanguage(btn.dataset.lang);
        });
    });
}


// -------- Auto-init on DOM Ready --------
document.addEventListener('DOMContentLoaded', () => {
    injectLanguageSwitcher();
    applyTranslations();
});

// Export for use from ES modules
window.i18n = { t, setLanguage, applyTranslations, currentLang: () => currentLang };

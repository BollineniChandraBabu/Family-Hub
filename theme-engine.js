(function () {
  const STORAGE_KEYS = {
    usage: "themeEngine.usageHours",
    manualTheme: "theme",
    location: "themeEngine.location",
    holidayCache: "themeEngine.holidays",
    weatherCache: "themeEngine.weather"
  };

  const REFRESH_INTERVAL_MS = 10 * 60 * 1000;
  const HOLIDAY_CACHE_TTL_MS = 6 * 60 * 60 * 1000;
  const WEATHER_CACHE_TTL_MS = 20 * 60 * 1000;
  const INDIA_HOLIDAY_ICS_URL =
    "https://calendar.google.com/calendar/ical/en.indian%23holiday%40group.v.calendar.google.com/public/basic.ics";
  const TEXT_PROXY_PREFIX = "https://r.jina.ai/http://";

  const FESTIVAL_PATTERNS = [
    { test: /(diwali|deepavali)/i, theme: "diwali" },
    { test: /(new\s*year)/i, theme: "newyear" },
    { test: /(christmas|eid|holi|pongal|thanksgiving|independence\s*day|lunar\s*new\s*year)/i, theme: "festival" }
  ];

  const ThemeEngine = {
    lightningTimer: null,

    async init() {
      this.trackUserBehavior();

      const context = await this.getContext();

      const festivalTheme = await this.getFestivalTheme(context);
      if (festivalTheme) {
        this.applyTheme(festivalTheme, context);
        return;
      }

      const savedTheme = localStorage.getItem(STORAGE_KEYS.manualTheme);
      if (savedTheme) {
        this.applyTheme(savedTheme, context);
        return;
      }

      let weatherTheme = await this.getWeatherThemeGPS(context);
      if (!weatherTheme) {
        weatherTheme = await this.getWeatherThemeIP(context);
      }

      if (weatherTheme) {
        this.applyTheme(weatherTheme, context);
      } else {
        await this.applyTimeTheme(context);
      }
    },

    async getContext() {
      const today = new Date();
      const locale = navigator.language || "en-US";
      const regionFromLocale = locale.includes("-") ? locale.split("-").pop().toUpperCase() : null;
      const location = await this.resolveLocation();

      return {
        today,
        locale,
        countryCode: location?.country_code || regionFromLocale || "US",
        coords: location?.coords || null
      };
    },

    applyTheme(theme, context) {
      document.body.dataset.theme = theme;

      this.clearEffects();
      this.applyEffects(theme);

      const greeting = document.getElementById("greeting");
      if (greeting) {
        greeting.innerText = this.getGreeting(theme, context?.locale);
      }
    },

    getGreeting(theme) {
      const greetings = {
        night: "Good Night 🌙",
        morning: "Good Morning ☀️",
        afternoon: "Good Afternoon 🌤️",
        evening: "Good Evening 🌇",
        diwali: "Happy Diwali 🪔",
        newyear: "Happy New Year 🎆",
        festival: "Happy Celebrations 🎉",
        sunny: "Bright Day Ahead ☀️",
        cloudy: "Stay Cozy ☁️",
        rainy: "Enjoy the Rain 🌧️"
      };

      return greetings[theme] || "Hello 👋";
    },

    async applyTimeTheme(context) {
      const now = new Date();
      const hour = now.getHours();

      if (context?.coords) {
        const phase = await this.getSolarPhase(context.coords.latitude, context.coords.longitude, now);
        if (phase) {
          this.applyTheme(phase, context);
          return;
        }
      }

      const fallbackTheme = hour < 6 ? "night" : hour < 12 ? "morning" : hour < 18 ? "afternoon" : hour < 21 ? "evening" : "night";
      this.applyTheme(fallbackTheme, context);
    },

    async getSolarPhase(lat, lon, now) {
      try {
        const date = now.toISOString().slice(0, 10);
        const res = await fetch(`https://api.sunrise-sunset.org/json?lat=${lat}&lng=${lon}&date=${date}&formatted=0`);
        if (!res.ok) return null;

        const data = await res.json();
        const sunrise = new Date(data?.results?.sunrise);
        const sunset = new Date(data?.results?.sunset);

        if (Number.isNaN(sunrise.getTime()) || Number.isNaN(sunset.getTime())) return null;

        const nowTs = now.getTime();
        if (nowTs < sunrise.getTime()) return "night";
        if (nowTs < sunrise.getTime() + 2 * 60 * 60 * 1000) return "morning";
        if (nowTs < sunset.getTime() - 2 * 60 * 60 * 1000) return "afternoon";
        if (nowTs < sunset.getTime() + 60 * 60 * 1000) return "evening";
        return "night";
      } catch {
        return null;
      }
    },

    async getWeatherThemeGPS(context) {
      try {
        const pos = await new Promise((resolve, reject) =>
          navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 8000, maximumAge: 10 * 60 * 1000 })
        );
        context.coords = { latitude: pos.coords.latitude, longitude: pos.coords.longitude };
        return await this.fetchWeather(pos.coords.latitude, pos.coords.longitude);
      } catch {
        return null;
      }
    },

    async getWeatherThemeIP(context) {
      try {
        const loc = await this.resolveLocation();
        if (!loc?.coords) return null;
        context.coords = loc.coords;
        return await this.fetchWeather(loc.coords.latitude, loc.coords.longitude);
      } catch {
        return null;
      }
    },

    async fetchWeather(lat, lon) {
      const cached = this.getCached(STORAGE_KEYS.weatherCache, WEATHER_CACHE_TTL_MS);
      if (cached && this.distance(cached.lat, cached.lon, lat, lon) < 0.75) {
        return cached.theme;
      }

      try {
        const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=precipitation,cloud_cover,is_day&timezone=auto`;
        const res = await fetch(url);
        if (!res.ok) return null;

        const data = await res.json();
        const current = data?.current || {};

        const precipitation = Number(current.precipitation ?? 0);
        const cloudCover = Number(current.cloud_cover ?? 0);
        const isDay = Number(current.is_day ?? 1) === 1;

        let theme = null;
        if (precipitation >= 0.2) theme = "rainy";
        else if (isDay && cloudCover <= 25) theme = "sunny";
        else if (cloudCover >= 35) theme = "cloudy";

        if (theme) {
          this.setCached(STORAGE_KEYS.weatherCache, { lat, lon, theme });
        }

        return theme;
      } catch {
        return null;
      }
    },

    async resolveLocation() {
      const cached = this.getCached(STORAGE_KEYS.location, 24 * 60 * 60 * 1000);
      if (cached) return cached;

      try {
        const res = await fetch("https://ipapi.co/json/");
        if (!res.ok) return null;
        const data = await res.json();
        const location = {
          country_code: data.country_code,
          coords: data.latitude && data.longitude ? { latitude: Number(data.latitude), longitude: Number(data.longitude) } : null
        };
        this.setCached(STORAGE_KEYS.location, location);
        return location;
      } catch {
        return null;
      }
    },

    async getFestivalTheme(context) {
      try {
        const date = context.today.toISOString().slice(0, 10);
        const holidays = await this.getHolidays(context.countryCode, context.today.getFullYear());
        const todays = holidays.filter((h) => h.date === date);

        for (const holiday of todays) {
          const rule = FESTIVAL_PATTERNS.find((p) => p.test.test(holiday.localName || holiday.name || ""));
          if (rule) return rule.theme;
        }

        if (todays.length > 0) return "festival";
        return null;
      } catch {
        return null;
      }
    },

    async getHolidays(countryCode, year) {
      const cacheKey = `${STORAGE_KEYS.holidayCache}:${countryCode}:${year}`;
      const cached = this.getCached(cacheKey, HOLIDAY_CACHE_TTL_MS);
      if (cached) return cached;

      if (countryCode === "IN") {
        const indiaHolidays = await this.getIndiaHolidaysFromIcs(year);
        if (indiaHolidays.length > 0) {
          this.setCached(cacheKey, indiaHolidays);
          return indiaHolidays;
        }
      }

      try {
        const res = await fetch(`https://date.nager.at/api/v3/PublicHolidays/${year}/${countryCode}`);
        if (!res.ok) return [];
        const data = await res.json();
        const holidays = Array.isArray(data) ? data : [];
        this.setCached(cacheKey, holidays);
        return holidays;
      } catch {
        return [];
      }
    },

    async getIndiaHolidaysFromIcs(year) {
      try {
        const proxiedUrl = `${TEXT_PROXY_PREFIX}${INDIA_HOLIDAY_ICS_URL.replace(/^https?:\/\//, "")}`;
        const res = await fetch(proxiedUrl);
        if (!res.ok) return [];

        const text = await res.text();
        return this.parseIcsHolidayEvents(text, year);
      } catch {
        return [];
      }
    },

    parseIcsHolidayEvents(rawText, year) {
      if (!rawText) return [];

      const calendarStart = rawText.indexOf("BEGIN:VCALENDAR");
      const icsText = calendarStart >= 0 ? rawText.slice(calendarStart) : rawText;
      const events = [];

      const blocks = icsText.split("BEGIN:VEVENT").slice(1);
      for (const block of blocks) {
        const endIndex = block.indexOf("END:VEVENT");
        const eventBlock = endIndex >= 0 ? block.slice(0, endIndex) : block;

        const dateMatch = eventBlock.match(/DTSTART(?:;VALUE=DATE)?:([0-9]{8})/);
        const summaryMatch = eventBlock.match(/SUMMARY:(.+)/);

        if (!dateMatch || !summaryMatch) continue;

        const isoDate = this.compactDateToIso(dateMatch[1]);
        if (!isoDate || !isoDate.startsWith(`${year}-`)) continue;

        const name = summaryMatch[1].replace(/\\,/g, ",").trim();
        events.push({ date: isoDate, localName: name, name });
      }

      return events;
    },

    compactDateToIso(dateValue) {
      if (!/^[0-9]{8}$/.test(dateValue)) return null;
      const year = dateValue.slice(0, 4);
      const month = dateValue.slice(4, 6);
      const day = dateValue.slice(6, 8);
      return `${year}-${month}-${day}`;
    },

    applyEffects(theme) {
      if (theme === "rainy") {
        this.createRain();
        this.createLightning();
      }
      if (theme === "sunny") this.createSun();
      if (theme === "cloudy") this.createFog();
      if (["diwali", "newyear", "festival"].includes(theme)) this.createFireworks();
    },

    clearEffects() {
      const effects = document.getElementById("weatherEffects");
      if (effects) effects.remove();

      const lightning = document.getElementById("lightning");
      if (lightning) lightning.remove();

      if (this.lightningTimer) {
        clearInterval(this.lightningTimer);
        this.lightningTimer = null;
      }
    },

    createRain() {
      const container = document.createElement("div");
      container.id = "weatherEffects";

      for (let i = 0; i < 80; i++) {
        const drop = document.createElement("div");
        drop.className = "rain-drop";
        drop.style.left = `${Math.random() * 100}%`;
        drop.style.animationDuration = `${0.5 + Math.random()}s`;
        drop.style.opacity = `${0.4 + Math.random() * 0.6}`;
        container.appendChild(drop);
      }

      document.body.appendChild(container);
    },

    createLightning() {
      const flash = document.createElement("div");
      flash.id = "lightning";
      document.body.appendChild(flash);

      this.lightningTimer = setInterval(() => {
        flash.style.opacity = Math.random() > 0.84 ? "0.8" : "0";
      }, 350);
    },

    createSun() {
      const sun = document.createElement("div");
      sun.id = "weatherEffects";
      sun.className = "sun";
      document.body.appendChild(sun);
    },

    createFog() {
      const fog = document.createElement("div");
      fog.id = "weatherEffects";
      fog.className = "fog";
      document.body.appendChild(fog);
    },

    createFireworks() {
      const fw = document.createElement("div");
      fw.id = "weatherEffects";
      fw.innerHTML = "🎆 🎇 🎆";
      fw.style.position = "fixed";
      fw.style.top = "20px";
      fw.style.left = "50%";
      fw.style.transform = "translateX(-50%)";
      fw.style.fontSize = "40px";
      fw.style.zIndex = "4";
      document.body.appendChild(fw);
    },

    trackUserBehavior() {
      const hour = new Date().getHours();
      const usage = JSON.parse(localStorage.getItem(STORAGE_KEYS.usage) || "[]");
      usage.push(hour);

      const boundedUsage = usage.slice(-180);
      localStorage.setItem(STORAGE_KEYS.usage, JSON.stringify(boundedUsage));

      const nightUsage = boundedUsage.filter((h) => h >= 20 || h <= 5).length;
      const daytimeUsage = boundedUsage.length - nightUsage;

      if (boundedUsage.length >= 30) {
        if (nightUsage > daytimeUsage * 1.25) {
          localStorage.setItem(STORAGE_KEYS.manualTheme, "night");
        } else if (daytimeUsage > nightUsage * 1.25 && !localStorage.getItem(STORAGE_KEYS.manualTheme)) {
          localStorage.removeItem(STORAGE_KEYS.manualTheme);
        }
      }
    },

    setCached(key, data) {
      localStorage.setItem(
        key,
        JSON.stringify({
          createdAt: Date.now(),
          data
        })
      );
    },

    getCached(key, ttlMs) {
      try {
        const raw = localStorage.getItem(key);
        if (!raw) return null;

        const parsed = JSON.parse(raw);
        if (!parsed?.createdAt || Date.now() - parsed.createdAt > ttlMs) return null;
        return parsed.data;
      } catch {
        return null;
      }
    },

    distance(lat1, lon1, lat2, lon2) {
      const p = Math.PI / 180;
      const a =
        0.5 -
        Math.cos((lat2 - lat1) * p) / 2 +
        (Math.cos(lat1 * p) * Math.cos(lat2 * p) * (1 - Math.cos((lon2 - lon1) * p))) / 2;
      return 12742 * Math.asin(Math.sqrt(a));
    }
  };

  window.ThemeEngine = ThemeEngine;
  ThemeEngine.init();
  setInterval(() => ThemeEngine.init(), REFRESH_INTERVAL_MS);
})();

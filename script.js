const API = "https://api.open-meteo.com/v1/forecast";
const GEO = "https://geocoding-api.open-meteo.com/v1/search";

const searchForm = document.getElementById("form");
const searchInput = document.getElementById("search");
const results = document.getElementById("results");

const app = document.getElementById("app");
const daily = document.getElementById("daily");
const hourly = document.getElementById("hourly");

const days = document.getElementById("days");
const dayBtn = document.getElementById("dayBtn");

const units = document.getElementById("units");
const unitsBtn = document.getElementById("unitsBtn");

const loading = document.getElementById("loading");
const error = document.getElementById("error");
const errorText = document.getElementById("errorText");
const retry = document.getElementById("retry");

const imperialBtn = document.getElementById("imperialBtn");

let weatherData;
let locationData;
let lastSearch = "";
let selectedDay = 0;

units.dataset.temp = "celsius";
units.dataset.wind = "kmh";
units.dataset.precip = "mm";

const weatherIcons = {
  0: "sunny",
  1: "sunny",
  2: "partly-cloudy",
  3: "overcast",
  45: "overcast",
  48: "overcast",
  51: "rain",
  53: "rain",
  55: "rain",
  61: "rain",
  63: "rain",
  65: "rain",
  71: "snow",
  73: "snow",
  75: "snow",
  77: "snow",
  80: "rain",
  81: "rain",
  82: "rain",
  85: "snow",
  86: "snow",
  95: "storm",
  96: "storm",
  99: "storm",
};

function icon(code) {
  const name = weatherIcons[code] || "sunny";

  return `./assets/images/icon-${name}.webp`;
}

function temp(value) {
  if (units.dataset.temp === "fahrenheit") {
    value = (value * 9) / 5 + 32;
  }

  return `${Math.round(value)}°`;
}

function wind(value) {
  if (units.dataset.wind === "mph") {
    return `${Math.round(value * 0.621371)} mph`;
  }

  return `${Math.round(value)} km/h`;
}

function precipitation(value) {
  if (units.dataset.precip === "inch") {
    return `${(value * 0.03937).toFixed(2)} in`;
  }

  return `${Number(value).toFixed(1)} mm`;
}

function showLoading() {
  loading.classList.remove("hidden");
  app.classList.add("hidden");
  error.classList.add("hidden");
}

function showError(message) {
  loading.classList.add("hidden");
  app.classList.add("hidden");
  error.classList.remove("hidden");

  errorText.textContent = message;
}

async function findLocation(city) {
  const url =
    `${GEO}?name=${encodeURIComponent(city)}` +
    `&count=10` +
    `&language=en` +
    `&format=json`;

  const response = await fetch(url);

  if (!response.ok) {
    throw new Error("Could not search for this location.");
  }

  const data = await response.json();

  if (!data.results?.length) {
    throw new Error(
      "We couldn't connect to the server(API error). please try again in a few minutes.",
    );
  }

  return data.results[0];
}

async function getWeather(location) {
  const params = new URLSearchParams({
    latitude: location.latitude,
    longitude: location.longitude,
    timezone: "auto",
    forecast_days: 7,

    current:
      "temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,weather_code,wind_speed_10m",

    hourly: "temperature_2m,weather_code",

    daily: "weather_code,temperature_2m_max,temperature_2m_min",
  });

  const response = await fetch(`${API}?${params}`);

  if (!response.ok) {
    throw new Error("Weather information could not be loaded.");
  }

  return response.json();
}

async function searchWeather(city) {
  if (!city.trim()) return;

  lastSearch = city.trim();

  localStorage.setItem("lastLocation", lastSearch);

  searchInput.value = "";

  results.classList.add("hidden");

  showLoading();

  try {
    locationData = await findLocation(city);

    weatherData = await getWeather(locationData);

    selectedDay = 0;

    renderWeather();
  } catch (err) {
    showError(err.message);
  }
}

function renderWeather() {
  loading.classList.add("hidden");
  error.classList.add("hidden");
  app.classList.remove("hidden");

  const current = weatherData.current;

  document.getElementById("place").textContent =
    `${locationData.name}, ${locationData.country}`;

  document.getElementById("date").textContent = new Date(
    current.time,
  ).toLocaleDateString("en-US", {
    weekday: "long",
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  document.getElementById("temp").textContent = temp(current.temperature_2m);

  document.getElementById("icon").src = icon(current.weather_code);

  document.getElementById("feels").textContent = temp(
    current.apparent_temperature,
  );

  document.getElementById("humidity").textContent =
    `${current.relative_humidity_2m}%`;

  document.getElementById("wind").textContent = wind(current.wind_speed_10m);

  document.getElementById("precip").textContent = precipitation(
    current.precipitation,
  );

  renderDaily();
  renderDays();
  renderHourly(selectedDay);
}

function renderDaily() {
  daily.innerHTML = "";

  weatherData.daily.time.forEach((date, index) => {
    const card = document.createElement("div");

    const day = new Date(`${date}T12:00:00`).toLocaleDateString("en-US", {
      weekday: "short",
    });

    card.className = "rounded-xl bg-n-800 p-3 text-center";

    card.innerHTML = `
      <p>${day}</p>

      <img
        src="${icon(weatherData.daily.weather_code[index])}"
        class="mx-auto my-4 h-10 w-10"
        alt="Weather"
      >

      <div class="flex justify-between">
        <span>
          ${temp(weatherData.daily.temperature_2m_max[index])}
        </span>

        <span class="text-n-300">
          ${temp(weatherData.daily.temperature_2m_min[index])}
        </span>
      </div>
    `;

    daily.append(card);
  });
}

function renderDays() {
  days.innerHTML = "";

  weatherData.daily.time.forEach((date, index) => {
    const button = document.createElement("button");

    const name = new Date(`${date}T12:00:00`).toLocaleDateString("en-US", {
      weekday: "long",
    });

    button.className =
      "block w-full rounded-lg px-3 py-2 text-left text-sm hover:bg-n-700";

    button.textContent = name;

    button.onclick = () => {
      selectedDay = index;

      dayBtn.textContent = name;

      days.classList.add("hidden");

      renderHourly(index);
    };

    days.append(button);
  });

  const today = new Date(
    `${weatherData.daily.time[0]}T12:00:00`,
  ).toLocaleDateString("en-US", {
    weekday: "long",
  });

  dayBtn.textContent = today;
}

function renderHourly(dayIndex) {
  hourly.innerHTML = "";

  const date = weatherData.daily.time[dayIndex];

  const data = weatherData.hourly;

  data.time.forEach((time, index) => {
    if (!time.startsWith(date)) return;

    const item = document.createElement("div");

    const hour = new Date(time).toLocaleTimeString("en-US", {
      hour: "numeric",
      hour12: true,
    });

    item.className =
      "flex items-center justify-between rounded-lg bg-n-700 p-3";

    item.innerHTML = `
      <div class="flex items-center gap-3">

        <img
          src="${icon(data.weather_code[index])}"
          class="h-8 w-8"
          alt="Weather"
        >

        <span>${hour}</span>

      </div>

      <span>
        ${temp(data.temperature_2m[index])}
      </span>
    `;

    hourly.append(item);
  });
}

async function suggestions(value) {
  if (value.length < 2) {
    results.classList.add("hidden");
    return;
  }

  try {
    const url =
      `${GEO}?name=${encodeURIComponent(value)}` +
      `&count=10` +
      `&language=en` +
      `&format=json`;

    const response = await fetch(url);

    if (!response.ok) {
      throw new Error("Search failed");
    }

    const data = await response.json();

    results.innerHTML = "";

    data.results?.forEach((location) => {
      const button = document.createElement("button");

      button.className = "block w-full px-4 py-3 text-left hover:bg-n-700";

      const region = location.admin1 ? `, ${location.admin1}` : "";

      button.textContent = `${location.name}${region}, ${location.country}`;

      button.onclick = async () => {
        results.classList.add("hidden");

        searchInput.value = "";

        lastSearch = location.name;

        localStorage.setItem("lastLocation", location.name);

        showLoading();

        try {
          locationData = location;

          weatherData = await getWeather(locationData);

          selectedDay = 0;

          renderWeather();
        } catch (err) {
          showError(err.message);
        }
      };

      results.append(button);
    });

    results.classList.toggle("hidden", !data.results?.length);
  } catch {
    results.classList.add("hidden");
  }
}

searchForm.addEventListener("submit", (event) => {
  event.preventDefault();

  const city = searchInput.value.trim();

  if (!city) return;

  results.classList.add("hidden");

  searchWeather(city);
});

searchInput.addEventListener("input", () => {
  clearTimeout(window.searchTimer);

  const value = searchInput.value.trim();

  window.searchTimer = setTimeout(() => {
    suggestions(value);
  }, 300);
});

dayBtn.addEventListener("click", () => {
  days.classList.toggle("hidden");
});

unitsBtn.addEventListener("click", () => {
  units.classList.toggle("hidden");
});

if (imperialBtn) {
  imperialBtn.addEventListener("click", () => {
    units.dataset.temp = "fahrenheit";
    units.dataset.wind = "mph";
    units.dataset.precip = "inch";

    document.querySelectorAll("[data-temp] b").forEach((check) => {
      check.classList.add("hidden");
    });

    document.querySelectorAll("[data-wind] b").forEach((check) => {
      check.classList.add("hidden");
    });

    document.querySelectorAll("[data-precip] b").forEach((check) => {
      check.classList.add("hidden");
    });

    const fahrenheitCheck = document.querySelector(
      '[data-temp="fahrenheit"] b',
    );

    if (fahrenheitCheck) {
      fahrenheitCheck.classList.remove("hidden");
    }

    const mphCheck = document.querySelector('[data-wind="mph"] b');

    if (mphCheck) {
      mphCheck.classList.remove("hidden");
    }

    const inchCheck = document.querySelector('[data-precip="inch"] b');

    if (inchCheck) {
      inchCheck.classList.remove("hidden");
    }

    units.classList.add("hidden");

    if (weatherData) {
      renderWeather();
    }
  });
}

document.querySelectorAll("[data-temp]").forEach((button) => {
  button.onclick = () => {
    units.dataset.temp = button.dataset.temp;

    document.querySelectorAll("[data-temp] b").forEach((check) => {
      check.classList.add("hidden");
    });

    button.querySelector("b").classList.remove("hidden");

    if (weatherData) {
      renderWeather();
    }
  };
});

document.querySelectorAll("[data-wind]").forEach((button) => {
  button.onclick = () => {
    units.dataset.wind = button.dataset.wind;

    document.querySelectorAll("[data-wind] b").forEach((check) => {
      check.classList.add("hidden");
    });

    button.querySelector("b").classList.remove("hidden");

    if (weatherData) {
      renderWeather();
    }
  };
});

document.querySelectorAll("[data-precip]").forEach((button) => {
  button.onclick = () => {
    units.dataset.precip = button.dataset.precip;

    document.querySelectorAll("[data-precip] b").forEach((check) => {
      check.classList.add("hidden");
    });

    button.querySelector("b").classList.remove("hidden");

    if (weatherData) {
      renderWeather();
    }
  };
});

retry.addEventListener("click", () => {
  if (lastSearch) {
    searchWeather(lastSearch);
  }
});

document.addEventListener("click", (event) => {
  if (!unitsBtn.contains(event.target) && !units.contains(event.target)) {
    units.classList.add("hidden");
  }

  if (!dayBtn.contains(event.target) && !days.contains(event.target)) {
    days.classList.add("hidden");
  }

  if (!searchInput.contains(event.target) && !results.contains(event.target)) {
    results.classList.add("hidden");
  }
});

const savedLocation = localStorage.getItem("lastLocation");

if (savedLocation) {
  searchWeather(savedLocation);
} else {
  searchWeather("Berlin");
}

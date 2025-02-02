// Global variable for the map
let map;

// Define color mapping for probability ranges
// Expected probability_range values: "<60%", "60%-70%", "70%-80%", "80%-90%", ">=90%"
const rangeToColor = {
  "<60%": "green",
  "60%-70%": "yellow",
  "70%-80%": "orange",
  "80%-90%": "red",
  ">=90%": "darkred"
};

document.addEventListener("DOMContentLoaded", () => {
  console.log("DOM fully loaded and parsed");
  initMap();
  const searchBtn = document.getElementById("search-btn");
  const addressInput = document.getElementById("address-input");

  if (searchBtn && addressInput) {
    console.log("Search elements found");
    searchBtn.addEventListener("click", handleAddressSearch);
    addressInput.addEventListener("keypress", (e) => {
      if (e.key === "Enter") {
        handleAddressSearch();
      }
    });
  } else {
    console.error("Search elements not found");
  }
});

// Initialize the Leaflet map
function initMap() {
  console.log("Initializing map...");
  // Center the map on California
  map = L.map("map").setView([37.0, -120.0], 6);
  console.log("Map initialized at center [37.0, -120.0]");

  // Add a base tile layer from OpenStreetMap
  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: "© OpenStreetMap contributors"
  }).addTo(map);

  // Load transmission lines GeoJSON data
  loadGeojsonData();
}

// Load GeoJSON data from the local file transmission_line_fire_risk_full.geojson
async function loadGeojsonData() {
  try {
    console.log("Fetching GeoJSON data...");
    const response = await fetch("transmission_line_fire_risk_full.geojson");
    if (!response.ok) throw new Error("Failed to load GeoJSON");
    const geojson = await response.json();
    console.log("GeoJSON data loaded:", geojson);

    // Add the GeoJSON layer to the map with custom styling
    L.geoJSON(geojson, {
      style: styleFeature,
      onEachFeature: onEachFeature
    }).addTo(map);
    console.log("GeoJSON layer added to map");
  } catch (err) {
    console.error("Error loading GeoJSON:", err);
    alert("Error loading map data. Please check the console for details.");
  }
}

// Style each feature based on its probability_range attribute
function styleFeature(feature) {
  const probRange = feature.properties.probability_range;
  const color = rangeToColor[probRange] || "gray";
  return {
    color: color,
    weight: 2
  };
}

// Attach tooltips to features
function onEachFeature(feature, layer) {
  if (feature.properties && feature.properties.fire_probability) {
    layer.bindTooltip("Fire Probability: " + feature.properties.fire_probability);
  }
}

// Handle address search using Nominatim for geocoding
async function handleAddressSearch() {
  console.log("Search button clicked");
  const address = document.getElementById("address-input").value.trim();
  if (!address) {
    alert("Please enter an address");
    return;
  }
  console.log("Searching for address:", address);
  try {
    const coords = await geocodeAddress(address);
    if (coords) {
      console.log("Geocoded coordinates:", coords);
      map.setView(coords, 13);
      // Optionally add a marker at the search result
      L.marker(coords).addTo(map)
        .bindPopup("Search result: " + address)
        .openPopup();
    } else {
      alert("Address not found. Please try another address.");
    }
  } catch (err) {
    console.error("Geocoding error:", err);
    alert("Error occurred during geocoding.");
  }
}

// Geocode the address using the Nominatim API
async function geocodeAddress(address) {
  try {
    console.log("Geocoding address:", address);
    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}`;
    console.log("Geocoding URL:", url);
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    console.log("Geocoding response:", data);
    if (data && data.length > 0) {
      const coords = [parseFloat(data[0].lat), parseFloat(data[0].lon)];
      console.log("Found coordinates:", coords);
      return coords;
    }
    console.log("No results found");
    return null;
  } catch (error) {
    console.error("Geocoding error:", error);
    throw error;
  }
}

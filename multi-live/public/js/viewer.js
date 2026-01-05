import { db } from "./firebase.js";
import { ref, onValue, set, remove }
from "https://www.gstatic.com/firebasejs/9.23.0/firebase-database.js";

/* 🔒 Always use current domain */
const BASE_URL = window.location.origin;

/* ---------- HELPERS ---------- */
function makeSlug(text) {
  return text
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "");
}

/* ---------- MAP STATE ---------- */
let map = null;
const markers = {};
const tripsDiv = document.getElementById("trips");

/* ---------- SAFE GOOGLE MAP INIT ---------- */
/* ❌ No callback
   ❌ No window.initMap
   ✅ Poll until Google Maps is ready */
function waitForGoogleMaps() {
  if (window.google && window.google.maps) {
    initMap();
  } else {
    setTimeout(waitForGoogleMaps, 100);
  }
}

function initMap() {
  if (map) return; // prevent double init

  map = new google.maps.Map(document.getElementById("map"), {
    center: { lat: 20.5937, lng: 78.9629 },
    zoom: 5,
  });

  startFirebaseListener();
}

/* Start checking immediately */
waitForGoogleMaps();

/* ---------- ACTIONS ---------- */
window.addTrip = function () {
  const driverName = prompt("Driver Name");
  const leaderName = prompt("Leader Name");
  if (!driverName || !leaderName) return;

  const driverId = makeSlug(driverName);

  set(ref(db, "trips/" + driverId), {
    driverName,
    leaderName,
    status: "active",
    createdAt: Date.now(),
  });
};

window.copyLink = function (link) {
  navigator.clipboard.writeText(link);
  alert("Link copied. Send it to the driver.");
};

window.endTrip = function (driverId) {
  set(ref(db, "trips/" + driverId + "/status"), "ended");

  if (markers[driverId]) {
    markers[driverId].setMap(null);
    delete markers[driverId];
  }
};

window.deleteTrip = function (driverId) {
  if (!confirm("Delete this trip permanently?")) return;

  remove(ref(db, "trips/" + driverId));
  remove(ref(db, "locations/" + driverId));

  if (markers[driverId]) {
    markers[driverId].setMap(null);
    delete markers[driverId];
  }
};

/* ---------- FIREBASE LISTENER ---------- */
function startFirebaseListener() {
  onValue(ref(db), (snapshot) => {
    const data = snapshot.val() || {};
    const trips = data.trips || {};
    const locations = data.locations || {};

    tripsDiv.innerHTML = "";

    Object.entries(trips).forEach(([driverId, trip]) => {
      const isEnded = trip.status === "ended";
      const loc = locations[driverId];
      const link = `${BASE_URL}/driver.html?id=${driverId}`;

      const div = document.createElement("div");
      div.className = "trip" + (isEnded ? " ended" : "");
      div.innerHTML = `
        <div class="trip-info">
          <b>${trip.driverName}</b>
          <span>Leader: ${trip.leaderName}</span>
          <span>Status: ${trip.status}</span>
        </div>
        <div class="link">${link}</div>
        <div class="trip-actions">
          <button onclick="copyLink('${link}')">📋 Copy</button>
          ${isEnded ? "" : `<button onclick="endTrip('${driverId}')">🛑 End</button>`}
          <button onclick="deleteTrip('${driverId}')">🗑️ Delete</button>
        </div>
      `;

      div.onclick = () => {
        if (markers[driverId]) {
          map.setCenter(markers[driverId].getPosition());
          map.setZoom(18);
        }
      };

      tripsDiv.appendChild(div);

      if (!isEnded && loc) {
        const position = { lat: loc.lat, lng: loc.lng };

        if (!markers[driverId]) {
          markers[driverId] = new google.maps.Marker({
            position,
            map,
            title: trip.driverName,
          });
        } else {
          markers[driverId].setPosition(position);
        }
      }
    });
  });
}


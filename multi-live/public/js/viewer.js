import { db } from "./firebase.js";
import { ref, onValue, set, remove }
from "https://www.gstatic.com/firebasejs/9.23.0/firebase-database.js";

const BASE_URL = "https://multi-live-vivg.vercel.app";

function makeSlug(text) {
  return text
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "");
}

let map;                 // ⬅️ important
const markers = {};
const tripsDiv = document.getElementById("trips");

/* 🔑 GOOGLE MAP INIT (called by Google Maps itself) */
window.initMap = function () {
  map = new google.maps.Map(document.getElementById("map"), {
    center: { lat: 20.5937, lng: 78.9629 },
    zoom: 5,
  });

  startFirebaseListener(); // 🔥 start listening ONLY after map is ready
};

/* ---- ADD TRIP ---- */
window.addTrip = function () {
  const driverName = prompt("Driver Name");
  const leaderName = prompt("Leader Name");
  if (!driverName || !leaderName) return;

  const driverId = makeSlug(driverName);

  set(ref(db, "trips/" + driverId), {
    driverName,
    leaderName,
    status: "active",
    createdAt: Date.now()
  });
};

/* ---- COPY LINK ---- */
window.copyLink = function (link) {
  navigator.clipboard.writeText(link);
  alert("Link copied. Send it to the driver.");
};

/* ---- END TRIP ---- */
window.endTrip = function (driverId) {
  set(ref(db, "trips/" + driverId + "/status"), "ended");

  if (markers[driverId]) {
    markers[driverId].setMap(null);
    delete markers[driverId];
  }
};

/* ---- DELETE TRIP ---- */
window.deleteTrip = function (driverId) {
  if (!confirm("Delete this trip permanently?")) return;

  remove(ref(db, "trips/" + driverId));
  remove(ref(db, "locations/" + driverId));

  if (markers[driverId]) {
    markers[driverId].setMap(null);
    delete markers[driverId];
  }
};

/* 🔥 Firebase listener (called AFTER map init) */
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


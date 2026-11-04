
/* =====================================
   HAMSTER GARDEN 3.0
   SQUEEKCHAIN LIVE DASHBOARD
   ===================================== */

// ---------- GAME DATA ----------

const GAME_KEY = "hamsterGardenV3";
const TODAY = new Date().toLocaleDateString("en-CA");

let oldData = {};

try {
  oldData = JSON.parse(
    localStorage.getItem(GAME_KEY) || "{}"
  );
} catch (error) {
  oldData = {};
}

let game = {
  xp: oldData.xp ?? Number(localStorage.getItem("hamsterXP")) ?? 0,
  carrots: oldData.carrots ?? Number(localStorage.getItem("hamsterCarrots")) ?? 0,
  waterCount: oldData.waterCount ?? Number(localStorage.getItem("hamsterWater")) ?? 0,

  feedsToday: oldData.date === TODAY ? (oldData.feedsToday || 0) : 0,
  watersToday: oldData.date === TODAY ? (oldData.watersToday || 0) : 0,

  achievements: oldData.achievements || []
};

// ---------- SAVE GAME ----------

function saveGame() {
  game.date = TODAY;

  localStorage.setItem(GAME_KEY, JSON.stringify(game));
  localStorage.setItem("hamsterXP", game.xp);
  localStorage.setItem("hamsterCarrots", game.carrots);
  localStorage.setItem("hamsterWater", game.waterCount);
}

// ---------- LEVEL SYSTEM ----------

function getLevel() {
  return Math.floor(game.xp / 100) + 1;
}

// ---------- ACHIEVEMENTS ----------

function unlock(id, name) {
  if (game.achievements.includes(id)) return;

  game.achievements.push(id);

  const message = document.getElementById("message");

  if (message) {
    message.textContent = "🏆 Achievement unlocked: " + name;
  }

  saveGame();
}

function checkAchievements() {
  if (game.carrots >= 1)
    unlock("first_feed", "First Feeding");

  if (game.waterCount >= 1)
    unlock("first_water", "Garden Keeper");

  if (game.xp >= 100)
    unlock("level_up", "Level Up");

  if (game.carrots >= 10)
    unlock("carrot_master", "Carrot Master");

  if (game.waterCount >= 10)
    unlock("garden_master", "Garden Master");
}

// ---------- DAILY QUESTS ----------

function renderExtraFeatures() {
  let panel = document.getElementById("extraFeatures");

  if (!panel) {
    const container = document.querySelector(".game");

    if (!container) return;

    panel = document.createElement("div");
    panel.id = "extraFeatures";

    panel.style.cssText =
      "background:#315c43;color:white;padding:18px;" +
      "border-radius:16px;margin-top:20px;text-align:left;";

    container.appendChild(panel);
  }

  const achievements = [
    ["first_feed", "🥕 First Feeding"],
    ["first_water", "🌱 Garden Keeper"],
    ["level_up", "⭐ Level Up"],
    ["carrot_master", "🏆 Carrot Master"],
    ["garden_master", "🌻 Garden Master"]
  ];

  panel.innerHTML = `
    <h3>🌞 Daily Quests</h3>

    <p>🥕 Feed hamster:
      ${Math.min(game.feedsToday, 3)}/3
    </p>

    <p>💧 Water garden:
      ${Math.min(game.watersToday, 3)}/3
    </p>

    <p>⭐ Total XP: ${game.xp}</p>
    <p>🥕 Total carrots: ${game.carrots}</p>
    <p>🌻 Total watering: ${game.waterCount}</p>

    <hr>

    <h3>🏆 Achievements</h3>

    ${achievements.map(item => `
      <p>
        ${game.achievements.includes(item[0]) ? "✅" : "🔒"}
        ${item[1]}
      </p>
    `).join("")}
  `;
}

// ---------- UPDATE GAME ----------

function updateGame() {
  const xpElement = document.getElementById("xp");
  const levelElement = document.getElementById("level");

  if (xpElement) {
    xpElement.textContent = game.xp;
  }

  if (levelElement) {
    levelElement.textContent = "Level " + getLevel();
  }

  checkAchievements();
  renderExtraFeatures();
  saveGame();
}

// ---------- FEED HAMSTER ----------

function feed() {
  game.carrots++;
  game.feedsToday++;
  game.xp += 10;

  const hamster = document.getElementById("hamster");
  const message = document.getElementById("message");

  if (hamster) hamster.textContent = "🐹";

  if (message) {
    message.textContent =
      "Yummy! Your hamster loves carrots! 🥕";
  }

  updateGame();
}

// ---------- WATER GARDEN ----------

function water() {
  game.waterCount++;
  game.watersToday++;
  game.xp += 5;

  const garden = document.getElementById("garden");
  const message = document.getElementById("message");

  if (garden) {
    garden.textContent = "🌷 🌻 🌼 🌸 🌺 🌻";
  }

  if (message) {
    message.textContent =
      "Your garden is growing! 🌱";
  }

  updateGame();
}

// =====================================
// SQUEEKCHAIN LIVE API
// =====================================

const SQUEEK_API =
  "https://api.squeekchain.com/v1";

async function refreshSqueek() {
  const statusBox = document.getElementById("chainStatus");
  const dataBox = document.getElementById("chainData");
  const updatedBox = document.getElementById("lastUpdated");

  if (!statusBox || !dataBox) return;

  statusBox.textContent = "⏳ Connecting to Squeekchain...";

  try {
    const [statusResponse, coreResponse] = await Promise.all([
      fetch(SQUEEK_API + "/status", {
        headers: { accept: "application/json" },
        cache: "no-store"
      }),

      fetch(SQUEEK_API + "/core", {
        headers: { accept: "application/json" },
        cache: "no-store"
      })
    ]);

    if (!statusResponse.ok) {
      throw new Error("Status API HTTP " + statusResponse.status);
    }

    if (!coreResponse.ok) {
      throw new Error("Core API HTTP " + coreResponse.status);
    }

    const status = await statusResponse.json();
    const coreData = await coreResponse.json();

    // Check API availability
    if (status.schemaVersion !== 1) {
      throw new Error("Unsupported status API schema");
    }

    if (coreData.schemaVersion !== 1) {
      throw new Error("Unsupported core API schema");
    }

    const measurement = status.measurement || {};
    const anchor = status.builder?.anchor || {};
    const settled = coreData.core || {};

    const isOnline = measurement.freshness === "online";
    const isCoreAvailable = coreData.status === "available";

    statusBox.textContent =
      (isOnline ? "🟢 Wheel Online" : "🟡 Wheel: " +
      (measurement.freshness || "Unknown")) +
      " | " +
      (isCoreAvailable ? "⛓️ Core Available" :
      "Core: " + (coreData.reason || coreData.status || "Unknown"));

    // Convert units
    const rpm = measurement.rpmMilli != null
      ? (measurement.rpmMilli / 1000).toFixed(2)
      : "Unknown";

    const speed = measurement.speedMmPerSecond != null
      ? (measurement.speedMmPerSecond / 1000).toFixed(3) + " m/s"
      : "Unknown";

    const distance = measurement.distanceMm != null
      ? (measurement.distanceMm / 1000).toFixed(2) + " m"
      : "Unknown";

    // Block progress uses 1 billion units per block
    const progress = anchor.blockProgress != null
      ? (Number(anchor.blockProgress) / 10000000).toFixed(2) + "%"
      : "Unknown";

    const dashboard = `
🐹 HAMSTER GARDEN 3.0
================================

📡 PIPELINE STATUS

Wheel: ${measurement.freshness || "Unknown"}
Hardware: ${measurement.provenance || "Unknown"}
Core status: ${measurement.coreStatus || "Unknown"}

================================

⚡ HAMSTER MEASUREMENTS

Wheel RPM: ${rpm}
Speed: ${speed}
Distance: ${distance}
Work Units: ${measurement.cumulativeWorkUnits || "Unknown"}

================================

⛓️ BLOCKCHAIN DATA

Network: ${coreData.chain?.target || "Unknown"}
Chain ID: ${coreData.chain?.chainId || "Unknown"}

Settled Block Height:
${isCoreAvailable ? (settled.blockHeight ?? "Unknown") : "Unavailable"}

Builder Anchor Block Height:
${anchor.blockHeight ?? "Unknown"}

Builder Block Progress:
${progress}

Oracle: ${status.oracle?.state || "Unknown"}

Settlement Queue:
${status.settlementQueue?.state || "Unknown"}

================================

🔐 TRANSACTION

Latest confirmed transaction:
${status.settlementQueue?.latestSubmission?.transactionHash || "Unknown"}

================================

🕒 API Generated:
${status.generatedAt || "Unknown"}

Last checked:
${new Date().toLocaleString()}
`;

    dataBox.textContent = dashboard;

    if (updatedBox) {
      updatedBox.textContent =
        "Updated: " + new Date().toLocaleString();
    }

  } catch (error) {
    statusBox.textContent =
      "⚠️ Squeekchain API unavailable";

    dataBox.textContent =
      "Could not load live data.\n\n" +
      error.message +
      "\n\nPlease try again later.";
  }
}

// =====================================
// START GAME
// =====================================

updateGame();

// Start API connection
refreshSqueek();

// Refresh every 30 seconds
setInterval(refreshSqueek, 30000);



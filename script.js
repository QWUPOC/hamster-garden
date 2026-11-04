
"use strict";

/* =========================================
   HAMSTER GARDEN
   Local game + real Squeekchain API
========================================= */

const GAME_KEY = "hamsterGardenV3";
const API_BASE = "https://api.squeekchain.com/v1";
const LEVEL_XP = 100;
const DAILY_TARGET = 3;
const REFRESH_INTERVAL = 30000;

const $ = (id) => document.getElementById(id);

function localDateKey() {
  const d = new Date();
  return [
    d.getFullYear(),
    String(d.getMonth() + 1).padStart(2, "0"),
    String(d.getDate()).padStart(2, "0")
  ].join("-");
}

function safeNumber(value) {
  const number = Number(value);
  return Number.isFinite(number) && number >= 0 ? number : 0;
}

function loadGame() {
  let saved = {};

  try {
    saved = JSON.parse(localStorage.getItem(GAME_KEY) || "{}");
  } catch (error) {
    console.warn("Could not read saved game:", error);
  }

  const legacyXP = localStorage.getItem("hamsterXP");
  const legacyCarrots = localStorage.getItem("hamsterCarrots");
  const legacyWater = localStorage.getItem("hamsterWater");

  const isToday = saved.date === localDateKey();

  return {
    xp: safeNumber(saved.xp ?? legacyXP),
    carrots: safeNumber(saved.carrots ?? legacyCarrots),
    waterCount: safeNumber(saved.waterCount ?? legacyWater),
    feedsToday: isToday ? safeNumber(saved.feedsToday) : 0,
    watersToday: isToday ? safeNumber(saved.watersToday) : 0,
    achievements: Array.isArray(saved.achievements)
      ? saved.achievements
      : []
  };
}

let game = loadGame();

function saveGame() {
  try {
    const data = {
      ...game,
      date: localDateKey()
    };

    localStorage.setItem(GAME_KEY, JSON.stringify(data));
    localStorage.setItem("hamsterXP", String(game.xp));
    localStorage.setItem("hamsterCarrots", String(game.carrots));
    localStorage.setItem("hamsterWater", String(game.waterCount));
    return true;
  } catch (error) {
    console.error("Could not save game:", error);
    showMessage("⚠️ Browser storage is unavailable.");
    return false;
  }
}

function getLevel() {
  return Math.floor(game.xp / LEVEL_XP) + 1;
}

function getLevelProgress() {
  return game.xp % LEVEL_XP;
}

/* =========================================
   ACHIEVEMENTS
========================================= */

const ACHIEVEMENTS = [
  { id: "first_feed", name: "First Feeding", icon: "🥕",
    condition: () => game.carrots >= 1 },
  { id: "first_water", name: "Garden Keeper", icon: "🌱",
    condition: () => game.waterCount >= 1 },
  { id: "level_up", name: "Level Up", icon: "⭐",
    condition: () => game.xp >= LEVEL_XP },
  { id: "carrot_master", name: "Carrot Master", icon: "🏆",
    condition: () => game.carrots >= 10 },
  { id: "garden_master", name: "Garden Master", icon: "🌻",
    condition: () => game.waterCount >= 10 }
];

function checkAchievements() {
  let unlocked = null;

  for (const achievement of ACHIEVEMENTS) {
    if (
      !game.achievements.includes(achievement.id) &&
      achievement.condition()
    ) {
      game.achievements.push(achievement.id);
      unlocked = achievement;
    }
  }

  if (unlocked) {
    showMessage("🏆 Achievement unlocked: " + unlocked.name);
  }
}

function renderAchievements() {
  const container = $("achievements");
  if (!container) return;

  container.replaceChildren();

  for (const achievement of ACHIEVEMENTS) {
    const item = document.createElement("div");
    item.className = "achievement";

    const isUnlocked = game.achievements.includes(achievement.id);

    const icon = document.createElement("span");
    icon.textContent = isUnlocked ? "✅" : "🔒";

    const name = document.createElement("span");
    name.textContent = achievement.icon + " " + achievement.name;

    item.append(icon, name);
    container.appendChild(item);
  }
}

/* =========================================
   GAME DISPLAY
========================================= */

function showMessage(message) {
  const element = $("message");
  if (element) element.textContent = message;
}

function renderGame() {
  const level = getLevel();
  const progress = getLevelProgress();

  $("xp").textContent = game.xp;
  $("level").textContent = "Level " + level;
  $("xpProgress").style.width = progress + "%";
  $("levelProgress").textContent =
    progress + " / " + LEVEL_XP + " XP to next level";

  $("feedQuest").textContent =
    Math.min(game.feedsToday, DAILY_TARGET) + " / " + DAILY_TARGET;

  $("waterQuest").textContent =
    Math.min(game.watersToday, DAILY_TARGET) + " / " + DAILY_TARGET;

  $("carrotTotal").textContent = game.carrots;
  $("waterTotal").textContent = game.waterCount;
  $("totalXP").textContent = game.xp;

  renderAchievements();
}

function updateGame() {
  checkAchievements();
  renderGame();
  saveGame();
}

/* =========================================
   GAME ACTIONS
========================================= */

function feed() {
  game.carrots += 1;
  game.feedsToday += 1;
  game.xp += 10;

  $("hamster").textContent = "🐹";
  showMessage("Yummy! Your hamster loves carrots! 🥕");

  updateGame();
}

function water() {
  game.waterCount += 1;
  game.watersToday += 1;
  game.xp += 5;

  const garden = $("garden");
  const stages = [
    "🌱 🌷 🌱 🌼 🌱",
    "🌷 🌻 🌼 🌸 🌺",
    "🌻 🌺 🌷 🌼 🌸 🌻"
  ];

  garden.textContent = stages[
    Math.min(2, Math.floor(game.waterCount / 3))
  ];

  showMessage("Your garden is growing! 🌱");
  updateGame();
}

/* =========================================
   REAL SQUEEKCHAIN API
========================================= */

function displayValue(id, value) {
  const element = $(id);
  if (element) {
    element.textContent =
      value === null || value === undefined || value === ""
        ? "Not available"
        : String(value);
  }
}

async function fetchJSON(path) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 12000);

  try {
    const response = await fetch(API_BASE + path, {
      method: "GET",
      headers: { Accept: "application/json" },
      cache: "no-store",
      signal: controller.signal
    });

    if (!response.ok) {
      throw new Error("HTTP " + response.status);
    }

    return await response.json();
  } finally {
    clearTimeout(timeout);
  }
}

function resetNetworkDisplay() {
  const fields = [
    "networkName", "chainId", "wheelStatus", "coreStatus",
    "rpm", "speed", "distance", "workUnits",
    "blockHeight", "builderBlock", "oracleStatus",
    "queueStatus", "transactionHash"
  ];

  fields.forEach(id => displayValue(id, "Not available"));
}

function formatNumber(value, divisor, decimals, suffix = "") {
  if (value === null || value === undefined) {
    return "Not available";
  }

  const number = Number(value);
  if (!Number.isFinite(number)) return "Not available";

  return (number / divisor).toFixed(decimals) + suffix;
}

function renderNetwork(status, coreData) {
  const measurement = status.measurement || {};
  const anchor = status.builder?.anchor || {};
  const core = coreData.core || {};
  const chain = coreData.chain || {};

  displayValue("networkName", chain.target);
  displayValue("chainId", chain.chainId);

  displayValue(
    "wheelStatus",
    measurement.freshness
  );

  displayValue(
    "coreStatus",
    coreData.status
  );

  displayValue(
    "rpm",
    formatNumber(measurement.rpmMilli, 1000, 2)
  );

  displayValue(
    "speed",
    formatNumber(
      measurement.speedMmPerSecond, 1000, 3, " m/s"
    )
  );

  displayValue(
    "distance",
    formatNumber(measurement.distanceMm, 1000, 2, " m")
  );

  displayValue("workUnits", measurement.cumulativeWorkUnits);

  displayValue(
    "blockHeight",
    coreData.status === "available" ? core.blockHeight : "Unavailable"
  );

  displayValue("builderBlock", anchor.blockHeight);
  displayValue("oracleStatus", status.oracle?.state);
  displayValue("queueStatus", status.settlementQueue?.state);

  displayValue(
    "transactionHash",
    status.settlementQueue?.latestSubmission?.transactionHash
  );

  const online = measurement.freshness === "online";
  const available = coreData.status === "available";

  $("chainStatus").textContent =
    (online ? "🟢 Wheel online" : "🟡 Wheel: " +
      (measurement.freshness || "Unknown")) +
    " | " +
    (available ? "⛓️ Core available" : "Core: " +
      (coreData.reason || coreData.status || "Unknown"));

  $("apiIndicator").textContent =
    online && available ? "LIVE" : "PARTIAL DATA";

  $("apiIndicator").className =
    "indicator " + (online && available ? "online" : "partial");

  $("chainData").textContent = JSON.stringify(
    { status, core: coreData },
    null,
    2
  );

  $("lastUpdated").textContent =
    "Last checked: " + new Date().toLocaleString();
}

let apiRequestRunning = false;

async function refreshSqueek() {
  if (apiRequestRunning) return;

  apiRequestRunning = true;

  const button = $("refreshButton");
  const statusBox = $("chainStatus");

  button.disabled = true;
  button.textContent = "⏳ Loading...";
  statusBox.textContent = "Connecting to Squeekchain...";

  try {
    const [status, coreData] = await Promise.all([
      fetchJSON("/status"),
      fetchJSON("/core")
    ]);

    if (
      status.schemaVersion !== 1 ||
      coreData.schemaVersion !== 1
    ) {
      throw new Error("Unsupported API response schema.");
    }

    renderNetwork(status, coreData);

  } catch (error) {
    resetNetworkDisplay();

    $("apiIndicator").textContent = "OFFLINE";
    $("apiIndicator").className = "indicator offline";

    statusBox.textContent = "⚠️ Squeekchain API unavailable";

    $("chainData").textContent =
      "Live data could not be retrieved.\n" +
      "Reason: " + error.message + "\n\n" +
      "No simulated blockchain data is displayed.";

    $("lastUpdated").textContent =
      "Failed check: " + new Date().toLocaleString();

    console.error("Squeekchain API error:", error);

  } finally {
    apiRequestRunning = false;
    button.disabled = false;
    button.textContent = "🔄 Refresh network data";
  }
}

/* =========================================
   STARTUP
========================================= */

document.addEventListener("DOMContentLoaded", () => {
  $("feedButton").addEventListener("click", feed);
  $("waterButton").addEventListener("click", water);
  $("refreshButton").addEventListener("click", refreshSqueek);

  updateGame();

  resetNetworkDisplay();
  refreshSqueek();

  setInterval(refreshSqueek, REFRESH_INTERVAL);
});

window.feed = feed;
window.water = water;
window.refreshSqueek = refreshSqueek;


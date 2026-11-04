
"use strict";

// HAMSTER GARDEN - compatible with current index.html

const GAME_KEY = "hamsterGardenV3";
const API_BASE = "https://api.squeekchain.com/v1";

function todayKey() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function getNumber(value) {
  const n = Number(value);
  return Number.isFinite(n) && n >= 0 ? n : 0;
}

function loadGame() {
  let saved = {};

  try {
    saved = JSON.parse(localStorage.getItem(GAME_KEY) || "{}");
  } catch (e) {}

  return {
    xp: getNumber(saved.xp ?? localStorage.getItem("hamsterXP")),
    carrots: getNumber(saved.carrots ?? localStorage.getItem("hamsterCarrots")),
    waterCount: getNumber(saved.waterCount ?? localStorage.getItem("hamsterWater")),
    feedsToday: saved.date === todayKey() ? getNumber(saved.feedsToday) : 0,
    watersToday: saved.date === todayKey() ? getNumber(saved.watersToday) : 0
  };
}

let game = loadGame();

function saveGame() {
  try {
    localStorage.setItem(GAME_KEY, JSON.stringify({
      ...game,
      date: todayKey()
    }));

    localStorage.setItem("hamsterXP", String(game.xp));
    localStorage.setItem("hamsterCarrots", String(game.carrots));
    localStorage.setItem("hamsterWater", String(game.waterCount));
  } catch (e) {
    console.error("Save error:", e);
  }
}

function showMessage(message) {
  const el = document.getElementById("message");
  if (el) el.textContent = message;
}

function updateGame() {
  const xp = document.getElementById("xp");
  const level = document.getElementById("level");

  if (xp) xp.textContent = game.xp;
  if (level) level.textContent = "Level " + (Math.floor(game.xp / 100) + 1);

  saveGame();
}

function feed() {
  game.carrots++;
  game.feedsToday++;
  game.xp += 10;

  const hamster = document.getElementById("hamster");
  if (hamster) hamster.textContent = "🐹";

  showMessage("Yummy! Your hamster loves carrots! 🥕");
  updateGame();
}

function water() {
  game.waterCount++;
  game.watersToday++;
  game.xp += 5;

  const garden = document.getElementById("garden");

  if (garden) {
    const stages = [
      "🌱 🌷 🌱 🌼 🌱",
      "🌷 🌻 🌼 🌸 🌺",
      "🌻 🌺 🌷 🌼 🌸 🌻"
    ];

    garden.textContent = stages[
      Math.min(2, Math.floor(game.waterCount / 3))
    ];
  }

  showMessage("Your garden is growing! 🌱");
  updateGame();
}

// SQUEEKCHAIN API

async function refreshSqueek() {
  const status = document.getElementById("chainStatus");
  const data = document.getElementById("chainData");
  const updated = document.getElementById("lastUpdated");

  if (status) status.textContent = "Connecting to Squeekchain...";

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 12000);

    let results;

    try {
      const responses = await Promise.all([
        fetch(API_BASE + "/status", {
          signal: controller.signal,
          cache: "no-store"
        }),
        fetch(API_BASE + "/core", {
          signal: controller.signal,
          cache: "no-store"
        })
      ]);

      if (!responses[0].ok || !responses[1].ok) {
        throw new Error("API response error");
      }

      results = await Promise.all(
        responses.map(response => response.json())
      );
    } finally {
      clearTimeout(timeout);
    }

    if (status) {
      status.textContent = "🟢 Squeekchain API connected";
    }

    if (data) {
      data.textContent = JSON.stringify({
        status: results[0],
        core: results[1]
      }, null, 2);
    }

    if (updated) {
      updated.textContent = "Last checked: " + new Date().toLocaleString();
    }

  } catch (error) {
    if (status) {
      status.textContent = "⚠️ Squeekchain API unavailable";
    }

    if (data) {
      data.textContent =
        "Could not retrieve live blockchain data.\n" +
        "Reason: " + error.message;
    }

    if (updated) {
      updated.textContent = "Failed check: " + new Date().toLocaleString();
    }

    console.error("Squeekchain API error:", error);
  }
}

// Make functions available to HTML buttons
window.feed = feed;
window.water = water;
window.refreshSqueek = refreshSqueek;

// Start game
document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("feedButton").addEventListener("click", feed);
  document.getElementById("waterButton").addEventListener("click", water);
  document.getElementById("refreshButton").addEventListener("click", refreshSqueek);

  updateGame();
  refreshSqueek();
  setInterval(refreshSqueek, 30000);
});



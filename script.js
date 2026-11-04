
const KEY = "hamsterGardenV2";
const API = "https://api.squeekchain.com/v1";

function getToday() {
  const d = new Date();
  return [
    d.getFullYear(),
    String(d.getMonth() + 1).padStart(2, "0"),
    String(d.getDate()).padStart(2, "0")
  ].join("-");
}

const today = getToday();

let saved = {};

try {
  saved = JSON.parse(localStorage.getItem(KEY) || "{}");
} catch (e) {
  saved = {};
}

let game = {
  xp: Number(saved.xp ?? localStorage.getItem("hamsterXP") ?? 0),
  carrots: Number(saved.carrots ?? localStorage.getItem("hamsterCarrots") ?? 0),
  waterCount: Number(saved.waterCount ?? localStorage.getItem("hamsterWater") ?? 0),
  feedsToday: saved.date === today ? Number(saved.feedsToday || 0) : 0,
  watersToday: saved.date === today ? Number(saved.watersToday || 0) : 0,
  achievements: Array.isArray(saved.achievements) ? saved.achievements : []
};

function saveGame() {
  game.date = today;

  try {
    localStorage.setItem(KEY, JSON.stringify(game));
    localStorage.setItem("hamsterXP", game.xp);
    localStorage.setItem("hamsterCarrots", game.carrots);
    localStorage.setItem("hamsterWater", game.waterCount);
  } catch (e) {
    console.error("Could not save game:", e);
  }
}

function unlock(id, name) {
  if (game.achievements.includes(id)) return;

  game.achievements.push(id);

  const message = document.getElementById("message");
  if (message) {
    message.textContent = "🏆 Achievement unlocked: " + name;
  }
}

function checkAchievements() {
  if (game.carrots >= 1) unlock("first_feed", "First Feeding");
  if (game.waterCount >= 1) unlock("first_water", "Garden Keeper");
  if (game.xp >= 100) unlock("level_up", "Level Up!");
  if (game.carrots >= 10) unlock("carrot_master", "Carrot Master");
  if (game.waterCount >= 10) unlock("garden_master", "Garden Master");
}

function renderExtraFeatures() {
  let panel = document.getElementById("extraFeatures");

  if (!panel) {
    panel = document.createElement("div");
    panel.id = "extraFeatures";
    panel.style.cssText =
      "background:#315c43;padding:18px;border-radius:16px;margin-top:20px;text-align:left;color:white;";

    const gameBox = document.querySelector(".game");
    if (gameBox) gameBox.appendChild(panel);
  }

  if (!panel) return;

  panel.innerHTML = `
    <h3>🌞 Daily Quests</h3>
    <p>🥕 Feed hamster: ${Math.min(game.feedsToday, 3)}/3</p>
    <p>💧 Water garden: ${Math.min(game.watersToday, 3)}/3</p>
    <p>⭐ Total XP: ${game.xp}</p>
    <p>🥕 Total carrots: ${game.carrots}</p>
    <p>🌻 Total watering: ${game.waterCount}</p>
    <hr>
    <h3>🏆 Achievements</h3>
    <p>${game.achievements.includes("first_feed") ? "✅" : "🔒"} First Feeding</p>
    <p>${game.achievements.includes("first_water") ? "✅" : "🔒"} Garden Keeper</p>
    <p>${game.achievements.includes("level_up") ? "✅" : "🔒"} Level Up</p>
    <p>${game.achievements.includes("carrot_master") ? "✅" : "🔒"} Carrot Master</p>
    <p>${game.achievements.includes("garden_master") ? "✅" : "🔒"} Garden Master</p>
  `;
}

function updateGame() {
  const xp = document.getElementById("xp");
  const level = document.getElementById("level");

  if (xp) xp.textContent = game.xp;

  if (level) {
    level.textContent = "Level " + (Math.floor(game.xp / 100) + 1);
  }

  checkAchievements();
  renderExtraFeatures();
  saveGame();
}

function feed() {
  game.carrots++;
  game.feedsToday++;
  game.xp += 10;

  const hamster = document.getElementById("hamster");
  const message = document.getElementById("message");

  if (hamster) hamster.textContent = "🐹";
  if (message) message.textContent =
    "Yummy! Your hamster loves carrots! 🥕";

  updateGame();
}

function water() {
  game.waterCount++;
  game.watersToday++;
  game.xp += 5;

  const garden = document.getElementById("garden");
  const message = document.getElementById("message");

  if (garden) garden.textContent = "🌷 🌻 🌼 🌸 🌺 🌻";
  if (message) message.textContent =
    "Your garden is growing! 🌱";

  updateGame();
}

// Squeekchain API - real public data
async function refreshSqueek() {
  const statusBox = document.getElementById("chainStatus");
  const dataBox = document.getElementById("chainData");
  const updatedBox = document.getElementById("lastUpdated");

  if (!statusBox || !dataBox) return;

  statusBox.textContent = "⏳ Connecting to Squeekchain...";
  dataBox.textContent = "Loading real blockchain data...";

  try {
    const endpoints = [
      ["Pipeline Status", "/status"],
      ["SqueekCore", "/core"],
      ["Recent Events", "/events?category=all&limit=5"]
    ];

    const results = await Promise.all(
      endpoints.map(async ([name, path]) => {
        const response = await fetch(API + path, {
          method: "GET",
          headers: { "Accept": "application/json" },
          cache: "no-store"
        });

        if (!response.ok) {
          throw new Error(name + ": HTTP " + response.status);
        }

        return [name, await response.json()];
      })
    );

    const data = Object.fromEntries(results);
    const core = data["SqueekCore"];

    if (core.status === "unavailable") {
      statusBox.textContent =
        "⚠️ SqueekCore unavailable: " + (core.reason || "Unknown reason");
    } else {
      statusBox.textContent =
        "✅ API connected | Network: " +
        (core.chain?.target || "Checking") +
        " | Chain ID: " +
        (core.chain?.chainId || "Unknown");
    }

    dataBox.textContent = JSON.stringify(data, null, 2);

    if (updatedBox) {
      updatedBox.textContent =
        "Last updated: " + new Date().toLocaleString();
    }

  } catch (error) {
    statusBox.textContent = "⚠️ Squeekchain connection error";

    dataBox.textContent =
      error.message +
      "\nPlease try refreshing later. No fake data is displayed.";

    if (updatedBox) {
      updatedBox.textContent = "Update failed";
    }

    console.error("Squeekchain API:", error);
  }
}

updateGame();

document.addEventListener("DOMContentLoaded", () => {
  refreshSqueek();
});


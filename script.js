
const KEY = "hamsterGardenV2";

const today = new Date().toLocaleDateString("en-CA");

let saved = {};
try {
  saved = JSON.parse(localStorage.getItem(KEY) || "{}");
} catch (e) {
  saved = {};
}

let game = {
  xp: saved.xp ?? Number(localStorage.getItem("hamsterXP")) ?? 0,
  carrots: saved.carrots ?? Number(localStorage.getItem("hamsterCarrots")) ?? 0,
  waterCount: saved.waterCount ?? Number(localStorage.getItem("hamsterWater")) ?? 0,
  feedsToday: saved.date === today ? (saved.feedsToday || 0) : 0,
  watersToday: saved.date === today ? (saved.watersToday || 0) : 0,
  achievements: saved.achievements || []
};

function saveGame() {
  game.date = today;
  localStorage.setItem(KEY, JSON.stringify(game));
  localStorage.setItem("hamsterXP", game.xp);
  localStorage.setItem("hamsterCarrots", game.carrots);
  localStorage.setItem("hamsterWater", game.waterCount);
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
    document.querySelector(".game").appendChild(panel);
  }

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
  document.getElementById("xp").textContent = game.xp;
  document.getElementById("level").textContent =
    "Level " + (Math.floor(game.xp / 100) + 1);

  checkAchievements();
  renderExtraFeatures();
  saveGame();
}

function feed() {
  game.carrots++;
  game.feedsToday++;
  game.xp += 10;

  document.getElementById("hamster").textContent = "🐹";
  document.getElementById("message").textContent =
    "Yummy! Your hamster loves carrots! 🥕";

  updateGame();
}

function water() {
  game.waterCount++;
  game.watersToday++;
  game.xp += 5;

  document.getElementById("garden").textContent =
    "🌷 🌻 🌼 🌸 🌺 🌻";

  document.getElementById("message").textContent =
    "Your garden is growing! 🌱";

  updateGame();
}

updateGame();





// ===== SQUEEKCHAIN LIVE API =====

const SQUEEK_API = "https://api.squeekchain.com/v1";

async function refreshSqueek() {
  const statusBox = document.getElementById("chainStatus");
  const dataBox = document.getElementById("chainData");
  const updatedBox = document.getElementById("lastUpdated");

  if (!statusBox || !dataBox) return;

  statusBox.textContent = "Connecting to Squeekchain...";

  try {
    const response = await fetch(SQUEEK_API + "/status");

    if (!response.ok) {
      throw new Error("HTTP " + response.status);
    }

    const data = await response.json();

    statusBox.textContent =
      "Squeekchain status: " +
      (data.status || data.measurement?.freshness || "Available");

    dataBox.textContent = JSON.stringify(data, null, 2);

    updatedBox.textContent =
      "Updated: " + new Date().toLocaleString();

  } catch (error) {
    statusBox.textContent = "Connection unavailable";
    dataBox.textContent = error.message;
    updatedBox.textContent = "Please try again later.";
  }
}

refreshSqueek();
setInterval(refreshSqueek, 30000);

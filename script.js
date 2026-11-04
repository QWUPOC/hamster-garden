

const KEY = "hamsterGardenV2";

const today = new Date().toLocaleDateString("en-CA");

let saved = JSON.parse(localStorage.getItem(KEY) || "{}");

let game = {
  xp: saved.xp || Number(localStorage.getItem("hamsterXP")) || 0,
  carrots: saved.carrots || Number(localStorage.getItem("hamsterCarrots")) || 0,
  water: saved.water || Number(localStorage.getItem("hamsterWater")) || 0,
  feedsToday: saved.date === today ? (saved.feedsToday || 0) : 0,
  watersToday: saved.date === today ? (saved.watersToday || 0) : 0,
  achievements: saved.achievements || []
};

function saveGame() {
  game.date = today;
  localStorage.setItem(KEY, JSON.stringify(game));
  localStorage.setItem("hamsterXP", game.xp);
  localStorage.setItem("hamsterCarrots", game.carrots);
  localStorage.setItem("hamsterWater", game.water);
}

function getLevel() {
  return Math.floor(game.xp / 100) + 1;
}

function addXP(amount) {
  game.xp += amount;
  saveGame();
  updateGame();
}

function feed() {
  game.carrots++;
  game.feedsToday++;

  document.getElementById("message").textContent =
    "Yummy! Your hamster loves carrots! 🥕";

  document.getElementById("hamster").textContent = "🐹";

  addXP(10);
}

function water() {
  game.water++;
  game.watersToday++;

  document.getElementById("garden").textContent =
    "🌷 🌻 🌼 🌸 🌺 🌻";

  document.getElementById("message").textContent =
    "Your garden is growing! 🌱";

  addXP(5);
}

function unlock(id, name) {
  if (game.achievements.includes(id)) return;

  game.achievements.push(id);

  document.getElementById("message").textContent =
    "🏆 Achievement unlocked: " + name;

  saveGame();
}

function checkAchievements() {
  if (game.carrots >= 1)
    unlock("first_feed", "First Feeding");

  if (game.water >= 1)
    unlock("first_water", "Garden Keeper");

  if (game.xp >= 100)
    unlock("level_up", "Level Up!");

  if (game.carrots >= 10)
    unlock("carrot_master", "Carrot Master");

  if (game.water >= 10)
    unlock("garden_master", "Garden Master");
}

function updateGame() {
  document.getElementById("xp").textContent = game.xp;
  document.getElementById("level").textContent =
    "Level " + getLevel();

  checkAchievements();
  renderExtraFeatures();
  saveGame();
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

  const achievements = [
    ["first_feed", "🥕 First Feeding"],
    ["first_water", "🌱 Garden Keeper"],
    ["level_up", "⭐ Level Up"],
    ["carrot_master", "🏆 Carrot Master"],
    ["garden_master", "🌻 Garden Master"]
  ];

  const feedDone = Math.min(game.feedsToday, 3);
  const waterDone = Math.min(game.watersToday, 3);

  panel.innerHTML = `
    <h3>🌞 Daily Quests</h3>
    <p>🥕 Feed hamster: ${feedDone}/3</p>
    <p>💧 Water garden: ${waterDone}/3</p>
    <p>⭐ Total XP: ${game.xp}</p>
    <p>🥕 Total carrots: ${game.carrots}</p>
    <p>🌻 Total watering: ${game.water}</p>
    <hr>
    <h3>🏆 Achievements</h3>
    ${achievements.map(item =>
      `<p>${game.achievements.includes(item[0]) ? "✅" : "🔒"} ${item[1]}</p>`
    ).join("")}
  `;
}

updateGame();

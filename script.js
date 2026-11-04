
let xp = 0;
let carrots = 0;
let water = 0;

function updateGame() {
  let level = Math.floor(xp / 100) + 1;

  document.getElementById("xp").textContent = xp;
  document.getElementById("level").textContent = "Level " + level;

  localStorage.setItem("hamsterXP", xp);
  localStorage.setItem("hamsterCarrots", carrots);
  localStorage.setItem("hamsterWater", water);
}

function feed() {
  xp += 10;
  carrots++;

  document.getElementById("message").textContent =
    "Yummy! Hamster loves carrots! 🥕";

  updateGame();
}

function waterGarden() {
  xp += 5;
  water++;

  document.getElementById("garden").textContent =
    "🌱 🌷 🌻 🌼 🌸 🌱";

  document.getElementById("message").textContent =
    "Your garden is growing! 🌻";

  updateGame();
}

function water() {
  waterGarden();
}

xp = Number(localStorage.getItem("hamsterXP")) || 0;
carrots = Number(localStorage.getItem("hamsterCarrots")) || 0;
water = Number(localStorage.getItem("hamsterWater")) || 0;

updateGame();

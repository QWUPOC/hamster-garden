
let xp = Number(localStorage.getItem("hamsterXP")) || 0;
let level = Math.floor(xp / 100) + 1;
let carrots = Number(localStorage.getItem("hamsterCarrots")) || 0;
let waterDrops = Number(localStorage.getItem("hamsterWater")) || 0;

function updateGame() {
  level = Math.floor(xp / 100) + 1;

  document.getElementById("xp").textContent = xp;
  document.getElementById("level").textContent = "Level " + level;

  localStorage.setItem("hamsterXP", xp);
  localStorage.setItem("hamsterCarrots", carrots);
  localStorage.setItem("hamsterWater", waterDrops);
}

function feed() {
  xp += 10;
  carrots++;
  document.getElementById("message").textContent =
    "Yummy! Your hamster loves carrots! 🥕";

  document.getElementById("hamster").textContent = "🐹";

  updateGame();
}

function water() {
  xp += 5;
  waterDrops++;

  const garden = document.getElementById("garden");

  const flowers = ["🌷", "🌻", "🌼", "🌸", "🌺"];
  garden.textContent = "🌱 " + flowers[waterDrops % flowers.length] +
    " 🌱 🌼 🌱";

  document.getElementById("message").textContent =
    "Your garden is growing! 🌱";

  updateGame();
}

updateGame();


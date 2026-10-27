(function () {
  var TOTAL = 90;
  var INTERVAL_MS = 4000; // un número nuevo cada 4 segundos
  // Un color vivo por cada decena (1-10, 11-20, ...)
  var COLORS = ["#ff2d95", "#ff7a00", "#e6b800", "#2bbf00", "#00a8c4",
                "#3d6bff", "#7b2ff7", "#d100d1", "#e8213a"];

  var remaining = [];
  var drawn = [];
  var timer = null;

  var ball = document.getElementById("ball");
  var statusEl = document.getElementById("status");
  var board = document.getElementById("board");
  var history = document.getElementById("history");
  var countEl = document.getElementById("count");
  var drawBtn = document.getElementById("draw");
  var autoBtn = document.getElementById("auto");
  var resetBtn = document.getElementById("reset");

  function colorOf(n) { return COLORS[Math.floor((n - 1) / 10)]; }

  function buildBoard() {
    board.innerHTML = "";
    for (var i = 1; i <= TOTAL; i++) {
      var cell = document.createElement("div");
      cell.className = "cell";
      cell.id = "cell-" + i;
      cell.textContent = i;
      cell.style.setProperty("--c", colorOf(i));
      board.appendChild(cell);
    }
  }

  function setAuto(on) {
    if (on && !timer && remaining.length > 0) {
      timer = setInterval(draw, INTERVAL_MS);
      autoBtn.textContent = "⏸ Pausar";
      autoBtn.classList.add("running");
      if (drawn.length === 0) draw(); // primer número al instante
    } else if (!on && timer) {
      clearInterval(timer);
      timer = null;
    }
    if (!timer) {
      autoBtn.textContent = "▶ Automático";
      autoBtn.classList.remove("running");
    }
  }

  function reset() {
    setAuto(false);
    remaining = [];
    for (var i = 1; i <= TOTAL; i++) remaining.push(i);
    drawn = [];
    ball.textContent = "?";
    ball.style.removeProperty("--ball");
    ball.classList.remove("spin");
    history.innerHTML = "";
    countEl.textContent = "0";
    statusEl.textContent = "Pulsa «Automático» y salen solos";
    drawBtn.disabled = false;
    autoBtn.disabled = false;
    buildBoard();
  }

  function draw() {
    if (remaining.length === 0) return;
    var idx = Math.floor(Math.random() * remaining.length);
    var n = remaining.splice(idx, 1)[0];
    drawn.push(n);

    // Animación de la bola
    ball.classList.remove("spin");
    void ball.offsetWidth; // reinicia la animación
    ball.textContent = n;
    ball.style.setProperty("--ball", colorOf(n));
    ball.classList.add("spin");

    // Tachar en el tablero
    var prev = board.querySelector(".latest");
    if (prev) prev.classList.remove("latest");
    var cell = document.getElementById("cell-" + n);
    cell.classList.add("hit", "latest");

    // Historial
    var chip = document.createElement("span");
    chip.className = "chip";
    chip.style.setProperty("--c", colorOf(n));
    chip.textContent = n;
    history.appendChild(chip);

    countEl.textContent = drawn.length;
    statusEl.textContent = "¡Ha salido el " + n + "!";

    if (remaining.length === 0) {
      setAuto(false);
      statusEl.textContent = "¡Fin! Salieron los 90 números.";
      drawBtn.disabled = true;
      autoBtn.disabled = true;
    }
  }

  drawBtn.addEventListener("click", draw);
  autoBtn.addEventListener("click", function () { setAuto(!timer); });
  resetBtn.addEventListener("click", reset);
  reset();
})();

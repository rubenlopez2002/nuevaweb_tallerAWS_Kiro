(function () {
  var TOTAL = 90;
  var INTERVAL_MS = 4000; // pausa mínima entre números (además de esperar a que acabe la voz)
  // Un color vivo por cada decena (1-10, 11-20, ...)
  var COLORS = ["#ff2d95", "#ff7a00", "#e6b800", "#2bbf00", "#00a8c4",
                "#3d6bff", "#7b2ff7", "#d100d1", "#e8213a"];

  var remaining = [];
  var drawn = [];
  var timer = null;
  var running = false;

  var ball = document.getElementById("ball");
  var statusEl = document.getElementById("status");
  var board = document.getElementById("board");
  var history = document.getElementById("history");
  var countEl = document.getElementById("count");
  var drawBtn = document.getElementById("draw");
  var autoBtn = document.getElementById("auto");
  var resetBtn = document.getElementById("reset");
  var voiceBtn = document.getElementById("voice");
  var cardEl = document.getElementById("card");
  var newCardBtn = document.getElementById("newcard");
  var winEl = document.getElementById("win");

  function colorOf(n) { return COLORS[Math.floor((n - 1) / 10)]; }

  // ---- Voz masculina en 4 idiomas: español, inglés, francés, alemán ----
  var voiceOn = true;
  var LANGS = [
    { code: "es", tag: "es-ES" },
    { code: "en", tag: "en-US" },
    { code: "fr", tag: "fr-FR" },
    { code: "de", tag: "de-DE" }
  ];
  var MALE = new RegExp([
    "pablo", "jorge", "raul", "raúl", "enrique", "diego", "carlos", "miguel", "juan", "andres", "andrés",
    "david", "mark", "james", "george", "guy", "daniel", "alex", "ryan", "thomas", "paul", "henri",
    "claude", "jean", "stefan", "hans", "markus", "conrad", "michael", "male", "hombre", "homme", "mann"
  ].join("|"), "i");
  var voices = {}; // código de idioma -> voz elegida

  function pickVoices() {
    if (!("speechSynthesis" in window)) return;
    var all = window.speechSynthesis.getVoices();
    LANGS.forEach(function (L) {
      var list = all.filter(function (v) { return v.lang.toLowerCase().indexOf(L.code) === 0; });
      voices[L.code] = list.filter(function (v) { return MALE.test(v.name); })[0] || list[0] || null;
    });
  }
  if ("speechSynthesis" in window) {
    pickVoices();
    window.speechSynthesis.onvoiceschanged = pickVoices;
  }

  // Dice el número: primero español, luego inglés, francés y alemán.
  // Si el equipo no tiene voz para un idioma, se salta ese idioma.
  function speak(n) {
    if (!voiceOn || !("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    LANGS.forEach(function (L) {
      var v = voices[L.code];
      if (!v) return;
      var u = new SpeechSynthesisUtterance(String(n));
      u.voice = v;
      u.lang = v.lang;
      u.pitch = 0.5;  // tono grave = voz de hombre
      u.rate = 0.9;
      window.speechSynthesis.speak(u);
    });
  }

  function isSpeaking() {
    return "speechSynthesis" in window && window.speechSynthesis.speaking;
  }

  // ---- Cartón de bingo (3 filas x 9 columnas, 15 números) ----
  var card = null;      // card[fila][col] = número o 0
  var marked = {};      // número -> true
  var lineDone = {};    // fila -> true

  // Cartón válido: 5 números por fila, 1 a 3 por columna.
  // Columna 0 = 1-9, columna 1 = 10-19, ..., columna 8 = 80-90.
  function generateCard() {
    while (true) {
      var counts = [];
      var c, r, total = 0;
      for (c = 0; c < 9; c++) { counts.push(1); total++; }
      while (total < 15) {
        c = Math.floor(Math.random() * 9);
        if (counts[c] < 3) { counts[c]++; total++; }
      }
      var rows = [[], [], []];
      var grid = [[0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0]];
      var rowCount = [0, 0, 0];
      var ok = true;
      for (c = 0; c < 9 && ok; c++) {
        // elegir en qué filas va cada número de esta columna
        var rowIdx = [0, 1, 2].sort(function () { return Math.random() - 0.5; }).slice(0, counts[c]).sort();
        // elegir los números de la columna, de menor a mayor
        var lo = c === 0 ? 1 : c * 10;
        var hi = c === 8 ? 90 : c * 10 + 9;
        var pool = [];
        for (var x = lo; x <= hi; x++) pool.push(x);
        pool.sort(function () { return Math.random() - 0.5; });
        var nums = pool.slice(0, counts[c]).sort(function (a, b) { return a - b; });
        for (var k = 0; k < rowIdx.length; k++) {
          grid[rowIdx[k]][c] = nums[k];
          rowCount[rowIdx[k]]++;
        }
      }
      for (r = 0; r < 3; r++) if (rowCount[r] !== 5) ok = false;
      if (ok) return grid;
    }
  }

  function renderCard() {
    cardEl.innerHTML = "";
    for (var r = 0; r < 3; r++) {
      for (var c = 0; c < 9; c++) {
        var n = card[r][c];
        var cell = document.createElement("button");
        cell.type = "button";
        cell.className = "ccell" + (n ? "" : " blank");
        if (n) {
          cell.textContent = n;
          cell.dataset.n = n;
          cell.style.setProperty("--c", colorOf(n));
          if (marked[n]) cell.classList.add("mark");
        } else {
          cell.disabled = true;
          cell.setAttribute("aria-hidden", "true");
        }
        cardEl.appendChild(cell);
      }
    }
  }

  function newCard() {
    card = generateCard();
    marked = {};
    lineDone = {};
    winEl.textContent = "";
    winEl.classList.remove("show");
    renderCard();
  }

  function announce(text) {
    winEl.textContent = text;
    winEl.classList.remove("show");
    void winEl.offsetWidth;
    winEl.classList.add("show");
  }

  function checkWin() {
    var total = 0;
    for (var r = 0; r < 3; r++) {
      var rowMarked = 0;
      for (var c = 0; c < 9; c++) {
        var n = card[r][c];
        if (n && marked[n]) { rowMarked++; total++; }
      }
      if (rowMarked === 5 && !lineDone[r]) {
        lineDone[r] = true;
        if (total < 15) announce("🎉 ¡LÍNEA!");
      }
    }
    if (total === 15) {
      announce("🏆 ¡BINGO!");
      setAuto(false);
    }
  }

  cardEl.addEventListener("click", function (e) {
    var cell = e.target.closest(".ccell");
    if (!cell || cell.classList.contains("blank")) return;
    var n = Number(cell.dataset.n);
    if (drawn.indexOf(n) === -1) {
      cell.classList.remove("nope");
      void cell.offsetWidth;
      cell.classList.add("nope");
      statusEl.textContent = "El " + n + " todavía no ha salido";
      return;
    }
    if (marked[n]) { delete marked[n]; cell.classList.remove("mark"); }
    else { marked[n] = true; cell.classList.add("mark"); }
    checkWin();
  });

  // ---- Tablero y juego ----
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

  // Bucle automático: espera a que acabe la voz y luego saca el siguiente.
  function schedule() {
    timer = setTimeout(function () {
      if (!running) return;
      if (isSpeaking()) { schedule(); return; }
      draw();
      if (running) schedule();
    }, INTERVAL_MS);
  }

  function setAuto(on) {
    if (on && !running && remaining.length > 0) {
      running = true;
      autoBtn.textContent = "⏸ Pausar";
      autoBtn.classList.add("running");
      if (drawn.length === 0) draw(); // primer número al instante
      schedule();
    } else if (!on) {
      running = false;
      clearTimeout(timer);
      timer = null;
      autoBtn.textContent = "▶ Automático";
      autoBtn.classList.remove("running");
    }
  }

  function reset() {
    setAuto(false);
    if ("speechSynthesis" in window) window.speechSynthesis.cancel();
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
    newCard();
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
    speak(n);

    if (remaining.length === 0) {
      setAuto(false);
      statusEl.textContent = "¡Fin! Salieron los 90 números.";
      drawBtn.disabled = true;
      autoBtn.disabled = true;
    }
  }

  drawBtn.addEventListener("click", draw);
  autoBtn.addEventListener("click", function () { setAuto(!running); });
  resetBtn.addEventListener("click", reset);
  newCardBtn.addEventListener("click", newCard);
  voiceBtn.addEventListener("click", function () {
    voiceOn = !voiceOn;
    voiceBtn.textContent = voiceOn ? "🔊 Voz: sí" : "🔇 Voz: no";
    if (!voiceOn && "speechSynthesis" in window) window.speechSynthesis.cancel();
  });
  reset();
})();

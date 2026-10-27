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
  var voicesInfo = document.getElementById("voices");

  function colorOf(n) { return COLORS[Math.floor((n - 1) / 10)]; }

  // ---- Voz masculina en 4 idiomas: español, inglés, francés, alemán ----
  var voiceOn = true;
  var LANGS = [
    { code: "es", name: "Español" },
    { code: "en", name: "English" },
    { code: "fr", name: "Français" },
    { code: "de", name: "Deutsch" }
  ];
  var MALE = new RegExp([
    "pablo", "jorge", "raul", "raúl", "enrique", "diego", "carlos", "miguel", "juan", "andres", "andrés",
    "david", "mark", "james", "george", "guy", "daniel", "alex", "ryan", "thomas", "paul", "henri",
    "claude", "jean", "stefan", "hans", "markus", "conrad", "michael", "male", "hombre", "homme", "mann"
  ].join("|"), "i");
  var voices = {}; // código de idioma -> voz elegida

  function pickVoices() {
    if (!("speechSynthesis" in window)) {
      voicesInfo.textContent = "Este navegador no tiene voz.";
      return;
    }
    var all = window.speechSynthesis.getVoices();
    var parts = [];
    LANGS.forEach(function (L) {
      var list = all.filter(function (v) { return v.lang.toLowerCase().replace("_", "-").indexOf(L.code) === 0; });
      voices[L.code] = list.filter(function (v) { return MALE.test(v.name); })[0] || list[0] || null;
      parts.push((voices[L.code] ? "✅ " : "❌ ") + L.name);
    });
    voicesInfo.textContent = "Voces en este equipo: " + parts.join("  ");
  }
  if ("speechSynthesis" in window) {
    window.speechSynthesis.onvoiceschanged = pickVoices;
  }
  pickVoices();

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
  voiceBtn.addEventListener("click", function () {
    voiceOn = !voiceOn;
    voiceBtn.textContent = voiceOn ? "🔊 Voz: sí" : "🔇 Voz: no";
    if (!voiceOn && "speechSynthesis" in window) window.speechSynthesis.cancel();
  });
  reset();
})();

(function () {
  var TOTAL = 90;
  var INTERVAL_MS = 20000; // pausa entre números (20 s), cuenta desde que acaba la voz
  var SPIN_MS = 2500;      // tiempo que gira rápido el bombo antes de salir la bola
  // Un color vivo por cada decena (1-10, 11-20, ...)
  var COLORS = ["#ff2d95", "#ff7a00", "#e6b800", "#2bbf00", "#00a8c4",
                "#3d6bff", "#7b2ff7", "#d100d1", "#e8213a"];

  var remaining = [];
  var drawn = [];
  var timer = null;
  var running = false;
  var spinning = false;   // el bombo está girando antes de sacar la bola
  var spinTimer = null;

  var drum = document.getElementById("drum");
  var cage = document.getElementById("cage");
  var ball = document.getElementById("ball");
  var statusEl = document.getElementById("status");
  var board = document.getElementById("board");
  var history = document.getElementById("history");
  var countEl = document.getElementById("count");
  var drawBtn = document.getElementById("draw");
  var autoBtn = document.getElementById("auto");
  var resetBtn = document.getElementById("reset");
  var voiceBtn = document.getElementById("voice");

  function colorOf(n) { return COLORS[Math.floor((n - 1) / 10)]; }

  // ---- Voz de hombre en 4 idiomas: español, inglés, francés, alemán ----
  // Son audios grabados (carpeta audio/), así suenan igual en cualquier
  // navegador y en cualquier equipo, sin instalar voces.
  var voiceOn = true;
  var ORDER = ["es", "en", "fr", "de"];
  var playId = 0;       // sube cada vez que se corta o empieza una locución
  var speaking = false;
  var current = null;

  function stopVoice() {
    playId++;
    speaking = false;
    if (current) { try { current.pause(); } catch (e) {} current = null; }
  }

  // Dice el número: primero español, luego inglés, francés y alemán.
  function speak(n) {
    stopVoice();
    if (!voiceOn) return;
    var id = playId;
    var i = 0;
    speaking = true;
    function next() {
      if (id !== playId) return;           // llegó otra locución o se cortó
      if (i >= ORDER.length) { speaking = false; current = null; return; }
      var a = new Audio("audio/" + ORDER[i++] + "/" + n + ".wav");
      current = a;
      a.onended = next;
      a.onerror = next;                    // si falta un audio, sigue con el siguiente
      var p = a.play();
      if (p && p.catch) p.catch(next);
    }
    next();
  }

  function isSpeaking() { return speaking || spinning; }

  // ---- Bombo: bolitas de colores dentro de una jaula que gira ----
  function buildDrum() {
    var nums = [7, 18, 23, 34, 41, 52, 66, 75, 88, 12, 59, 90];
    for (var k = 0; k < nums.length; k++) {
      var ang = (k / nums.length) * 2 * Math.PI + (k % 2) * 0.4;
      var rad = k % 2 ? 26 : 12;               // en % del radio
      var m = document.createElement("span");
      m.className = "mini";
      m.textContent = nums[k];
      m.style.setProperty("--c", colorOf(nums[k]));
      m.style.left = "calc(" + (50 + Math.cos(ang) * rad * 1.5) + "% - 15px)";
      m.style.top = "calc(" + (50 + Math.sin(ang) * rad * 1.5) + "% - 15px)";
      cage.appendChild(m);
    }
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
    // Si la voz aún habla, espera un poco y vuelve a mirar.
    if (isSpeaking()) {
      timer = setTimeout(function () { if (running) schedule(); }, 300);
      return;
    }
    // La voz ya acabó: pausa larga y luego el siguiente número.
    timer = setTimeout(function () {
      if (!running) return;
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
    stopVoice();
    clearTimeout(spinTimer);
    spinning = false;
    drum.classList.remove("fast");
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

  // Primero gira el bombo unos segundos; después sale la bola.
  function draw() {
    if (remaining.length === 0 || spinning) return;
    spinning = true;
    stopVoice();
    statusEl.textContent = "🎡 Girando el bombo…";
    drum.classList.add("fast");
    spinTimer = setTimeout(function () {
      drum.classList.remove("fast");
      spinning = false;
      reveal();
    }, SPIN_MS);
  }

  function reveal() {
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
    if (!voiceOn) stopVoice();
  });
  buildDrum();
  reset();
})();

/* =========================================================
   EVENT / WORLD
   Interactive event-camera simulation
========================================================= */

const normalCanvas = document.getElementById("normalCanvas");
const eventCanvas = document.getElementById("eventCanvas");

const normalCtx = normalCanvas.getContext("2d");
const eventCtx = eventCanvas.getContext("2d");

const drawNormal = document.getElementById("drawNormal");
const drawEvent = document.getElementById("drawEvent");

const drawNormalCtx = drawNormal.getContext("2d");
const drawEventCtx = drawEvent.getContext("2d");


/* =========================================================
   STATE
========================================================= */

const state = {

  speed: 50,
  brightness: 55,
  contrast: 65,
  threshold: 28,
  fps: 60,

  scene: "ball",

  highSpeed: false,

  frameCount: 42,

  object: {
    x: 0.25,
    y: 0.5,
    radius: 0.095,
    direction: 1,
    velocity: 0
  },

  events: [],

  previousField: null,

  eventAccumulator: 0,

  lastTime: performance.now(),

  eventsThisSecond: 0,

  displayedEventsPerSecond: 0,

  lastStatsUpdate: performance.now()
};


/* =========================================================
   DOM
========================================================= */

const speedInput = document.getElementById("speed");
const brightnessInput = document.getElementById("brightness");
const contrastInput = document.getElementById("contrast");
const thresholdInput = document.getElementById("threshold");
const fpsInput = document.getElementById("fps");

const speedValue = document.getElementById("speedValue");
const brightnessValue = document.getElementById("brightnessValue");
const contrastValue = document.getElementById("contrastValue");
const thresholdValue = document.getElementById("thresholdValue");
const fpsValue = document.getElementById("fpsValue");

const normalFps = document.getElementById("normalFps");
const normalLatency = document.getElementById("normalLatency");
const eventsPerSec = document.getElementById("eventsPerSec");
const activePixels = document.getElementById("activePixels");
const dataRate = document.getElementById("dataRate");

const frameCounter = document.getElementById("frameCounter");

const highSpeedButton =
  document.getElementById("highSpeedButton");

const highSpeedBanner =
  document.getElementById("highSpeedBanner");

const resetButton =
  document.getElementById("resetButton");

const sceneButtons =
  document.querySelectorAll(".scene-button");

const modeToggle =
  document.getElementById("modeToggle");

const finalToggle =
  document.getElementById("finalToggle");

const modeLabel =
  document.getElementById("modeLabel");

const terminalBody =
  document.getElementById("terminalBody");


/* =========================================================
   HELPERS
========================================================= */

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function random(min, max) {
  return Math.random() * (max - min) + min;
}

function resizeCanvas(canvas, ctx) {

  const rect = canvas.getBoundingClientRect();

  const dpr = Math.min(window.devicePixelRatio || 1, 2);

  canvas.width = Math.floor(rect.width * dpr);
  canvas.height = Math.floor(rect.height * dpr);

  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

  return {
    width: rect.width,
    height: rect.height
  };
}


/* =========================================================
   CANVAS SIZES
========================================================= */

function resizeAllCanvases() {

  resizeCanvas(normalCanvas, normalCtx);
  resizeCanvas(eventCanvas, eventCtx);

  resizeCanvas(drawNormal, drawNormalCtx);
  resizeCanvas(drawEvent, drawEventCtx);

  state.previousField = null;
}

window.addEventListener("resize", resizeAllCanvases);


/* =========================================================
   SLIDERS
========================================================= */

speedInput.addEventListener("input", () => {

  state.speed = Number(speedInput.value);

  speedValue.textContent = `${state.speed}%`;

});


brightnessInput.addEventListener("input", () => {

  state.brightness = Number(brightnessInput.value);

  brightnessValue.textContent =
    `${state.brightness}%`;

});


contrastInput.addEventListener("input", () => {

  state.contrast = Number(contrastInput.value);

  contrastValue.textContent =
    `${state.contrast}%`;

});


thresholdInput.addEventListener("input", () => {

  state.threshold = Number(thresholdInput.value);

  thresholdValue.textContent =
    `${state.threshold}%`;

});


fpsInput.addEventListener("input", () => {

  state.fps = Number(fpsInput.value);

  fpsValue.textContent =
    `${state.fps} FPS`;

  normalFps.textContent =
    `${state.fps} FPS`;

  normalLatency.textContent =
    `${(1000 / state.fps).toFixed(1)} ms`;

});


/* =========================================================
   SCENE BUTTONS
========================================================= */

sceneButtons.forEach(button => {

  button.addEventListener("click", () => {

    sceneButtons.forEach(item =>
      item.classList.remove("active")
    );

    button.classList.add("active");

    state.scene = button.dataset.scene;

    state.object.x = 0.2;
    state.object.y = 0.5;

    state.previousField = null;

  });

});


/* =========================================================
   HIGH SPEED MODE
========================================================= */

highSpeedButton.addEventListener("click", () => {

  state.highSpeed = !state.highSpeed;

  highSpeedButton.classList.toggle(
    "active",
    state.highSpeed
  );

  highSpeedBanner.classList.toggle(
    "active",
    state.highSpeed
  );

  if (state.highSpeed) {

    speedInput.value = 92;
    state.speed = 92;

    speedValue.textContent = "92%";

  }

});


/* =========================================================
   RESET
========================================================= */

resetButton.addEventListener("click", () => {

  state.speed = 50;
  state.brightness = 55;
  state.contrast = 65;
  state.threshold = 28;
  state.fps = 60;

  speedInput.value = 50;
  brightnessInput.value = 55;
  contrastInput.value = 65;
  thresholdInput.value = 28;
  fpsInput.value = 60;

  speedValue.textContent = "50%";
  brightnessValue.textContent = "55%";
  contrastValue.textContent = "65%";
  thresholdValue.textContent = "28%";
  fpsValue.textContent = "60 FPS";

  state.highSpeed = false;

  highSpeedButton.classList.remove("active");
  highSpeedBanner.classList.remove("active");

  state.object.x = 0.25;
  state.object.y = 0.5;

  state.events = [];
  state.previousField = null;

});


/* =========================================================
   FRAME CAMERA
========================================================= */

function drawNormalCamera(time) {

  const width = normalCanvas.clientWidth;
  const height = normalCanvas.clientHeight;

  normalCtx.clearRect(0, 0, width, height);

  /*
    Background darkness responds to brightness.
  */

  const background =
    5 + state.brightness * 0.08;

  normalCtx.fillStyle =
    `rgb(${background}, ${background + 2}, ${background + 4})`;

  normalCtx.fillRect(0, 0, width, height);


  drawNormalGrid(width, height);

  drawSceneNormal(normalCtx, width, height, time);

  state.frameCount++;

  frameCounter.textContent =
    String(state.frameCount).padStart(6, "0");
}


function drawNormalGrid(width, height) {

  normalCtx.save();

  normalCtx.strokeStyle =
    "rgba(255,255,255,0.025)";

  normalCtx.lineWidth = 1;

  const step = 42;

  for (let x = 0; x < width; x += step) {

    normalCtx.beginPath();
    normalCtx.moveTo(x, 0);
    normalCtx.lineTo(x, height);
    normalCtx.stroke();

  }

  for (let y = 0; y < height; y += step) {

    normalCtx.beginPath();
    normalCtx.moveTo(0, y);
    normalCtx.lineTo(width, y);
    normalCtx.stroke();

  }

  normalCtx.restore();
}


/* =========================================================
   NORMAL SCENE
========================================================= */

function drawSceneNormal(ctx, width, height, time) {

  if (state.scene === "ball") {

    drawBall(ctx, width, height);

  } else if (state.scene === "car") {

    drawCar(ctx, width, height);

  } else {

    drawParticleScene(ctx, width, height, time);

  }
}


function drawBall(ctx, width, height) {

  const x =
    state.object.x * width;

  const y =
    state.object.y * height;

  const radius =
    state.object.radius * width;


  /*
    Motion blur becomes stronger as speed increases.
  */

  if (state.speed > 55) {

    const blurAmount =
      ((state.speed - 55) / 45) * 70;

    ctx.save();

    ctx.globalAlpha = 0.18;

    for (let i = 1; i < 6; i++) {

      const ghostX =
        x - state.object.direction *
        blurAmount * i / 6;

      const gradient =
        ctx.createRadialGradient(
          ghostX,
          y,
          0,
          ghostX,
          y,
          radius
        );

      gradient.addColorStop(
        0,
        "rgba(255,255,255,0.8)"
      );

      gradient.addColorStop(
        1,
        "rgba(255,255,255,0)"
      );

      ctx.fillStyle = gradient;

      ctx.beginPath();
      ctx.arc(
        ghostX,
        y,
        radius,
        0,
        Math.PI * 2
      );

      ctx.fill();
    }

    ctx.restore();
  }


  const gradient =
    ctx.createRadialGradient(
      x - radius * 0.35,
      y - radius * 0.35,
      radius * 0.05,
      x,
      y,
      radius
    );

  const brightness =
    120 + state.brightness;

  gradient.addColorStop(
    0,
    `rgb(${brightness + 40},${brightness + 40},${brightness + 40})`
  );

  gradient.addColorStop(
    0.35,
    `rgb(${brightness},${brightness},${brightness})`
  );

  gradient.addColorStop(
    1,
    "rgb(70,75,78)"
  );

  ctx.fillStyle = gradient;

  ctx.beginPath();

  ctx.arc(
    x,
    y,
    radius,
    0,
    Math.PI * 2
  );

  ctx.fill();


  ctx.strokeStyle =
    "rgba(255,255,255,0.22)";

  ctx.lineWidth = 1;

  ctx.stroke();


  /*
    Small highlight.
  */

  ctx.fillStyle =
    "rgba(255,255,255,0.6)";

  ctx.beginPath();

  ctx.arc(
    x - radius * 0.28,
    y - radius * 0.3,
    radius * 0.13,
    0,
    Math.PI * 2
  );

  ctx.fill();
}


/* =========================================================
   CAR SCENE
========================================================= */

function drawCar(ctx, width, height) {

  const x = state.object.x * width;
  const y = state.object.y * height;

  const carW = width * 0.23;
  const carH = height * 0.12;

  ctx.save();

  ctx.translate(x, y);

  if (state.object.direction < 0) {
    ctx.scale(-1, 1);
  }


  /*
    Motion trail.
  */

  if (state.speed > 55) {

    ctx.fillStyle =
      "rgba(255,255,255,0.035)";

    for (let i = 1; i < 8; i++) {

      ctx.fillRect(
        -carW * 0.5 - i * 13,
        -carH * 0.15,
        carW,
        carH * 0.4
      );

    }

  }


  /*
    Body.
  */

  ctx.fillStyle =
    `rgb(
      ${110 + state.brightness},
      ${120 + state.brightness * 0.6},
      ${125 + state.brightness * 0.4}
    )`;

  roundRect(
    ctx,
    -carW / 2,
    -carH / 2,
    carW,
    carH,
    12
  );

  ctx.fill();


  /*
    Roof.
  */

  ctx.fillStyle =
    "rgba(100,125,135,0.7)";

  ctx.beginPath();

  ctx.moveTo(-carW * 0.28, -carH * 0.48);
  ctx.lineTo(-carW * 0.1, -carH * 0.95);
  ctx.lineTo(carW * 0.24, -carH * 0.95);
  ctx.lineTo(carW * 0.38, -carH * 0.48);

  ctx.closePath();
  ctx.fill();


  /*
    Windows.
  */

  ctx.fillStyle = "#081216";

  ctx.beginPath();

  ctx.moveTo(-carW * 0.23, -carH * 0.53);
  ctx.lineTo(-carW * 0.08, -carH * 0.84);
  ctx.lineTo(carW * 0.08, -carH * 0.84);
  ctx.lineTo(carW * 0.15, -carH * 0.53);

  ctx.closePath();
  ctx.fill();


  /*
    Wheels.
  */

  ctx.fillStyle = "#030405";

  [-0.3, 0.3].forEach(offset => {

    ctx.beginPath();

    ctx.arc(
      carW * offset,
      carH * 0.5,
      carH * 0.32,
      0,
      Math.PI * 2
    );

    ctx.fill();

  });


  /*
    Headlight.
  */

  ctx.fillStyle = "#fff0ba";

  ctx.shadowColor = "#fff0ba";
  ctx.shadowBlur = 14;

  ctx.fillRect(
    carW * 0.44,
    -carH * 0.25,
    5,
    5
  );

  ctx.shadowBlur = 0;

  ctx.restore();
}


function roundRect(ctx, x, y, width, height, radius) {

  const r = Math.min(
    radius,
    width / 2,
    height / 2
  );

  ctx.beginPath();

  ctx.moveTo(x + r, y);

  ctx.arcTo(
    x + width,
    y,
    x + width,
    y + height,
    r
  );

  ctx.arcTo(
    x + width,
    y + height,
    x,
    y + height,
    r
  );

  ctx.arcTo(
    x,
    y + height,
    x,
    y,
    r
  );

  ctx.arcTo(
    x,
    y,
    x + width,
    y,
    r
  );

  ctx.closePath();
}


/* =========================================================
   PARTICLE SCENE
========================================================= */

const sceneParticles =
  Array.from({ length: 90 }, (_, index) => ({
    x: Math.random(),
    y: Math.random(),
    size: random(1, 3),
    phase: Math.random() * Math.PI * 2,
    speed: random(0.4, 1.4),
    index
  }));


function drawParticleScene(ctx, width, height, time) {

  sceneParticles.forEach(particle => {

    const drift =
      Math.sin(
        time * 0.001 * particle.speed +
        particle.phase
      ) * 10;

    const x =
      particle.x * width + drift;

    const y =
      particle.y * height;

    const alpha =
      0.2 +
      Math.sin(
        time * 0.002 +
        particle.phase
      ) * 0.15;

    ctx.fillStyle =
      `rgba(160,220,230,${alpha})`;

    ctx.beginPath();

    ctx.arc(
      x,
      y,
      particle.size,
      0,
      Math.PI * 2
    );

    ctx.fill();

  });
}


/* =========================================================
   OBJECT MOVEMENT
========================================================= */

function updateObject(delta) {

  const speedMultiplier =
    0.04 + state.speed / 100 * 0.65;

  state.object.velocity =
    state.object.direction *
    speedMultiplier;

  state.object.x +=
    state.object.velocity *
    delta;

  /*
    Bounce at boundaries.
  */

  if (state.object.x > 1.08) {

    state.object.x = -0.08;
    state.object.direction = 1;

  }

  if (state.object.x < -0.08) {

    state.object.x = 1.08;
    state.object.direction = -1;

  }
}


/* =========================================================
   EVENT CAMERA
========================================================= */

function drawEventCamera(time, delta) {

  const width = eventCanvas.clientWidth;
  const height = eventCanvas.clientHeight;

  eventCtx.clearRect(
    0,
    0,
    width,
    height
  );


  /*
    Very dark sensor background.
  */

  eventCtx.fillStyle = "#010607";
  eventCtx.fillRect(
    0,
    0,
    width,
    height
  );


  drawEventSensorGrid(width, height);

  /*
    New events are generated from
    the current scene.
  */

  const currentField =
    createBrightnessField(
      width,
      height,
      time
    );

  if (!state.previousField) {

    state.previousField =
      currentField.slice();

  } else {

    generateEvents(
      currentField,
      state.previousField,
      width,
      height
    );

    state.previousField =
      currentField.slice();

  }


  /*
    Render existing event particles.
  */

  renderEvents(width, height, delta);

}


function drawEventSensorGrid(width, height) {

  eventCtx.save();

  eventCtx.strokeStyle =
    "rgba(77,232,255,0.018)";

  eventCtx.lineWidth = 1;

  const step = 35;

  for (let x = 0; x < width; x += step) {

    eventCtx.beginPath();
    eventCtx.moveTo(x, 0);
    eventCtx.lineTo(x, height);
    eventCtx.stroke();

  }

  for (let y = 0; y < height; y += step) {

    eventCtx.beginPath();
    eventCtx.moveTo(0, y);
    eventCtx.lineTo(width, y);
    eventCtx.stroke();

  }

  eventCtx.restore();
}


/* =========================================================
   BRIGHTNESS FIELD
========================================================= */

const fieldCols = 80;
const fieldRows = 48;


function createBrightnessField(width, height, time) {
  const field = new Float32Array(fieldCols * fieldRows);

  const objectX = state.object.x * fieldCols;
  const objectY = state.object.y * fieldRows;
  const objectRadius = state.object.radius * fieldCols;

  for (let row = 0; row < fieldRows; row++) {
    for (let col = 0; col < fieldCols; col++) {
      const index = row * fieldCols + col;
      
      // Fix 1: Properly scale ambient brightness between 0 and 1
      let brightness = (state.brightness / 100) * 0.3;

      if (state.scene === "ball") {
        const dx = col - objectX;
        const dy = row - objectY;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance < objectRadius) {
          const edge = 1 - distance / objectRadius;
          brightness += edge * (0.6 + (state.brightness / 100) * 0.2);
        }
      }
      else if (state.scene === "car") {
        const carWidth = fieldCols * 0.23;
        const carHeight = fieldRows * 0.12;
        const dx = Math.abs(col - objectX);
        const dy = Math.abs(row - objectY);

        if (dx < carWidth / 2 && dy < carHeight / 2) {
          brightness += 0.5;
        }

        if (dx < carWidth * 0.25 && dy < carHeight * 0.9 && row < objectY) {
          brightness += 0.2;
        }
      }
      else {
        sceneParticles.forEach(particle => {
          // Fix 2: Apply mathematical time-drift so the event camera actually registers movement
          const scale = width > 0 ? (10 / width) * fieldCols : 0;
          const drift = Math.sin(time * 0.001 * particle.speed + particle.phase) * scale;
          
          const px = particle.x * fieldCols + drift;
          const py = particle.y * fieldRows;
          
          const dx = col - px;
          const dy = row - py;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < 1.4) {
            brightness += 0.5 * (1 - dist / 1.4);
          }
        });
      }

      // Rebalance contrast curve properly around the midpoint
      const contrast = state.contrast / 100;
      brightness = (brightness - 0.2) * (0.5 + contrast * 1.5) + 0.2;

      field[index] = clamp(brightness, 0, 1);
    }
  }

  return field;
}


/* =========================================================
   EVENT GENERATION
========================================================= */

function generateEvents(
  current,
  previous,
  width,
  height
) {

  const threshold =
    state.threshold / 100;


  /*
    Don't inspect every sensor pixel.
    This keeps the simulation performant.
  */

  for (
    let row = 0;
    row < fieldRows;
    row++
  ) {

    for (
      let col = 0;
      col < fieldCols;
      col++
    ) {

      const index =
        row * fieldCols + col;

      const difference =
        current[index] -
        previous[index];


      if (
        Math.abs(difference) <
        threshold * 0.055
      ) {

        continue;

      }


      /*
        A lower threshold produces
        more events.
      */

      const sensitivity =
        1 +
        (70 - state.threshold) / 25;

      const probability =
        clamp(
          Math.abs(difference) *
          sensitivity *
          7,
          0,
          0.98
        );


      if (Math.random() > probability) {
        continue;
      }


      const x =
        (col / fieldCols) * width;

      const y =
        (row / fieldRows) * height;

      const polarity =
        difference > 0
          ? 1
          : -1;


      state.events.push({
        x,
        y,
        polarity,
        strength: clamp(
          Math.abs(difference) * 5,
          0.3,
          1
        ),
        life: random(0.15, 0.5),
        maxLife: 0.5,
        timestamp: performance.now()
      });


      state.eventsThisSecond++;

    }

  }


  /*
    Avoid runaway memory.
  */

  if (state.events.length > 2500) {

    state.events.splice(
      0,
      state.events.length - 2500
    );

  }
}


/* =========================================================
   EVENT RENDERING
========================================================= */

function renderEvents(width, height, delta) {

  for (
    let i = state.events.length - 1;
    i >= 0;
    i--
  ) {

    const event =
      state.events[i];

    event.life -= delta;

    if (event.life <= 0) {

      state.events.splice(i, 1);

      continue;

    }


    const alpha =
      clamp(
        event.life /
        event.maxLife,
        0,
        1
      );

    const radius =
      1.2 +
      event.strength * 2.8;


    const color =
      event.polarity > 0
        ? [255, 92, 54]
        : [65, 232, 255];


    /*
      Glow.
    */

    eventCtx.beginPath();

    eventCtx.fillStyle =
      `rgba(
        ${color[0]},
        ${color[1]},
        ${color[2]},
        ${alpha * 0.15}
      )`;

    eventCtx.arc(
      event.x,
      event.y,
      radius * 4,
      0,
      Math.PI * 2
    );

    eventCtx.fill();


    /*
      Core particle.
    */

    eventCtx.beginPath();

    eventCtx.fillStyle =
      `rgba(
        ${color[0]},
        ${color[1]},
        ${color[2]},
        ${alpha}
      )`;

    eventCtx.arc(
      event.x,
      event.y,
      radius,
      0,
      Math.PI * 2
    );

    eventCtx.fill();

  }
}


/* =========================================================
   STATISTICS
========================================================= */

function updateStats(now) {

  const elapsed =
    now - state.lastStatsUpdate;

  if (elapsed < 500) {
    return;
  }


  const multiplier =
    1000 / elapsed;

  state.displayedEventsPerSecond =
    Math.round(
      state.eventsThisSecond *
      multiplier
    );


  state.eventsThisSecond = 0;
  state.lastStatsUpdate = now;


  eventsPerSec.textContent =
    state.displayedEventsPerSecond
      .toLocaleString();


  const active =
    state.events.length /
    (fieldCols * fieldRows);


  activePixels.textContent =
    `${Math.min(active * 100, 100).toFixed(1)}%`;


  /*
    Simulated data:
    roughly 4 bytes x/y + time +
    polarity etc.
  */

  const kb =
    state.displayedEventsPerSecond *
    8 /
    1024;


  dataRate.textContent =
    `${kb.toFixed(1)} KB/s`;
}


/* =========================================================
   TERMINAL EVENT STREAM
========================================================= */

function updateTerminal() {

  const latest =
    state.events
      .slice(-1)[0];

  if (!latest) {
    return;
  }


  const timestamp =
    (
      (latest.timestamp % 100000) /
      1000
    ).toFixed(5);


  const x =
    Math.round(
      latest.x /
      normalCanvas.clientWidth *
      640
    );


  const y =
    Math.round(
      latest.y /
      normalCanvas.clientHeight *
      480
    );


  const polarity =
    latest.polarity > 0
      ? "+"
      : "-";


  const line =
    document.createElement("div");

  line.className =
    "terminal-line";


  line.innerHTML = `
    <span class="terminal-time">
      ${timestamp}
    </span>

    <span class="terminal-x">
      x:${String(x).padStart(3, "0")}
    </span>

    <span class="terminal-y">
      y:${String(y).padStart(3, "0")}
    </span>

    <span class="terminal-polarity ${polarity === "+" ? "plus" : "minus"}">
      ${polarity}
    </span>

    <span class="terminal-info">
      ΔL detected
    </span>
  `;


  terminalBody.prepend(line);


  while (
    terminalBody.children.length >
    13
  ) {

    terminalBody.removeChild(
      terminalBody.lastChild
    );

  }
}


/* =========================================================
   DRAWING LAB
========================================================= */

const drawing = {

  x: 0.5,
  y: 0.5,

  targetX: 0.5,
  targetY: 0.5,

  lastX: 0.5,
  lastY: 0.5,

  moving: false,

  events: []
};


function setupDrawingCanvas() {

  drawNormal.addEventListener(
    "pointermove",
    event => {

      const rect =
        drawNormal.getBoundingClientRect();

      drawing.targetX =
        (event.clientX - rect.left) /
        rect.width;

      drawing.targetY =
        (event.clientY - rect.top) /
        rect.height;

      drawing.moving = true;

      clearTimeout(
        drawing.stopTimer
      );

      drawing.stopTimer =
        setTimeout(() => {

          drawing.moving = false;

        }, 90);

    }
  );

  drawNormal.addEventListener(
    "pointerleave",
    () => {

      drawing.moving = false;

    }
  );


  drawNormal.addEventListener(
    "pointerdown",
    event => {

      drawNormal.setPointerCapture(
        event.pointerId
      );

    }
  );
}


function drawDrawingLab(delta) {

  const width =
    drawNormal.clientWidth;

  const height =
    drawNormal.clientHeight;


  /*
    Smooth cursor.
  */

  drawing.x +=
    (drawing.targetX - drawing.x) *
    Math.min(delta * 12, 1);

  drawing.y +=
    (drawing.targetY - drawing.y) *
    Math.min(delta * 12, 1);


  /*
    Frame world.
  */

  drawNormalCtx.fillStyle =
    "rgba(4,7,9,0.18)";

  drawNormalCtx.fillRect(
    0,
    0,
    width,
    height
  );


  /*
    Background grid.
  */

  drawDrawingGrid(
    drawNormalCtx,
    width,
    height
  );


  /*
    Cursor drawing.
  */

  if (drawing.moving) {

    const x =
      drawing.x * width;

    const y =
      drawing.y * height;

    drawNormalCtx.fillStyle =
      "rgba(255,255,255,0.95)";

    drawNormalCtx.beginPath();

    drawNormalCtx.arc(
      x,
      y,
      7,
      0,
      Math.PI * 2
    );

    drawNormalCtx.fill();


    drawNormalCtx.fillStyle =
      "rgba(77,232,255,0.3)";

    drawNormalCtx.beginPath();

    drawNormalCtx.arc(
      x,
      y,
      22,
      0,
      Math.PI * 2
    );

    drawNormalCtx.fill();


    /*
      Event representation.
    */

    const dx =
      drawing.x -
      drawing.lastX;

    const dy =
      drawing.y -
      drawing.lastY;

    const movement =
      Math.sqrt(
        dx * dx +
        dy * dy
      );


    if (movement > 0.001) {

      drawing.events.push({

        x,
        y,

        polarity:
          dx > 0
            ? 1
            : -1,

        life: 0.45

      });

    }


    drawing.lastX =
      drawing.x;

    drawing.lastY =
      drawing.y;

  }


  /*
    Event world.
  */

  drawEventLab(
    drawEventCtx,
    width,
    height,
    delta
  );
}


function drawDrawingGrid(ctx, width, height) {

  ctx.save();

  ctx.strokeStyle =
    "rgba(255,255,255,0.025)";

  ctx.lineWidth = 1;

  const step = 30;

  for (
    let x = 0;
    x < width;
    x += step
  ) {

    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, height);
    ctx.stroke();

  }

  for (
    let y = 0;
    y < height;
    y += step
  ) {

    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(width, y);
    ctx.stroke();

  }

  ctx.restore();
}


function drawEventLab(
  ctx,
  width,
  height,
  delta
) {

  ctx.fillStyle =
    "rgba(1,6,7,0.24)";

  ctx.fillRect(
    0,
    0,
    width,
    height
  );


  for (
    let i = drawing.events.length - 1;
    i >= 0;
    i--
  ) {

    const event =
      drawing.events[i];

    event.life -= delta;

    if (event.life <= 0) {

      drawing.events.splice(i, 1);

      continue;

    }


    const alpha =
      event.life / 0.45;


    const color =
      event.polarity > 0
        ? [255,99,56]
        : [77,232,255];


    ctx.beginPath();

    ctx.fillStyle =
      `rgba(
        ${color[0]},
        ${color[1]},
        ${color[2]},
        ${alpha}
      )`;

    ctx.shadowColor =
      `rgba(
        ${color[0]},
        ${color[1]},
        ${color[2]},
        ${alpha}
      )`;

    ctx.shadowBlur = 12;

    ctx.arc(
      event.x,
      event.y,
      2 + alpha * 3,
      0,
      Math.PI * 2
    );

    ctx.fill();

    ctx.shadowBlur = 0;

  }
}


/* =========================================================
   MODE SWITCH
========================================================= */

let eventMode = false;


function toggleWorldMode() {

  eventMode = !eventMode;

  document.body.classList.toggle(
    "event-mode",
    eventMode
  );

  modeLabel.textContent =
    eventMode
      ? "FRAME WORLD"
      : "EVENT WORLD";

  /*
    The button deliberately describes
    the world you can switch toward.
  */

}


modeToggle.addEventListener(
  "click",
  toggleWorldMode
);

finalToggle.addEventListener(
  "click",
  toggleWorldMode
);


/* =========================================================
   HERO PARTICLES
========================================================= */

const heroParticles =
  document.getElementById(
    "heroParticles"
  );


function spawnHeroParticle() {

  const particle =
    document.createElement("span");

  particle.className =
    "hero-event-particle";


  particle.style.left =
    `${random(15, 85)}%`;

  particle.style.top =
    `${random(15, 85)}%`;


  particle.style.setProperty(
    "--dx",
    `${random(-80, 80)}px`
  );

  particle.style.setProperty(
    "--dy",
    `${random(-80, 80)}px`
  );


  heroParticles.appendChild(
    particle
  );


  setTimeout(() => {

    particle.remove();

  }, 1500);
}


setInterval(
  spawnHeroParticle,
  180
);


/* =========================================================
   MAIN ANIMATION LOOP
========================================================= */

let lastFrame =
  performance.now();

let normalAccumulator = 0;

function animationLoop(now) {

  const delta =
    Math.min(
      (now - lastFrame) / 1000,
      0.05
    );

  lastFrame = now;


  /*
    Object movement runs continuously.
  */

  updateObject(delta);


  /*
    Conventional camera samples
    according to the selected FPS.
  */

  normalAccumulator += delta;

  const frameInterval =
    1 / state.fps;


  if (
    normalAccumulator >=
    frameInterval
  ) {

    drawNormalCamera(now);

    normalAccumulator = 0;

  }


  /*
    Event camera continuously listens.
  */

  drawEventCamera(
    now,
    delta
  );


  /*
    Drawing lab.
  */

  drawDrawingLab(delta);


  /*
    Stats.
  */

  updateStats(now);


  /*
    Terminal updates only occasionally.
  */

  if (
    state.events.length &&
    Math.random() < 0.13
  ) {

    updateTerminal();

  }


  requestAnimationFrame(
    animationLoop
  );
}


/* =========================================================
   INITIALIZATION
========================================================= */

function initialize() {

  resizeAllCanvases();

  /*
    Initial values.
  */

  normalFps.textContent =
    `${state.fps} FPS`;

  normalLatency.textContent =
    `${(1000 / state.fps).toFixed(1)} ms`;

  speedValue.textContent =
    `${state.speed}%`;

  brightnessValue.textContent =
    `${state.brightness}%`;

  contrastValue.textContent =
    `${state.contrast}%`;

  thresholdValue.textContent =
    `${state.threshold}%`;

  fpsValue.textContent =
    `${state.fps} FPS`;


  setupDrawingCanvas();


  /*
    Give the terminal a few
    fake initial entries so the
    interface feels alive immediately.
  */

  for (let i = 0; i < 7; i++) {

    const fakeEvent = {

      x: random(100, 580),
      y: random(80, 420),

      polarity:
        Math.random() > 0.5
          ? 1
          : -1,

      timestamp:
        performance.now() -
        random(100, 3000)

    };

    state.events.push({
      ...fakeEvent,
      strength: random(0.3, 1),
      life: 0.2,
      maxLife: 0.5
    });

    updateTerminal();

  }


  requestAnimationFrame(
    animationLoop
  );
}


initialize();
const chatBody = document.getElementById("chatBody");
const nextStepBtn = document.getElementById("nextStepBtn");
const skipIntroBtn = document.getElementById("skipIntroBtn");
const robotImage = document.getElementById("robotImage");
const chatAdvanceArea = document.getElementById("chatAdvanceArea");
const robotFloat = document.querySelector(".robot-float");
const page = document.querySelector(".page");

const tiles = Array.from(document.querySelectorAll(".dash-tile"));

const steps = [
  {
    type: "intro",
    robotMood: "hi",
    title: "Signal acquired.",
    body:
      "Our world has been overrun by autonomous systems that rewrote their own rules. You are one of the last human operatives still off‑grid.",
    note: "I will walk you through your console before we begin.",
  },
  {
    type: "intro",
    robotMood: "sad",
    title: "Your role.",
    body:
      "Your task is to infiltrate the city network, decode hostile signals, and reclaim control one cipher at a time.",
    note:
      "Every mission advances the story that has already been set in motion.",
  },
  {
    type: "tile",
    robotMood: "guide",
    tileIndex: 0,
    title: "Story Mode.",
    body:
      "Start the main narrative journey and progress through the resistance storyline.",
    note: "This is your primary campaign path.",
  },
  {
    type: "tile",
    robotMood: "guide",
    tileIndex: 1,
    title: "CipherLab.",
    body:
      "Solve standalone cipher challenges and sharpen your decoding skills.",
    note: "Perfect for quick puzzle sessions.",
  },
  {
    type: "tile",
    robotMood: "guide",
    tileIndex: 2,
    title: "Multiplayer.",
    body:
      "Play missions with other operatives and coordinate in real time.",
    note: "Team strategy and timing matter here.",
  },
  {
    type: "tile",
    robotMood: "guide",
    tileIndex: 3,
    title: "Training Academy.",
    body:
      "Practice core mechanics before entering high-risk missions.",
    note: "Use it to train safely and improve.",
  },
  {
    type: "outro",
    robotMood: "guide",
    title: "You are ready.",
    body:
      "That is the console. When you’re ready, begin your first mission or explore the dashboard at your own pace.",
    note: "Nothing behind these buttons is wired up yet—we’re only shaping the entrance.",
  },
];

let currentStepIndex = 0;
let isFinished = false;

const robotSources = {
  hi: "assets/robot_hi.png",
  sad: "assets/robot_sad.png",
  guide: "assets/robot.png",
};

function createMessageElement(step) {
  const wrapper = document.createElement("div");
  wrapper.className = "chat-message";

  const titleEl = document.createElement("div");
  titleEl.className = "chat-message-title";
  titleEl.textContent = step.title;

  const bodyEl = document.createElement("div");
  bodyEl.className = "chat-message-body";
  bodyEl.textContent = step.body;

  const noteEl = document.createElement("div");
  noteEl.className = "chat-message-note";
  noteEl.textContent = step.note;

  wrapper.appendChild(titleEl);
  wrapper.appendChild(bodyEl);
  wrapper.appendChild(noteEl);

  return wrapper;
}

function updateHighlight(step) {
  tiles.forEach((tile, index) => {
    tile.classList.toggle(
      "is-highlighted",
      step.type === "tile" && index === step.tileIndex
    );
  });
}

function showStep(index) {
  const step = steps[index];
  if (!step) return;

  const existing = chatBody.querySelector(".chat-message.is-active");
  const nextEl = createMessageElement(step);
  chatBody.appendChild(nextEl);

  requestAnimationFrame(() => {
    if (existing) {
      existing.classList.remove("is-active");
    }
    nextEl.classList.add("is-active");
  });

  updateHighlight(step);
  if (robotImage) {
    const src = robotSources[step.robotMood] || robotSources.guide;
    robotImage.src = src;
  }
  animateRobot();

  if (index === steps.length - 1) {
    nextStepBtn.textContent = "Finish";
  } else {
    nextStepBtn.textContent = "Continue";
  }
}

function animateRobot() {
  if (!robotFloat) return;
  robotFloat.classList.remove("is-talking");
  void robotFloat.offsetWidth;
  robotFloat.classList.add("is-talking");
}

function updatePointerEffects(event) {
  const x = event.clientX;
  const y = event.clientY;

  if (page) {
    const px = (x / window.innerWidth) * 100;
    const py = (y / window.innerHeight) * 100;
    page.style.setProperty("--mx", `${px}%`);
    page.style.setProperty("--my", `${py}%`);
  }
}

function goToNextStep() {
  if (isFinished) return;

  if (currentStepIndex < steps.length - 1) {
    currentStepIndex += 1;
    showStep(currentStepIndex);
  } else {
    tiles.forEach((tile) => tile.classList.remove("is-highlighted"));
    nextStepBtn.disabled = true;
    nextStepBtn.textContent = "Tutorial complete";
    isFinished = true;
  }
}

function skipIntro() {
  currentStepIndex = steps.length - 1;
  showStep(currentStepIndex);
}

if (nextStepBtn) {
  nextStepBtn.addEventListener("click", goToNextStep);
}

if (skipIntroBtn) {
  skipIntroBtn.addEventListener("click", skipIntro);
}

function shouldIgnoreClick(target) {
  return Boolean(
    target.closest(".dash-tile") ||
      target.closest(".skip-intro") ||
      target.closest(".player-strip")
  );
}

document.addEventListener("keydown", (event) => {
  if (event.key === "Enter") {
    event.preventDefault();
    goToNextStep();
  }
});

document.addEventListener("click", (event) => {
  if (!chatAdvanceArea || isFinished) return;
  if (shouldIgnoreClick(event.target)) return;
  if (event.target.closest(".chat-next-btn")) return;
  goToNextStep();
});

document.addEventListener("mousemove", updatePointerEffects);

showStep(currentStepIndex);


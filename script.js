const firebaseConfig = {
  apiKey: "AIzaSyDxYwWxD_f8e19HwxVqx7McqdE1miW7j5I",
  authDomain: "kwog-24c4c.firebaseapp.com",
  databaseURL: "https://kwog-24c4c-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "kwog-24c4c",
  storageBucket: "kwog-24c4c.firebasestorage.app",
  messagingSenderId: "75932550486",
  appId: "1:75932550486:web:7a831988dfdf6d6ef542f7",
  measurementId: "G-860L10K2NS"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.database();

function formatTime(seconds) {
  const m = Math.floor(seconds / 60).toString().padStart(2, "0");
  const s = Math.floor(seconds % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
}

function getTimeLeft(timerData) {
  if (!timerData) return 0;
  const { startAt, duration, isPaused, pauseAt } = timerData;
  const now = Date.now();

  if (isPaused && pauseAt) {
    return Math.max(0, duration - Math.floor((pauseAt - startAt) / 1000));
  }

  return Math.max(0, duration - Math.floor((now - startAt) / 1000));
}

document.addEventListener("DOMContentLoaded", () => {
  const userInput = document.getElementById("userNumber");
  const startBtn = document.getElementById("startBtn");
  const userLabel = document.getElementById("userLabel");
  const userIdDisplay = document.getElementById("userIdDisplay");
  const timerContainer = document.getElementById("timerContainer");
  const timerDisplay = document.getElementById("timer");

  let currentNumber = null;
  let timerInterval = null;

  const saved = localStorage.getItem("userNumber");
  if (saved) {
    showUI(saved);
    autoStart(saved);
  }

  startBtn?.addEventListener("click", () => {
    const num = userInput.value.trim();
    if (!/^(0?[1-9]|[1-9][0-9]|100)$/.test(num)) {
      return alert("Введите номер от 1 до 100!");
    }

    const numKey = String(+num);
    db.ref("timers").once("value").then(all => {
      const timers = all.val() || {};
      if (Object.keys(timers).length >= 100) {
        return alert("Уже 100 участников.");
      }
      if (timers[numKey]) {
        return alert("Этот номер занят.");
      }

      const now = Date.now();
      db.ref(`timers/${numKey}`).set({
        duration: 600,
        startAt: now,
        isPaused: true,
        pauseAt: now
      }).then(() => {
        localStorage.setItem("userNumber", numKey);
        location.reload();
      });
    });
  });

  function autoStart(num) {
    currentNumber = num;
    db.ref(`timers/${num}`).on("value", snap => {
      const data = snap.val();
      if (!data) {
        localStorage.removeItem("userNumber");
        location.reload();
        return;
      }

      showUI(num);

      if (timerInterval) clearInterval(timerInterval);

      timerInterval = setInterval(() => {
        const left = getTimeLeft(data);
        timerDisplay.textContent = formatTime(left);
        if (left <= 0) {
          clearInterval(timerInterval);
          alert("⏰ Время вышло!");
        }
      }, 1000);
    });
  }

  function showUI(num) {
    userInput.style.display = "none";
    startBtn.style.display = "none";
    const h2 = document.querySelector("h2");
    if (h2) h2.style.display = "block";
    userLabel.style.display = "block";
    userIdDisplay.textContent = num;
    timerContainer.style.display = "flex";
  }
});

// === АДМИН ===
if (document.getElementById("usersTable")) {
  const usersTable = document.getElementById("usersTable");
  const pauseAllBtn = document.getElementById("pauseAllBtn");
  let allPaused = false;

  db.ref("timers").on("value", snap => {
    const data = snap.val() || {};
    usersTable.innerHTML = "";

    for (const user in data) {
      const timer = data[user];
      const timeLeft = getTimeLeft(timer);

      let color = "green";
      if (timeLeft === 0) color = "red";
      else if (timeLeft < 300) color = "yellow";

      const indicator = `<span class="indicator ${color}"></span>`;
      const pauseText = timer.isPaused ? "▶" : "⏸";

      const card = document.createElement("div");
      card.className = "card";
      card.innerHTML = `
        <div class="info">
          <div>${indicator}<strong>Участник ${user}</strong></div>
          <div class="time-display" id="time-${user}">Осталось: ${formatTime(timeLeft)}</div>
        </div>
        <div class="actions">
          <button class="delete" data-user="${user}">❌</button>
          <button class="pause" data-user="${user}">${pauseText}</button>
          <button class="add30" data-user="${user}">+30</button>
          <button class="sub30" data-user="${user}">-30</button>
          <button class="reset" data-user="${user}">🔄</button>
        </div>
      `;
      usersTable.appendChild(card);
    }

    document.querySelectorAll(".delete").forEach(btn => {
      btn.onclick = () => {
        const user = btn.dataset.user;
        db.ref(`timers/${user}`).remove();
      };
    });

    document.querySelectorAll(".pause").forEach(btn => {
      btn.onclick = () => {
        const user = btn.dataset.user;
        db.ref(`timers/${user}`).once("value").then(snap => {
          const t = snap.val();
          if (!t) return;

          const now = Date.now();
          const isPaused = t.isPaused;

          const updates = {
            isPaused: !isPaused
          };

          if (!isPaused) {
            updates.pauseAt = now;
          } else {
            const pauseDuration = now - t.pauseAt;
            updates.startAt = t.startAt + pauseDuration;
            updates.pauseAt = null;
          }

          db.ref(`timers/${user}`).update(updates);
        });
      };
    });

    document.querySelectorAll(".add30").forEach(btn => {
      btn.onclick = () => {
        const user = btn.dataset.user;
        db.ref(`timers/${user}/duration`).transaction(d => d + 30);
      };
    });

    document.querySelectorAll(".sub30").forEach(btn => {
      btn.onclick = () => {
        const user = btn.dataset.user;
        db.ref(`timers/${user}/duration`).transaction(d => Math.max(0, d - 30));
      };
    });

    document.querySelectorAll(".reset").forEach(btn => {
      btn.onclick = () => {
        const user = btn.dataset.user;
        const now = Date.now();
        db.ref(`timers/${user}`).update({
          startAt: now,
          duration: 600,
          isPaused: true,
          pauseAt: now
        });
      };
    });
  });

  pauseAllBtn.onclick = () => {
    allPaused = !allPaused;
    db.ref("timers").once("value").then(snap => {
      const timers = snap.val() || {};
      const now = Date.now();
      for (const user in timers) {
        const t = timers[user];
        const updates = { isPaused: allPaused };

        if (allPaused) {
          updates.pauseAt = now;
        } else if (t.pauseAt) {
          updates.startAt = t.startAt + (now - t.pauseAt);
          updates.pauseAt = null;
        }

        db.ref(`timers/${user}`).update(updates);
      }

      pauseAllBtn.textContent = allPaused ? "▶ Старт всем" : "⏸ Пауза всем";
    });
  };
}

// Firebase инициализация
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
  const s = (seconds % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
}

// --- Участник ---
if (document.getElementById("startBtn")) {
  const userInput = document.getElementById("userNumber");
  const startBtn = document.getElementById("startBtn");
  startBtn.setAttribute("type", "button");
  const userLabel = document.getElementById("userLabel");
  const userIdDisplay = document.getElementById("userIdDisplay");
  const timerContainer = document.getElementById("timerContainer");
  const timerDisplay = document.getElementById("timer");

  let timerInterval = null;
  let timeExpiredNotified = false;

  const params = new URLSearchParams(window.location.search);
  const urlNum = params.get("num");

  if (urlNum && /^\d+$/.test(urlNum)) {
    const num = parseInt(urlNum, 10).toString();
    showUI(num);
    autoStart(num);
    window.history.replaceState(null, "", window.location.pathname);
  }

  startBtn.onclick = (e) => {
    e.preventDefault();
    const raw = userInput.value.trim();
    const num = parseInt(raw, 10).toString();

    if (!/^\d+$/.test(num) || +num < 1 || +num > 60) {
      alert("Введите номер от 1 до 60!");
      return;
    }

    db.ref("timers").once("value").then(all => {
      const timers = all.val() || {};
      if (Object.keys(timers).length >= 60) {
        alert("Уже 60 участников.");
        return;
      }
      if (timers[num]) {
        alert("Этот номер занят.");
        return;
      }

      db.ref(`timers/${num}`).set({ timeLeft: 600, isPaused: true }).then(() => {
        window.location.href = `?num=${num}`;
      }).catch(err => {
        console.error(err);
        alert("Ошибка при регистрации.");
      });
    });
  };

  function showUI(num) {
    userInput.style.display = "none";
    startBtn.style.display = "none";
    document.querySelector("h2").style.display = "none";
    userLabel.style.display = "block";
    userIdDisplay.textContent = num;
    timerContainer.style.display = "block";
  }

  function autoStart(num) {
    db.ref(`timers/${num}`).once("value").then(snap => {
      const data = snap.val();
      if (!data) {
        alert("Номер был удалён.");
        window.location.href = "/";
        return;
      }

      listenTimer(num);
      db.ref(`timers/${num}`).on("value", snap => {
        if (!snap.val()) {
          alert("⛔ Твой таймер был удалён.");
          window.location.href = "/";
        }
      });
    });
  }

  function listenTimer(num) {
    db.ref(`timers/${num}`).on("value", snap => {
      const data = snap.val();
      if (!data) return;

      timerDisplay.textContent = formatTime(data.timeLeft);
      clearInterval(timerInterval);

      if (!data.isPaused) {
        let remaining = data.timeLeft;
        timerInterval = setInterval(() => {
          remaining--;
          timerDisplay.textContent = formatTime(remaining);
          if (remaining <= 0) {
            clearInterval(timerInterval);
            if (!timeExpiredNotified) {
              timeExpiredNotified = true;
              alert("⏰ Время вышло!");
            }
          }
        }, 1000);
      }
    });
  }
}

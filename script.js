// For Firebase JS SDK v7.20.0 and later, measurementId is optional
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

document.addEventListener("DOMContentLoaded", () => {
  // --- Участник ---
  if (!document.getElementById("startBtn")) return;

  const userInput = document.getElementById("userNumber");
  const startBtn = document.getElementById("startBtn");
  const userLabel = document.getElementById("userLabel");
  const userIdDisplay = document.getElementById("userIdDisplay");
  const timerContainer = document.getElementById("timerContainer");
  const timerDisplay = document.getElementById("timer");

  let timerInterval = null;
  let currentNumber = null;
  let timeExpiredNotified = false;

  console.log("⏳ Страница загружена, проверяем localStorage...");
  const saved = localStorage.getItem("userNumber");
  if (saved) {
    console.log("🔁 Найден сохранённый номер:", saved);
    showUI(saved);
    autoStart(saved);
  }

  startBtn.onclick = () => {
    const num = userInput.value.trim();
    console.log("🚀 Нажата кнопка СТАРТ с номером:", num);

    if (!/^(0?[1-9]|[1-5][0-9]|60)$/.test(num)) {
      alert("Введите номер от 1 до 60!");
      console.error("⛔ Неверный ввод номера:", num);
      return;
    }
    const numKey = String(+num);

    db.ref("timers").once("value").then(all => {
      const timers = all.val() || {};
      if (Object.keys(timers).length >= 60) {
        alert("Уже 60 участников.");
        console.warn("⚠ Превышено количество участников");
        return;
      }
      if (timers[numKey]) {
        alert("Этот номер занят.");
        console.warn("⚠ Номер уже занят:", numKey);
        return;
      }

      currentNumber = numKey;
      db.ref(`timers/${numKey}`).set({ timeLeft: 600, isPaused: true }).then(() => {
        localStorage.setItem("userNumber", numKey);
        console.log("✅ Зарегистрирован номер:", numKey);
        location.reload();
      });
    });
  };

  function autoStart(num) {
    currentNumber = num;
    db.ref(`timers/${num}`).once("value").then(snap => {
      const data = snap.val();
      if (!data) {
        db.ref("timers").once("value").then(allSnap => {
          const all = allSnap.val() || {};
          const found = Object.entries(all).find(([key, val]) => val.renamedTo === num);
          if (found) {
            const [newNum] = found;
            localStorage.setItem("userNumber", newNum);
            autoStart(newNum);
          } else {
            alert("Номер был удалён.");
            localStorage.removeItem("userNumber");
            location.reload();
          }
        });
        return;
      }

      showUI(num);
      listenTimer(num);

      db.ref(`timers/${num}`).on("value", snap => {
        const data = snap.val();
        if (data?.renamedTo && data.renamedTo !== num) {
          db.ref(`timers/${num}/renamedTo`).remove();
          localStorage.setItem("userNumber", data.renamedTo);
          autoStart(data.renamedTo);
        }
      });
    });
  }

  function listenTimer(num) {
    db.ref(`timers/${num}`).on("value", snap => {
      const data = snap.val();
      if (!data) {
        alert("⛔ Твой таймер был удалён администратором.");
        localStorage.removeItem("userNumber");
        location.reload();
        return;
      }

      timerDisplay.textContent = formatTime(data.timeLeft);
      clearInterval(timerInterval);

      if (!data.isPaused) {
        console.log("▶ Запущен таймер для номера:", num);
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
      } else {
        console.log("⏸ Таймер приостановлен для номера:", num);
      }
    });
  }

  function showUI(num) {
    console.log("🎛 Отображаем интерфейс для номера:", num);
    if (!userInput || !startBtn || !userLabel || !userIdDisplay || !timerContainer) return;
    userInput.style.display = "none";
    startBtn.style.display = "none";
    const h2 = document.querySelector("h2");
    if (h2) h2.style.display = "none";
    userLabel.style.display = "block";
    userIdDisplay.textContent = num;
    timerContainer.style.display = "block";
  }
});
// --- Админ ---
if (document.getElementById("usersTable")) {
  const usersTable = document.getElementById("usersTable");
  const pauseAllBtn = document.getElementById("pauseAllBtn");
  let allPaused = false;
  const localTimers = {};

  db.ref("timers").on("value", snap => {
    const data = snap.val() || {};
    usersTable.innerHTML = "";
    Object.keys(localTimers).forEach(key => delete localTimers[key]);

    for (const user in data) {
      const timeLeft = data[user].timeLeft;
      let color = "green";
      if (timeLeft === 0) color = "red";
      else if (timeLeft < 300) color = "yellow";

      const indicator = `<span class="indicator ${color}"></span>`;
      const isPaused = data[user].isPaused;
      const pauseText = isPaused ? "▶" : "⏸";

      const card = document.createElement("div");
      card.className = "card";
      card.innerHTML = `
        <div class="info">
          <div>${indicator}<strong>Участник ${user}</strong></div>
          <div class="time-display">Осталось: ${formatTime(timeLeft)}</div>
        </div>
        <div class="actions">
          <button class="delete" data-user="${user}">❌</button>
          <button class="rename" data-user="${user}">✏</button>
          <button class="pause" data-user="${user}">${pauseText}</button>
          <button class="add30" data-user="${user}">+30</button>
          <button class="sub30" data-user="${user}">-30</button>
          <button class="reset" data-user="${user}">🔄</button>
        </div>
      `;
      usersTable.appendChild(card);

      localTimers[user] = {
        timeLeft: timeLeft,
        isPaused: isPaused,
        element: card.querySelector(".time-display")
      };
    }

    document.querySelectorAll(".delete").forEach(btn => {
      btn.onclick = () => {
        const user = btn.dataset.user;
        db.ref(`timers/${user}`).remove();
      };
    });

    document.querySelectorAll(".rename").forEach(btn => {
      btn.onclick = () => {
        const oldUser = btn.dataset.user;
        const newUser = prompt("Новый номер (1–60):", oldUser);
        if (!/^(0?[1-9]|[1-5][0-9]|60)$/.test(newUser)) return alert("Неверный номер!");
        const newKey = String(+newUser);
        if (newKey === oldUser) return;

        db.ref(`timers/${newKey}`).once("value").then(snap => {
          if (snap.exists()) return alert("Такой номер уже занят.");
          db.ref(`timers/${oldUser}`).once("value").then(dataSnap => {
            const data = dataSnap.val();
            if (!data) return;
            db.ref(`timers/${newKey}`).set({ ...data, renamedTo: oldUser });
            db.ref(`timers/${oldUser}`).remove();
          });
        });
      };
    });

    document.querySelectorAll(".pause").forEach(btn => {
      btn.onclick = () => {
        const user = btn.dataset.user;
        db.ref(`timers/${user}/isPaused`).once("value").then(snap => {
          db.ref(`timers/${user}/isPaused`).set(!snap.val());
        });
      };
    });

    document.querySelectorAll(".add30").forEach(btn => {
      btn.onclick = () => {
        const user = btn.dataset.user;
        db.ref(`timers/${user}`).transaction(t => {
          if (t) t.timeLeft += 30;
          return t;
        });
      };
    });

    document.querySelectorAll(".sub30").forEach(btn => {
      btn.onclick = () => {
        const user = btn.dataset.user;
        db.ref(`timers/${user}`).transaction(t => {
          if (t) t.timeLeft = Math.max(0, t.timeLeft - 30);
          return t;
        });
      };
    });

    document.querySelectorAll(".reset").forEach(btn => {
      btn.onclick = () => {
        const user = btn.dataset.user;
        if (confirm("Сбросить таймер до 10 минут?")) {
          db.ref(`timers/${user}`).set({ timeLeft: 600, isPaused: true });
        }
      };
    });
  });

  setInterval(() => {
    for (const user in localTimers) {
      const t = localTimers[user];
      if (!t.isPaused) {
        db.ref(`timers/${user}`).transaction(data => {
          if (data && data.timeLeft > 0) {
            data.timeLeft--;
          }
          return data;
        });
      }
    }
  }, 1000);

  pauseAllBtn.onclick = () => {
    allPaused = !allPaused;
    db.ref("timers").once("value").then(snap => {
      const timers = snap.val() || {};
      for (const user in timers) {
        db.ref(`timers/${user}/isPaused`).set(allPaused);
      }
    });
    pauseAllBtn.textContent = allPaused ? "▶ Старт всем" : "⏸ Пауза всем";
  };
}

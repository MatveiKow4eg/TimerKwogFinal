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
  return ${m}:${s};
}

// --- Участник ---

function diagnoseEnvironment() {
  const results = [];

  // 1. Проверка localStorage
  try {
    localStorage.setItem("testKey", "1");
    if (localStorage.getItem("testKey") === "1") {
      results.push("✅ localStorage: работает");
    } else {
      results.push("❌ localStorage: недоступен");
    }
    localStorage.removeItem("testKey");
  } catch (e) {
    results.push("❌ localStorage: заблокирован");
  }

  // 2. Проверка cookies
  results.push(`✅ Cookies: ${navigator.cookieEnabled ? "включены" : "❌ отключены"}`);

  // 3. Проверка встроенного браузера
  const ua = navigator.userAgent.toLowerCase();
  if (ua.includes("instagram") || ua.includes("fb") || ua.includes("tiktok") || ua.includes("line") || ua.includes("telegram")) {
    results.push("⚠️ Встроенный браузер (Instagram/Telegram/TikTok и т.д.) — возможны ошибки");
  } else {
    results.push("✅ Браузер: нормальный (не встроенный)");
  }

  // 4. Экономия трафика
  const conn = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
  if (conn && conn.saveData) {
    results.push("⚠️ Включен режим экономии трафика (save-data)");
  } else {
    results.push("✅ Экономия трафика: выключена");
  }

  // 5. Инкогнито
  const fs = window.RequestFileSystem || window.webkitRequestFileSystem;
  if (!fs) {
    results.push("❔ Не удалось определить инкогнито");
    showResults();
  } else {
    fs(window.TEMPORARY, 100, () => {
      results.push("✅ Инкогнито: нет");
      showResults();
    }, () => {
      results.push("🕵️‍♂️ Режим инкогнито: включен");
      showResults();
    });
  }

  function showResults() {
    alert("🔍 Диагностика среды:\n\n" + results.join("\n"));
    console.log("🔍 Подробности:\n", results.join("\\n"));
  }
}


if (document.getElementById("startBtn")) {
  const userInput = document.getElementById("userNumber");
  const startBtn = document.getElementById("startBtn");
  startBtn.setAttribute("type", "button"); // ✅ Защита от submit
  const userLabel = document.getElementById("userLabel");
  const userIdDisplay = document.getElementById("userIdDisplay");
  const timerContainer = document.getElementById("timerContainer");
  const timerDisplay = document.getElementById("timer");

  let timerInterval = null;
  let currentNumber = null;
  let timeExpiredNotified = false;

  function saveUserNumber(num) {
    num = parseInt(num, 10).toString(); // ✅ Без ведущих нулей
    try {
      localStorage.setItem("userNumber", num);
      document.cookie = userNumber=${num}; path=/; max-age=86400;
      console.log("✅ Сохранён номер:", num);
    } catch (e) {
      console.error("Ошибка сохранения номера:", e);
    }
  }

  function getSavedNumber() {
    try {
      const local = localStorage.getItem("userNumber");
      const cookie = document.cookie.match(/userNumber=(\d+)/)?.[1];
      const result = local || cookie;
      if (result) return parseInt(result, 10).toString(); // ✅ нормализуем
      return null;
    } catch (e) {
      console.error("Ошибка чтения номера:", e);
      return null;
    }
  }

  // --- Новый способ: URL-параметр как резерв ---
const params = new URLSearchParams(window.location.search);
const urlNum = params.get("num");
if (urlNum && /^\d+$/.test(urlNum)) {
  console.log("URL содержит номер:", urlNum);
  saveUserNumber(urlNum);
  showUI(urlNum);
  autoStart(urlNum);

  // ✅ Очищаем URL, чтобы избежать бесконечного цикла
  window.history.replaceState(null, "", window.location.pathname);
} else {
  const saved = getSavedNumber();
  if (saved) {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", () => {
        showUI(saved);
        autoStart(saved);
      });
    } else {
      showUI(saved);
      autoStart(saved);
    }
  }
}

  startBtn.onclick = (e) => {
    e.preventDefault();

    const raw = userInput.value.trim();
    const num = parseInt(raw, 10).toString(); // ✅ преобразуем к числу-строке
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

      currentNumber = num;

      db.ref(timers/${num}).set({ timeLeft: 600, isPaused: true })
        .then(() => {
          saveUserNumber(num);
          // ✅ добавим переход с ?num= в адрес
          window.location.href = ${window.location.pathname}?num=${num};
        })
        .catch(error => {
          console.error("Ошибка Firebase:", error);
          alert("Ошибка при сохранении номера. Попробуйте ещё раз.");
        });
    });
  };


  function autoStart(num) {
    currentNumber = num;
    db.ref(timers/${num}).once("value").then(snap => {
      const data = snap.val();
      if (!data) {
        db.ref("timers").once("value").then(allSnap => {
          const all = allSnap.val() || {};
          const found = Object.entries(all).find(([key, val]) => val.renamedTo === num);
          if (found) {
            const [newNum] = found;
            saveUserNumber(newNum);
            autoStart(newNum);
          } else {
            alert("Номер был удалён.");
            localStorage.removeItem("userNumber");
            document.cookie = "userNumber=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
            location.reload();
          }
        });
        return;
      }

      showUI(num);
      listenTimer(num);

      db.ref(timers/${num}).on("value", snap => {
        const data = snap.val();
        if (data?.renamedTo && data.renamedTo !== num) {
          db.ref(timers/${num}/renamedTo).remove();
          saveUserNumber(data.renamedTo);
          autoStart(data.renamedTo);
        }
      });
    });
  }
  function listenTimer(num) {
    db.ref(timers/${num}).on("value", snap => {
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
        let remaining = data.timeLeft;
        timerDisplay.textContent = formatTime(remaining);
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

  function showUI(num) {
    userInput.style.display = "none";
    startBtn.style.display = "none";
    document.querySelector("h2").style.display = "none";
    userLabel.style.display = "block";
    userIdDisplay.textContent = num;
    timerContainer.style.display = "block";
  }
}

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

      const indicator = <span class="indicator ${color}"></span>;
      const isPaused = data[user].isPaused;
      const pauseText = isPaused ? "▶" : "⏸";

      const card = document.createElement("div");
      card.className = "card";
      card.innerHTML = 
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
      ;
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
        db.ref(timers/${user}).remove();
      };
    });

    document.querySelectorAll(".rename").forEach(btn => {
      btn.onclick = () => {
        const oldUser = btn.dataset.user;
        const newUser = prompt("Новый номер (1–60):", oldUser);
        if (!/^\d+$/.test(newUser) || +newUser < 1 || +newUser > 60) return alert("Неверный номер!");
        if (newUser === oldUser) return;

        db.ref(timers/${newUser}).once("value").then(snap => {
          if (snap.exists()) return alert("Такой номер уже занят.");
          db.ref(timers/${oldUser}).once("value").then(dataSnap => {
            const data = dataSnap.val();
            if (!data) return;
            db.ref(timers/${newUser}).set({ ...data, renamedTo: oldUser });
            db.ref(timers/${oldUser}).remove();
          });
        });
      };
    });

    document.querySelectorAll(".pause").forEach(btn => {
      btn.onclick = () => {
        const user = btn.dataset.user;
        db.ref(timers/${user}/isPaused).once("value").then(snap => {
          db.ref(timers/${user}/isPaused).set(!snap.val());
        });
      };
    });

    document.querySelectorAll(".add30").forEach(btn => {
      btn.onclick = () => {
        const user = btn.dataset.user;
        db.ref(timers/${user}).transaction(t => {
          if (t) t.timeLeft += 30;
          return t;
        });
      };
    });

    document.querySelectorAll(".sub30").forEach(btn => {
      btn.onclick = () => {
        const user = btn.dataset.user;
        db.ref(timers/${user}).transaction(t => {
          if (t) t.timeLeft = Math.max(0, t.timeLeft - 30);
          return t;
        });
      };
    });

    document.querySelectorAll(".reset").forEach(btn => {
      btn.onclick = () => {
        const user = btn.dataset.user;
        if (confirm("Сбросить таймер до 10 минут?")) {
          db.ref(timers/${user}).set({ timeLeft: 600, isPaused: true });
        }
      };
    });
  });

  setInterval(() => {
    for (const user in localTimers) {
      const t = localTimers[user];
      if (!t.isPaused) {
        db.ref(timers/${user}).transaction(data => {
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
        db.ref(timers/${user}/isPaused).set(allPaused);
      }
    });
    pauseAllBtn.textContent = allPaused ? "▶ Старт всем" : "⏸ Пауза всем";
  };
} 

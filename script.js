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

// --- РЈС‡Р°СЃС‚РЅРёРє ---
if (document.getElementById("startBtn")) {
  const userInput = document.getElementById("userNumber");
  const startBtn = document.getElementById("startBtn");
  const userLabel = document.getElementById("userLabel");
  const userIdDisplay = document.getElementById("userIdDisplay");
  const timerContainer = document.getElementById("timerContainer");
  const timerDisplay = document.getElementById("timer");

  let timerInterval = null;
  let currentNumber = null;
  let timeExpiredNotified = false;

// Р“Р°СЂР°РЅС‚РёСЂРѕРІР°РЅРЅС‹Р№ Р·Р°РїСѓСЃРє autoStart РґР°Р¶Рµ РµСЃР»Рё DOM СѓР¶Рµ Р·Р°РіСЂСѓР¶РµРЅ
const saved = localStorage.getItem("userNumber");
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

startBtn.onclick = () => {
  const num = userInput.value.trim();
  if (!/^\d+$/.test(num) || +num < 1 || +num > 60) {
    alert("Р’РІРµРґРёС‚Рµ РЅРѕРјРµСЂ РѕС‚ 1 РґРѕ 60!");
    return;
  }

  db.ref("timers").once("value").then(all => {
    const timers = all.val() || {};
    if (Object.keys(timers).length >= 60) {
      alert("РЈР¶Рµ 60 СѓС‡Р°СЃС‚РЅРёРєРѕРІ.");
      return;
    }
    if (timers[num]) {
      alert("Р­С‚РѕС‚ РЅРѕРјРµСЂ Р·Р°РЅСЏС‚.");
      return;
    }

    currentNumber = num;

    // рџ”„ РќРѕРІС‹Р№ РІР°СЂРёР°РЅС‚ вЂ” Р±РµР·РѕРїР°СЃРЅС‹Р№ СЃС‚Р°СЂС‚ СЃ РїРµСЂРµР·Р°РіСЂСѓР·РєРѕР№
    db.ref(`timers/${num}`).set({ timeLeft: 600, isPaused: true }).then(() => {
      localStorage.setItem("userNumber", num);
      location.reload(); // РІС‹Р·РѕРІРµС‚ autoStart РїРѕСЃР»Рµ Р·Р°РіСЂСѓР·РєРё
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
            alert("РќРѕРјРµСЂ Р±С‹Р» СѓРґР°Р»С‘РЅ.");
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
        alert("в›” РўРІРѕР№ С‚Р°Р№РјРµСЂ Р±С‹Р» СѓРґР°Р»С‘РЅ Р°РґРјРёРЅРёСЃС‚СЂР°С‚РѕСЂРѕРј.");
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
              alert("вЏ° Р’СЂРµРјСЏ РІС‹С€Р»Рѕ!");
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

// --- РђРґРјРёРЅ ---
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
      const pauseText = isPaused ? "в–¶" : "вЏё";

      const card = document.createElement("div");
      card.className = "card";
      card.innerHTML = `
        <div class="info">
          <div>${indicator}<strong>РЈС‡Р°СЃС‚РЅРёРє ${user}</strong></div>
          <div class="time-display">РћСЃС‚Р°Р»РѕСЃСЊ: ${formatTime(timeLeft)}</div>
        </div>
        <div class="actions">
          <button class="delete" data-user="${user}">вќЊ</button>
          <button class="rename" data-user="${user}">вњЏ</button>
          <button class="pause" data-user="${user}">${pauseText}</button>
          <button class="add30" data-user="${user}">+30</button>
          <button class="sub30" data-user="${user}">-30</button>
          <button class="reset" data-user="${user}">рџ”„</button>
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
        const newUser = prompt("РќРѕРІС‹Р№ РЅРѕРјРµСЂ (1вЂ“60):", oldUser);
        if (!/^\d+$/.test(newUser) || +newUser < 1 || +newUser > 60) return alert("РќРµРІРµСЂРЅС‹Р№ РЅРѕРјРµСЂ!");
        if (newUser === oldUser) return;

        db.ref(`timers/${newUser}`).once("value").then(snap => {
          if (snap.exists()) return alert("РўР°РєРѕР№ РЅРѕРјРµСЂ СѓР¶Рµ Р·Р°РЅСЏС‚.");
          db.ref(`timers/${oldUser}`).once("value").then(dataSnap => {
            const data = dataSnap.val();
            if (!data) return;
            db.ref(`timers/${newUser}`).set({ ...data, renamedTo: oldUser });
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
        if (confirm("РЎР±СЂРѕСЃРёС‚СЊ С‚Р°Р№РјРµСЂ РґРѕ 10 РјРёРЅСѓС‚?")) {
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
    pauseAllBtn.textContent = allPaused ? "в–¶ РЎС‚Р°СЂС‚ РІСЃРµРј" : "вЏё РџР°СѓР·Р° РІСЃРµРј";
  };
}

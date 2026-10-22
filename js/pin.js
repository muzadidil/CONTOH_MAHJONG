// ==========================================
// PIN SECURITY ACCESS LOCK - MAHJONG WAYS
// ==========================================
(function () {
  // Ganti PIN di bawah ini sesuai kebutuhan Anda:
  const CORRECT_PIN = "8888";

  let enteredPin = "";
  let isLocked = true;

  document.addEventListener('DOMContentLoaded', () => {
    const overlay = document.getElementById('pinLockOverlay');
    const card = document.getElementById('pinCard');
    const dots = [
      document.getElementById('dot0'),
      document.getElementById('dot1'),
      document.getElementById('dot2'),
      document.getElementById('dot3')
    ];
    const errorMsg = document.getElementById('pinErrorMsg');
    const clearBtn = document.getElementById('pinClearBtn');
    const backBtn = document.getElementById('pinBackBtn');

    if (!overlay || !card) return;

    function updateDots() {
      dots.forEach((dot, idx) => {
        if (!dot) return;
        if (idx < enteredPin.length) {
          dot.classList.add('filled');
        } else {
          dot.classList.remove('filled');
        }
      });
    }

    function handleDigit(digit) {
      if (!isLocked || enteredPin.length >= 4) return;
      enteredPin += digit;
      updateDots();
      if (errorMsg) errorMsg.classList.remove('visible');

      // Play soft click sound if audio is initialized
      if (window.MahjongSound && window.MahjongSound.playTileClick) {
        window.MahjongSound.playTileClick(1);
      }

      if (enteredPin.length === 4) {
        setTimeout(verifyPin, 120);
      }
    }

    function handleBackspace() {
      if (!isLocked || enteredPin.length === 0) return;
      enteredPin = enteredPin.slice(0, -1);
      updateDots();
      if (errorMsg) errorMsg.classList.remove('visible');

      if (window.MahjongSound && window.MahjongSound.playTileClick) {
        window.MahjongSound.playTileClick(-1);
      }
    }

    function handleClear() {
      if (!isLocked) return;
      enteredPin = "";
      updateDots();
      if (errorMsg) errorMsg.classList.remove('visible');
    }

    function verifyPin() {
      if (enteredPin === CORRECT_PIN) {
        // PIN Benar
        isLocked = false;
        if (errorMsg) {
          errorMsg.style.color = '#4caf50';
          errorMsg.textContent = 'PIN Benar! Membuka akses...';
          errorMsg.classList.add('visible');
        }

        if (window.MahjongSound && window.MahjongSound.playGoldToWild) {
          window.MahjongSound.playGoldToWild();
        }

        setTimeout(() => {
          overlay.classList.add('unlocked');
        }, 300);
      } else {
        // PIN Salah
        if (errorMsg) {
          errorMsg.style.color = '#ff5252';
          errorMsg.textContent = 'PIN Salah! Silakan coba lagi.';
          errorMsg.classList.add('visible');
        }

        card.classList.add('shake');

        if (window.MahjongSound && window.MahjongSound.playTileClick) {
          window.MahjongSound.playTileClick(-3);
        }

        setTimeout(() => {
          card.classList.remove('shake');
          enteredPin = "";
          updateDots();
        }, 550);
      }
    }

    // Keypad numeric button clicks
    document.querySelectorAll('.pin-btn[data-val]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        handleDigit(btn.getAttribute('data-val'));
      });
    });

    if (clearBtn) {
      clearBtn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        handleClear();
      });
    }

    if (backBtn) {
      backBtn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        handleBackspace();
      });
    }

    // Support keyboard input (Numpad, 0-9 keys, Backspace, Escape/Delete)
    window.addEventListener('keydown', (e) => {
      if (!isLocked || overlay.classList.contains('unlocked')) return;

      if (e.key >= '0' && e.key <= '9') {
        e.preventDefault();
        handleDigit(e.key);
      } else if (e.key === 'Backspace') {
        e.preventDefault();
        handleBackspace();
      } else if (e.key === 'Escape' || e.key === 'Delete') {
        e.preventDefault();
        handleClear();
      }
    });
  });
})();

// Complete PG Soft Mahjong Ways (1) 1,024-Ways Cascading Game Engine
(function () {
  const { SYMBOLS, WEIGHTED_POOL } = window.MahjongTiles;

  const COLS = 5;
  const ROWS = 4;
  const BASE_MULTIPLIERS = [1, 2, 3, 5];
  const FREE_MULTIPLIERS = [2, 4, 6, 10];
  const BET_OPTIONS = [400, 800, 1200, 2000, 4000, 10000, 20000, 50000, 100000];

  const TIPS = [
    'Menangkan hingga 25.000x lipat taruhan!',
    'Simbol Berlapis Emas berubah menjadi simbol Wild ketika menang!',
    '3 simbol Scatter (胡) memicu 12 Putaran Gratis!',
    'Selama Putaran Gratis, pengali meningkat menjadi x2, x4, x6, x10!',
    '1.024 Cara Menang dari gulungan paling kiri ke kanan!'
  ];

  // Game State
  let state = {
    balance: 1000000,
    betIndex: 3, // Rp 2.000
    currentWin: 0,
    isSpinning: false,
    isTurbo: false,
    autoSpinsRemaining: 0,
    freeSpinsRemaining: 0,
    inFreeSpins: false,
    cascadeIndex: 0,
    forceMode: null, // 'scatter' | 'bigwin' | null
    grid: [] // [col][row] -> { type, gold }
  };

  // DOM Elements
  let els = {};
  let tipInterval = null;
  let tipIdx = 0;

  function formatIDR(amount) {
    return 'Rp ' + Math.round(amount).toLocaleString('id-ID');
  }

  function sleep(ms) {
    const factor = state.isTurbo ? 0.45 : 1;
    return new Promise(resolve => setTimeout(resolve, Math.max(40, ms * factor)));
  }

  function randomRegularSymbol() {
    return WEIGHTED_POOL[Math.floor(Math.random() * WEIGHTED_POOL.length)];
  }

  // Generate a single tile for (col, row)
  function createRandomCell(col, allowScatter = true) {
    const isMiddleReel = col === 1 || col === 2 || col === 3;

    // In Free Spins mode, Reel 3 (col === 2) has all gold-plated regular symbols!
    if (state.inFreeSpins && col === 2) {
      return {
        type: randomRegularSymbol(),
        gold: true
      };
    }

    // Small chance of Scatter
    if (allowScatter && Math.random() < 0.045) {
      return { type: 'scatter', gold: false };
    }

    const sym = randomRegularSymbol();
    const isGold = isMiddleReel && Math.random() < (state.inFreeSpins ? 0.42 : 0.26);

    return {
      type: sym,
      gold: isGold
    };
  }

  // Generate initial or new spin 5x4 grid
  function generateBoard(forceMode) {
    const newGrid = [];
    for (let c = 0; c < COLS; c++) {
      const colArr = [];
      for (let r = 0; r < ROWS; r++) {
        colArr.push(createRandomCell(c, true));
      }
      newGrid.push(colArr);
    }

    if (forceMode === 'scatter') {
      // Place 3 Scatters on Reels 1, 3, 5
      newGrid[0][1] = { type: 'scatter', gold: false };
      newGrid[2][2] = { type: 'scatter', gold: false };
      newGrid[4][1] = { type: 'scatter', gold: false };
    } else if (forceMode === 'bigwin') {
      // Set up a guaranteed high-paying Green Dragon (發) & Red Dragon (中) + Gold-plated cascade
      newGrid[0][0] = { type: 'fa', gold: false };
      newGrid[0][2] = { type: 'fa', gold: false };
      newGrid[1][1] = { type: 'fa', gold: true };
      newGrid[1][2] = { type: 'zhong', gold: true };
      newGrid[2][0] = { type: 'fa', gold: true };
      newGrid[2][2] = { type: 'fa', gold: false };
      newGrid[3][1] = { type: 'fa', gold: true };
      newGrid[4][1] = { type: 'fa', gold: false };
    } else if (Math.random() < 0.34) {
      // Natural fun hit rate: seed a 3-reel match occasionally so gameplay feels lively
      const luckySym = WEIGHTED_POOL[Math.floor(Math.random() * WEIGHTED_POOL.length)];
      const r0 = Math.floor(Math.random() * ROWS);
      const r1 = Math.floor(Math.random() * ROWS);
      const r2 = Math.floor(Math.random() * ROWS);
      newGrid[0][r0] = { type: luckySym, gold: false };
      newGrid[1][r1] = { type: luckySym, gold: Math.random() < 0.55 };
      newGrid[2][r2] = { type: luckySym, gold: Math.random() < 0.55 };
    }

    return newGrid;
  }

  // Render a single tile HTML
  function renderTileContent(cellData) {
    const symDef = SYMBOLS[cellData.type] || SYMBOLS.fa;
    let classes = 'mahjong-tile';
    if (cellData.type === 'wild') classes += ' tile-wild';
    else if (cellData.type === 'scatter') classes += ' tile-scatter';
    else if (cellData.gold) classes += ' gold-plated';

    return `<div class="${classes}">${symDef.svg()}</div>`;
  }

  // Render the full 5x4 board
  function renderBoard(animateDrop = false) {
    for (let c = 0; c < COLS; c++) {
      const colEl = els.reelCols[c];
      colEl.innerHTML = '';
      for (let r = 0; r < ROWS; r++) {
        const cellEl = document.createElement('div');
        cellEl.className = 'tile-cell' + (animateDrop ? ' drop-in' : '');
        cellEl.dataset.col = c;
        cellEl.dataset.row = r;
        if (animateDrop) {
          cellEl.style.animationDelay = `${c * 45 + r * 20}ms`;
        }
        cellEl.innerHTML = renderTileContent(state.grid[c][r]);
        colEl.appendChild(cellEl);
      }
    }
  }

  function getCellElement(c, r) {
    return els.reelCols[c].children[r];
  }

  // Update Multiplier Track UI
  function updateMultiplierUI() {
    const mults = state.inFreeSpins ? FREE_MULTIPLIERS : BASE_MULTIPLIERS;
    const activeIdx = Math.min(state.cascadeIndex, mults.length - 1);

    els.multSteps.forEach((stepEl, i) => {
      stepEl.textContent = 'x' + mults[i];
      if (i === activeIdx) {
        stepEl.classList.add('active');
      } else {
        stepEl.classList.remove('active');
      }
    });
  }

  // Update Wallet, Bet, Win UI
  function updateDashboardUI() {
    els.balanceVal.textContent = formatIDR(state.balance);
    els.betVal.textContent = formatIDR(BET_OPTIONS[state.betIndex]);
    els.winVal.textContent = formatIDR(state.currentWin);

    if (state.inFreeSpins) {
      els.gameShell.classList.add('freespin-mode');
      els.fsCountBadge.textContent = state.freeSpinsRemaining;
    } else {
      els.gameShell.classList.remove('freespin-mode');
    }

    if (state.autoSpinsRemaining > 0) {
      els.spinBtn.classList.add('auto-active');
      els.autoBadge.textContent = state.autoSpinsRemaining;
      els.autoBtn.classList.add('active-toggle');
    } else {
      els.spinBtn.classList.remove('auto-active');
      els.autoBtn.classList.remove('active-toggle');
    }
  }

  // Evaluate 1,024 Ways Wins from Reel 0 (leftmost) to right
  function evaluateWays(grid) {
    // Find distinct regular symbols present on Reel 0 (or Wild on Reel 0)
    const candidateSymbols = new Set();
    for (let r = 0; r < ROWS; r++) {
      const t = grid[0][r].type;
      if (t !== 'scatter' && t !== 'wild') {
        candidateSymbols.add(t);
      }
    }

    const winningCellsKeySet = new Set();
    const winDetails = [];

    candidateSymbols.forEach(sym => {
      const matchingRowsPerCol = [];
      for (let c = 0; c < COLS; c++) {
        const rows = [];
        for (let r = 0; r < ROWS; r++) {
          const cellType = grid[c][r].type;
          if (cellType === sym || cellType === 'wild') {
            rows.push(r);
          }
        }
        if (rows.length > 0) {
          matchingRowsPerCol.push(rows);
        } else {
          break;
        }
      }

      const reelCount = matchingRowsPerCol.length;
      if (reelCount >= 3) {
        // Calculate total ways (product of matching symbol counts on each reel)
        let ways = 1;
        matchingRowsPerCol.forEach((rows, cIdx) => {
          ways *= rows.length;
          rows.forEach(rIdx => winningCellsKeySet.add(`${cIdx},${rIdx}`));
        });

        const basePay = SYMBOLS[sym].pays[reelCount] || 5;
        winDetails.push({
          symbol: sym,
          reelCount,
          ways,
          basePay
        });
      }
    });

    const winningCoords = Array.from(winningCellsKeySet).map(k => {
      const [c, r] = k.split(',').map(Number);
      return { c, r };
    });

    return {
      hasWin: winDetails.length > 0,
      winDetails,
      winningCoords
    };
  }

  // Count Scatters anywhere on the 5x4 board
  function findScatters(grid) {
    const coords = [];
    for (let c = 0; c < COLS; c++) {
      for (let r = 0; r < ROWS; r++) {
        if (grid[c][r].type === 'scatter') {
          coords.push({ c, r });
        }
      }
    }
    return coords;
  }

  function showBannerWin(amount, mult) {
    els.marqueeBanner.classList.add('win-highlight');
    els.marqueeText.textContent = `MENANG ${formatIDR(amount)} (Pengali x${mult})!`;
  }

  function resetBannerTip() {
    els.marqueeBanner.classList.remove('win-highlight');
    els.marqueeText.textContent = TIPS[tipIdx % TIPS.length];
  }

  function showBoardFloatWin(amount, mult) {
    els.floatWinLabel.textContent = `KOMBO x${mult}`;
    els.floatWinAmount.textContent = formatIDR(amount);
    els.boardWinFloat.classList.add('show');
    setTimeout(() => {
      els.boardWinFloat.classList.remove('show');
    }, state.isTurbo ? 550 : 950);
  }

  // Core Spin & Cascade Loop
  async function executeSpin() {
    if (state.isSpinning) return;

    const currentBet = BET_OPTIONS[state.betIndex];
    if (!state.inFreeSpins && state.balance < currentBet) {
      alert('Saldo simulasi habis! Saldo akan diisi ulang otomatis Rp 1.000.000.');
      state.balance = 1000000;
      updateDashboardUI();
      return;
    }

    state.isSpinning = true;
    state.cascadeIndex = 0;
    state.currentWin = 0;

    if (state.inFreeSpins) {
      state.freeSpinsRemaining = Math.max(0, state.freeSpinsRemaining - 1);
    } else {
      state.balance -= currentBet;
    }

    updateMultiplierUI();
    updateDashboardUI();
    resetBannerTip();

    els.spinBtn.classList.add('spinning-state');
    window.MahjongSound.playSpinStart();

    // Animate spinning blur on all cells
    document.querySelectorAll('.tile-cell').forEach(el => el.classList.add('spinning'));

    const forced = state.forceMode;
    state.forceMode = null;

    await sleep(360);

    // Generate new board & stop reels column by column
    state.grid = generateBoard(forced);

    for (let c = 0; c < COLS; c++) {
      const colEl = els.reelCols[c];
      colEl.innerHTML = '';
      for (let r = 0; r < ROWS; r++) {
        const cellEl = document.createElement('div');
        cellEl.className = 'tile-cell drop-in';
        cellEl.innerHTML = renderTileContent(state.grid[c][r]);
        colEl.appendChild(cellEl);
      }
      window.MahjongSound.playTileClick(c);
      await sleep(95);
    }

    await sleep(220);

    // Cascading evaluation loop
    let keepCascading = true;
    while (keepCascading) {
      const result = evaluateWays(state.grid);
      if (!result.hasWin) {
        keepCascading = false;
        break;
      }

      const mults = state.inFreeSpins ? FREE_MULTIPLIERS : BASE_MULTIPLIERS;
      const activeMult = mults[Math.min(state.cascadeIndex, mults.length - 1)];

      // Calculate step win
      let stepBaseCoins = 0;
      result.winDetails.forEach(w => {
        stepBaseCoins += w.basePay * w.ways;
      });
      const stepWinIDR = Math.round((currentBet / 20) * stepBaseCoins * activeMult);

      state.currentWin += stepWinIDR;
      state.balance += stepWinIDR;

      // Highlight winning tiles
      result.winningCoords.forEach(({ c, r }) => {
        const el = getCellElement(c, r);
        if (el) el.classList.add('winning');
      });

      window.MahjongSound.playCascadeWin(state.cascadeIndex);
      showBannerWin(state.currentWin, activeMult);
      showBoardFloatWin(stepWinIDR, activeMult);
      updateDashboardUI();

      await sleep(620);

      // Separate gold-plated winning tiles (which morph into Wild!) vs regular winning tiles (which explode!)
      let hasGoldMorph = false;
      const toRemove = new Set();

      result.winningCoords.forEach(({ c, r }) => {
        const cell = state.grid[c][r];
        const el = getCellElement(c, r);
        if (cell.gold && cell.type !== 'wild' && cell.type !== 'scatter') {
          // Gold-plated tile transforms into WILD!
          hasGoldMorph = true;
          cell.type = 'wild';
          cell.gold = false;
          if (el) {
            el.classList.remove('winning');
            el.classList.add('morphing-wild');
            el.innerHTML = renderTileContent(cell);
          }
        } else {
          toRemove.add(`${c},${r}`);
          if (el) {
            el.classList.remove('winning');
            el.classList.add('exploding');
          }
        }
      });

      if (hasGoldMorph) {
        window.MahjongSound.playGoldToWild();
      }

      await sleep(340);

      // Apply gravity: drop remaining tiles down & fill top with new tiles
      for (let c = 0; c < COLS; c++) {
        const surviving = [];
        for (let r = 0; r < ROWS; r++) {
          if (!toRemove.has(`${c},${r}`)) {
            surviving.push(state.grid[c][r]);
          }
        }
        const missingCount = ROWS - surviving.length;
        const newTop = [];
        for (let i = 0; i < missingCount; i++) {
          newTop.push(createRandomCell(c, true));
        }
        state.grid[c] = [...newTop, ...surviving];
      }

      // Advance multiplier step for next cascade!
      state.cascadeIndex++;
      updateMultiplierUI();

      // Re-render board with drop-in animation
      renderBoard(true);
      window.MahjongSound.playTileClick(2);
      await sleep(380);
    }

    // Check if 3+ Scatters (胡) landed to trigger 12 Free Spins!
    const scatters = findScatters(state.grid);
    if (scatters.length >= 3) {
      scatters.forEach(({ c, r }) => {
        const el = getCellElement(c, r);
        if (el) el.classList.add('winning');
      });
      window.MahjongSound.playScatterTrigger();
      const awardedSpins = 12 + (scatters.length - 3) * 2;
      state.freeSpinsRemaining += awardedSpins;
      state.inFreeSpins = true;
      await showCelebrationOverlay(
        'PUTARAN GRATIS!',
        `ANDA MEMENANGKAN ${awardedSpins} PUTARAN GRATIS`,
        'Pengali ditingkatkan menjadi x2, x4, x6, x10!'
      );
      updateMultiplierUI();
      updateDashboardUI();
    } else if (state.currentWin >= currentBet * 8) {
      // Trigger Big Win / Mega Win / Super Mega Win Celebration!
      let tierTitle = 'MENANG BESAR!';
      let tierSub = 'BIG WIN';
      if (state.currentWin >= currentBet * 35) {
        tierTitle = 'MENANG SUPER MEGA!';
        tierSub = 'SUPER MEGA WIN';
      } else if (state.currentWin >= currentBet * 18) {
        tierTitle = 'MENANG MEGA!';
        tierSub = 'MEGA WIN';
      }
      window.MahjongSound.playScatterTrigger();
      await showCelebrationOverlay(tierTitle, tierSub, formatIDR(state.currentWin));
    }

    // Check if Free Spins ended
    if (state.inFreeSpins && state.freeSpinsRemaining <= 0) {
      state.inFreeSpins = false;
      state.cascadeIndex = 0;
      updateMultiplierUI();
      updateDashboardUI();
    }

    els.spinBtn.classList.remove('spinning-state');
    state.isSpinning = false;

    // Continue Free Spins or Auto Spins automatically
    if (state.inFreeSpins && state.freeSpinsRemaining > 0) {
      setTimeout(() => executeSpin(), 650);
    } else if (state.autoSpinsRemaining > 0) {
      state.autoSpinsRemaining--;
      updateDashboardUI();
      if (state.autoSpinsRemaining > 0) {
        setTimeout(() => executeSpin(), 550);
      }
    }
  }

  // Coin Fountain & Big Win / Free Spin Celebration Modal
  let coinAnimId = null;
  function showCelebrationOverlay(title, subtitle, amountText) {
    return new Promise(resolve => {
      els.celebTitle.textContent = title;
      els.celebSub.textContent = subtitle;
      els.celebAmount.textContent = amountText;
      els.celebModal.classList.add('active');

      startCoinShower();

      let closed = false;
      const finish = () => {
        if (closed) return;
        closed = true;
        els.celebModal.classList.remove('active');
        stopCoinShower();
        resolve();
      };

      els.celebModal.onclick = finish;
      setTimeout(finish, 3400);
    });
  }

  function startCoinShower() {
    const canvas = els.coinCanvas;
    const ctx = canvas.getContext('2d');
    canvas.width = canvas.offsetWidth || 420;
    canvas.height = canvas.offsetHeight || 760;

    const coins = Array.from({ length: 45 }, () => ({
      x: Math.random() * canvas.width,
      y: -20 - Math.random() * 300,
      r: 8 + Math.random() * 8,
      vy: 3.5 + Math.random() * 4.5,
      vx: -1.5 + Math.random() * 3,
      angle: Math.random() * Math.PI * 2,
      va: 0.08 + Math.random() * 0.1
    }));

    function drawFrame() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      coins.forEach(c => {
        c.y += c.vy;
        c.x += c.vx;
        c.angle += c.va;
        if (c.y > canvas.height + 20) {
          c.y = -20;
          c.x = Math.random() * canvas.width;
        }
        ctx.save();
        ctx.translate(c.x, c.y);
        ctx.scale(Math.cos(c.angle), 1);
        ctx.beginPath();
        ctx.arc(0, 0, c.r, 0, Math.PI * 2);
        ctx.fillStyle = '#ffd54f';
        ctx.fill();
        ctx.lineWidth = 2;
        ctx.strokeStyle = '#b26a00';
        ctx.stroke();
        ctx.restore();
      });
      coinAnimId = requestAnimationFrame(drawFrame);
    }
    drawFrame();
  }

  function stopCoinShower() {
    if (coinAnimId) {
      cancelAnimationFrame(coinAnimId);
      coinAnimId = null;
    }
  }

  // Populate Paytable Modal with SVG tiles
  function buildPaytableModal() {
    const container = document.getElementById('paytableGrid');
    if (!container) return;
    container.innerHTML = '';

    Object.values(SYMBOLS).forEach(sym => {
      const card = document.createElement('div');
      card.className = 'paytable-item';
      let desc = '';
      if (sym.id === 'wild') {
        desc = 'Menggantikan semua simbol kecuali Scatter.';
      } else if (sym.id === 'scatter') {
        desc = '3 simbol memicu 12 Putaran Gratis.';
      } else {
        desc = `5x: ${sym.pays[5]} | 4x: ${sym.pays[4]} | 3x: ${sym.pays[3]}`;
      }
      card.innerHTML = `
        <div class="pt-icon mahjong-tile ${sym.id === 'wild' ? 'tile-wild' : sym.id === 'scatter' ? 'tile-scatter' : ''}">
          ${sym.svg()}
        </div>
        <div class="pt-info">
          <strong>${sym.name}</strong>
          <span>${desc}</span>
        </div>
      `;
      container.appendChild(card);
    });
  }

  // Initialize Game & Event Listeners
  function initGame() {
    els = {
      gameShell: document.getElementById('gameShell'),
      splashOverlay: document.getElementById('splashOverlay'),
      startBtn: document.getElementById('startGameBtn'),
      reelCols: Array.from(document.querySelectorAll('.reel-column')),
      multSteps: Array.from(document.querySelectorAll('.mult-step')),
      marqueeBanner: document.getElementById('marqueeBanner'),
      marqueeText: document.getElementById('marqueeText'),
      fsCountBadge: document.getElementById('fsCountBadge'),
      boardWinFloat: document.getElementById('boardWinFloat'),
      floatWinLabel: document.getElementById('floatWinLabel'),
      floatWinAmount: document.getElementById('floatWinAmount'),
      balanceVal: document.getElementById('balanceVal'),
      betVal: document.getElementById('betVal'),
      winVal: document.getElementById('winVal'),
      turboBtn: document.getElementById('turboBtn'),
      betMinusBtn: document.getElementById('betMinusBtn'),
      spinBtn: document.getElementById('spinBtn'),
      betPlusBtn: document.getElementById('betPlusBtn'),
      autoBtn: document.getElementById('autoBtn'),
      autoBadge: document.getElementById('autoBadge'),
      soundToggleBtn: document.getElementById('soundToggleBtn'),
      paytableBtn: document.getElementById('paytableBtn'),
      paytableModal: document.getElementById('paytableModal'),
      closePaytableBtn: document.getElementById('closePaytableBtn'),
      demoScatterBtn: document.getElementById('demoScatterBtn'),
      demoBigWinBtn: document.getElementById('demoBigWinBtn'),
      celebModal: document.getElementById('celebModal'),
      celebTitle: document.getElementById('celebTitle'),
      celebSub: document.getElementById('celebSub'),
      celebAmount: document.getElementById('celebAmount'),
      coinCanvas: document.getElementById('coinCanvas'),
      clockText: document.getElementById('clockText')
    };

    // Update top status clock
    const updateClock = () => {
      const now = new Date();
      els.clockText.textContent = now.toTimeString().slice(0, 5);
    };
    updateClock();
    setInterval(updateClock, 15000);

    // Rotate tips
    tipInterval = setInterval(() => {
      if (!state.isSpinning) {
        tipIdx++;
        resetBannerTip();
      }
    }, 4500);

    // Build initial board & paytable
    state.grid = generateBoard(null);
    renderBoard(false);
    updateMultiplierUI();
    updateDashboardUI();
    buildPaytableModal();

    // Splash screen start button
    els.startBtn.addEventListener('click', () => {
      window.MahjongSound.init();
      window.MahjongSound.playScatterTrigger();
      window.MahjongSound.startBgm();
      els.splashOverlay.classList.add('hidden');
    });

    // Spin button & Spacebar shortcut
    els.spinBtn.addEventListener('click', () => {
      if (state.autoSpinsRemaining > 0) {
        state.autoSpinsRemaining = 0;
        updateDashboardUI();
        return;
      }
      executeSpin();
    });

    window.addEventListener('keydown', e => {
      if (e.code === 'Space' && els.splashOverlay.classList.contains('hidden')) {
        e.preventDefault();
        executeSpin();
      }
    });

    // Turbo Toggle
    els.turboBtn.addEventListener('click', () => {
      state.isTurbo = !state.isTurbo;
      els.turboBtn.classList.toggle('active-toggle', state.isTurbo);
      window.MahjongSound.playTileClick(3);
    });

    // Bet Minus & Plus
    els.betMinusBtn.addEventListener('click', () => {
      if (state.isSpinning || state.inFreeSpins) return;
      state.betIndex = Math.max(0, state.betIndex - 1);
      window.MahjongSound.playTileClick(-1);
      updateDashboardUI();
    });

    els.betPlusBtn.addEventListener('click', () => {
      if (state.isSpinning || state.inFreeSpins) return;
      state.betIndex = Math.min(BET_OPTIONS.length - 1, state.betIndex + 1);
      window.MahjongSound.playTileClick(2);
      updateDashboardUI();
    });

    // Auto Spin Toggle (10 spins)
    els.autoBtn.addEventListener('click', () => {
      if (state.autoSpinsRemaining > 0) {
        state.autoSpinsRemaining = 0;
        updateDashboardUI();
      } else {
        state.autoSpinsRemaining = 25;
        updateDashboardUI();
        if (!state.isSpinning) executeSpin();
      }
    });

    // Demo Quick Triggers (Scatter Free Spins & Big Win Combo)
    els.demoScatterBtn.addEventListener('click', () => {
      state.forceMode = 'scatter';
      if (!state.isSpinning) executeSpin();
    });

    els.demoBigWinBtn.addEventListener('click', () => {
      state.forceMode = 'bigwin';
      if (!state.isSpinning) executeSpin();
    });

    // Sound Toggle
    els.soundToggleBtn.addEventListener('click', () => {
      const on = window.MahjongSound.toggleMute();
      els.soundToggleBtn.innerHTML = on ? '🔊 Suara: ON' : '🔇 Suara: OFF';
    });

    // Paytable Modal
    els.paytableBtn.addEventListener('click', () => {
      els.paytableModal.classList.add('open');
    });

    els.closePaytableBtn.addEventListener('click', () => {
      els.paytableModal.classList.remove('open');
    });

    els.paytableModal.addEventListener('click', e => {
      if (e.target === els.paytableModal) {
        els.paytableModal.classList.remove('open');
      }
    });
  }

  document.addEventListener('DOMContentLoaded', initGame);
})();

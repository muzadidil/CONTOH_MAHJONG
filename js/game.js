// Authentic PG Soft Mahjong Ways (1) Official 1,024-Ways Cascading Game Engine
// Matches PG Soft live demo visuals (after_mulai_1.png & screen_6s.png) and audio 1:1
(function () {
  const { SPRITE_DIR, SYMBOLS, WEIGHTED_POOL, renderTileHTML } = window.MahjongTiles;

  const COLS = 5;
  const PLAYABLE_ROWS = 4;
  const BASE_MULTIPLIERS = [1, 2, 3, 5];
  const FREE_MULTIPLIERS = [2, 4, 6, 10];
  const BET_OPTIONS = [400, 800, 1200, 2000, 4000, 10000, 20000, 50000, 100000];

  // Cascade fall distances are measured in tile heights (translateY % of the tile's own height).
  // Neighbouring .tile-cell boxes overlap by 3% of the column width (margin -1.5% top and bottom) at a
  // 162:190 tile ratio, so one row of travel is a bit less than one tile height.
  const ROW_PITCH = 1 - (0.03 * 162) / 190;

  // Official PG Soft Marquee Info Sprites (info0.png .. info5.png)
  const INFO_SPRITES = [
    'assets/sprites/info0.png',
    'assets/sprites/info1.png',
    'assets/sprites/info2.png',
    'assets/sprites/info3.png',
    'assets/sprites/info4.png',
    'assets/sprites/info5.png'
  ];

  // Exact initial board from PG Soft Mahjong Ways 1 (`after_mulai_1.png`)!
  const INITIAL_SHOWCASE_BOARD = {
    grid: [
      // Col 0: 5 Lingkaran, 5 Bambu, 2 Lingkaran, 2 Bambu
      [
        { type: 'tong5', gold: false },
        { type: 'suo5', gold: false },
        { type: 'tong2', gold: false },
        { type: 'suo2', gold: false }
      ],
      // Col 1: Naga Hijau, Naga Merah (GOLD), Scatter (胡), 8 Karakter
      [
        { type: 'fa', gold: false },
        { type: 'zhong', gold: true },
        { type: 'scatter', gold: false },
        { type: 'wan8', gold: false }
      ],
      // Col 2: WILD, 5 Bambu, 2 Lingkaran, WILD
      [
        { type: 'wild', gold: false },
        { type: 'suo5', gold: false },
        { type: 'tong2', gold: false },
        { type: 'wild', gold: false }
      ],
      // Col 3: Naga Hijau, Scatter (胡), Papan Putih (GOLD), 8 Karakter
      [
        { type: 'fa', gold: false },
        { type: 'scatter', gold: false },
        { type: 'bai', gold: true },
        { type: 'wan8', gold: false }
      ],
      // Col 4: 5 Lingkaran, 5 Bambu, 2 Lingkaran, 2 Bambu
      [
        { type: 'tong5', gold: false },
        { type: 'suo5', gold: false },
        { type: 'tong2', gold: false },
        { type: 'suo2', gold: false }
      ]
    ],
    topPeek: [
      { type: 'suo5', gold: false },
      { type: 'zhong', gold: false },
      { type: 'suo5', gold: false },
      { type: 'zhong', gold: false },
      { type: 'suo5', gold: false }
    ],
    bottomPeek: [
      { type: 'bai', gold: false },
      { type: 'bai', gold: false },
      { type: 'bai', gold: false },
      { type: 'bai', gold: false },
      { type: 'bai', gold: false }
    ]
  };

  let state = {
    balance: 1000000,
    betIndex: 3, // Rp2.000,00
    currentWin: 0,
    isSpinning: false,
    isTurbo: false,
    autoSpinsRemaining: 0,
    freeSpinsRemaining: 0,
    inFreeSpins: false,
    cascadeIndex: 0,
    forceMode: null, // 'scatter' | 'bigwin' | null
    grid: [],
    topPeek: [],
    bottomPeek: [],
    history: []
  };

  let els = {};
  let infoIdx = 0;
  let particles = [];
  let fxAnimId = null;
  let coinAnimId = null;

  // Format currency exactly like PG Soft Indonesian locale: "Rp2.000,00"
  function formatIDR(amount) {
    const fixed = Number(amount || 0).toFixed(2);
    const [intPart, decPart] = fixed.split('.');
    const formattedInt = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    return `Rp${formattedInt},${decPart}`;
  }

  function waitMs(ms) {
    return new Promise(resolve => setTimeout(resolve, Math.max(16, ms)));
  }

  function sleep(normalMs, turboMs = null) {
    const duration = state.isTurbo
      ? (turboMs !== null ? turboMs : Math.round(normalMs * 0.34))
      : normalMs;
    return waitMs(duration);
  }

  function randomRegularSymbol() {
    return WEIGHTED_POOL[Math.floor(Math.random() * WEIGHTED_POOL.length)];
  }

  function createRandomCell(col, allowScatter = true) {
    const isMiddleReel = col === 1 || col === 2 || col === 3;

    if (state.inFreeSpins && col === 2) {
      return {
        type: randomRegularSymbol(),
        gold: true
      };
    }

    if (allowScatter && Math.random() < 0.048) {
      return { type: 'scatter', gold: false };
    }

    const sym = randomRegularSymbol();
    const isGold = isMiddleReel && Math.random() < (state.inFreeSpins ? 0.45 : 0.28);

    return {
      type: sym,
      gold: isGold
    };
  }

  function generateBoard(forceMode) {
    const newGrid = [];
    const newTopPeek = [];
    const newBottomPeek = [];

    for (let c = 0; c < COLS; c++) {
      // The top peek is the next tile to fall into the column, so it may be a scatter like any other tile.
      newTopPeek.push(createRandomCell(c, true));
      newBottomPeek.push(createRandomCell(c, false));
      const colArr = [];
      for (let r = 0; r < PLAYABLE_ROWS; r++) {
        colArr.push(createRandomCell(c, true));
      }
      newGrid.push(colArr);
    }

    if (forceMode === 'scatter') {
      newGrid[0][1] = { type: 'scatter', gold: false };
      newGrid[2][2] = { type: 'scatter', gold: false };
      newGrid[4][1] = { type: 'scatter', gold: false };
    } else if (forceMode === 'bigwin') {
      newGrid[0][0] = { type: 'fa', gold: false };
      newGrid[0][2] = { type: 'fa', gold: false };
      newGrid[1][1] = { type: 'fa', gold: true };
      newGrid[1][2] = { type: 'zhong', gold: true };
      newGrid[2][0] = { type: 'fa', gold: true };
      newGrid[2][2] = { type: 'fa', gold: false };
      newGrid[3][1] = { type: 'fa', gold: true };
      newGrid[4][1] = { type: 'fa', gold: false };
    } else if (Math.random() < 0.38) {
      const luckySym = WEIGHTED_POOL[Math.floor(Math.random() * WEIGHTED_POOL.length)];
      const r0 = Math.floor(Math.random() * PLAYABLE_ROWS);
      const r1 = Math.floor(Math.random() * PLAYABLE_ROWS);
      const r2 = Math.floor(Math.random() * PLAYABLE_ROWS);
      newGrid[0][r0] = { type: luckySym, gold: false };
      newGrid[1][r1] = { type: luckySym, gold: Math.random() < 0.65 };
      newGrid[2][r2] = { type: luckySym, gold: Math.random() < 0.65 };
    }

    return { grid: newGrid, topPeek: newTopPeek, bottomPeek: newBottomPeek };
  }

  // Render a single column (Top Peek + 4 Playable Rows + Bottom Peek)
  // Supports:
  // - Continuous conveyor reel strip when isBlurred === true
  // - Smooth BounceBackStopScroller landing when animateDrop === true && !dropDistances
  // - Selective per-tile ShiftSlotHandler gravity drop when dropDistances is provided
  function renderColumn(c, animateDrop = false, customDelayBase = 0, isBlurred = false, dropDistances = null) {
    const colEl = els.reelCols[c];
    colEl.innerHTML = '';

    if (isBlurred) {
      const stripEl = document.createElement('div');
      stripEl.className = 'reel-scroll-strip';
      const loopCells = [];
      for (let i = 0; i < 6; i++) {
        loopCells.push(createRandomCell(c, false));
      }
      // Duplicate the 6 tiles (12 total) so -50% -> 0% loops seamlessly like an endless conveyor belt
      const fullStrip = [...loopCells, ...loopCells];
      fullStrip.forEach(cellData => {
        const cellEl = document.createElement('div');
        cellEl.className = 'tile-cell';
        cellEl.innerHTML = renderTileHTML(cellData, true);
        stripEl.appendChild(cellEl);
      });
      colEl.appendChild(stripEl);
      return;
    }

    const isSelectiveCascade = Array.isArray(dropDistances);
    const topDropRows = isSelectiveCascade ? (dropDistances.topPeek || 0) : (animateDrop ? 1 : 0);

    // 1. Top Peeking Half-Tile
    const topEl = document.createElement('div');
    let topCls = 'tile-cell peek-top';
    if (isSelectiveCascade && topDropRows > 0) {
      topCls += ' cascade-shift';
      const durMs = state.isTurbo ? 180 : Math.min(480, 250 + topDropRows * 55);
      topEl.style.setProperty('--drop-rows', topDropRows);
      topEl.style.setProperty('--drop-dur', `${durMs}ms`);
      topEl.style.setProperty('--drop-delay', `${customDelayBase}ms`);
    } else if (!isSelectiveCascade && animateDrop) {
      topCls += ' reel-stop-land';
    }
    topEl.className = topCls;
    topEl.innerHTML = renderTileHTML(state.topPeek[c] || createRandomCell(c, false), false);
    colEl.appendChild(topEl);

    // 2. 4 Playable Rows
    for (let r = 0; r < PLAYABLE_ROWS; r++) {
      const cellData = state.grid[c][r];
      const cellEl = document.createElement('div');
      let cls = 'tile-cell';
      if (cellData.type === 'scatter') cls += ' has-scatter';

      if (isSelectiveCascade) {
        const rowsFallen = dropDistances[r] || 0;
        if (rowsFallen > 0) {
          cls += ' cascade-shift';
          const durMs = state.isTurbo ? 180 : Math.min(480, 250 + rowsFallen * 55);
          cellEl.style.setProperty('--drop-rows', rowsFallen);
          cellEl.style.setProperty('--drop-dur', `${durMs}ms`);
          cellEl.style.setProperty('--drop-delay', `${customDelayBase}ms`);
        }
      } else if (animateDrop) {
        cls += ' reel-stop-land';
      }

      cellEl.className = cls;
      cellEl.dataset.col = c;
      cellEl.dataset.row = r;
      cellEl.innerHTML = renderTileHTML(cellData, false);
      cellEl.addEventListener('click', () => {
        if (!state.isSpinning) showTilePayoutPopup(cellData);
      });
      colEl.appendChild(cellEl);
    }

    // 3. Bottom Peeking Half-Tile (stays stationary during cascades; lands with column on spin stop)
    const botEl = document.createElement('div');
    botEl.className = 'tile-cell peek-bottom' + (!isSelectiveCascade && animateDrop ? ' reel-stop-land' : '');
    botEl.innerHTML = renderTileHTML(state.bottomPeek[c] || createRandomCell(c, false), false);
    colEl.appendChild(botEl);
  }

  function renderBoard(animateDrop = false, isBlurred = false) {
    const colStagger = state.isTurbo ? 0 : 60;
    for (let c = 0; c < COLS; c++) {
      renderColumn(c, animateDrop, c * colStagger, isBlurred, null);
    }
  }

  // Index 0 is peek-top, so playable row r is at children[r + 1]
  function getCellElement(c, r) {
    return els.reelCols[c].children[r + 1];
  }

  // Show authentic PG Soft single-tile payout popup when clicking a tile on the board
  function showTilePayoutPopup(cellData) {
    window.MahjongSound.playUiClick();
    const sym = SYMBOLS[cellData.type];
    if (!sym) return;

    let payLinesHTML = '';
    if (sym.id === 'wild') {
      payLinesHTML = `<div style="font-size:11px;line-height:1.35;color:#ffe082;">Simbol Wild menggantikan semua simbol kecuali Simbol Scatter.</div>`;
    } else if (sym.id === 'scatter') {
      payLinesHTML = `<div style="font-size:11px;line-height:1.35;color:#ffe082;">3 Simbol Scatter di mana saja memicu 12 Putaran Gratis.</div>`;
    } else {
      payLinesHTML = `
        <span><em>5</em> ${sym.pays[5]}</span>
        <span><em>4</em> ${sym.pays[4]}</span>
        <span><em>3</em> ${sym.pays[3]}</span>
      `;
    }

    els.tilePayoutCard.innerHTML = `
      <div class="tpp-tile">${renderTileHTML(cellData, false)}</div>
      <div class="tpp-pays">${payLinesHTML}</div>
    `;
    els.tilePayoutPopup.classList.remove('hidden');
  }

  // Update Multiplier Header Sprites (x1 x2 x3 x5 in normal mode, x2 x4 x6 x10 in Free Spins)
  function updateMultiplierUI() {
    const mults = state.inFreeSpins ? FREE_MULTIPLIERS : BASE_MULTIPLIERS;
    const activeIdx = Math.min(state.cascadeIndex, mults.length - 1);

    els.multSlots.forEach((slotEl, i) => {
      const mVal = mults[i];
      const inactImg = slotEl.querySelector('.mult-img-inactive');
      const actImg = slotEl.querySelector('.mult-img-active');

      // In Free Spins mode, x2 uses mul_inactive_x2_b.png
      if (state.inFreeSpins && mVal === 2) {
        inactImg.src = `${SPRITE_DIR}mul_inactive_x2_b.png`;
      } else {
        inactImg.src = `${SPRITE_DIR}mul_inactive_x${mVal}.png`;
      }
      actImg.src = `${SPRITE_DIR}mul_active_x${mVal}.png`;

      if (i === activeIdx) {
        slotEl.classList.add('active');
      } else {
        slotEl.classList.remove('active');
      }
    });
  }

  function updateDashboardUI() {
    els.balanceVal.textContent = formatIDR(state.balance);
    els.betVal.textContent = formatIDR(BET_OPTIONS[state.betIndex]);

    if (state.currentWin > 0) {
      els.pgShieldIcon.classList.add('hidden');
      els.pillWinBox.classList.remove('hidden');
      els.winVal.textContent = formatIDR(state.currentWin);
    } else {
      els.pgShieldIcon.classList.remove('hidden');
      els.pillWinBox.classList.add('hidden');
    }

    if (state.inFreeSpins) {
      els.gameShell.classList.add('freespin-mode');
      els.freespinBanner.classList.remove('hidden');
      els.fsCountBadge.textContent = state.freeSpinsRemaining;
    } else {
      els.gameShell.classList.remove('freespin-mode');
      els.freespinBanner.classList.add('hidden');
    }

    if (state.autoSpinsRemaining > 0) {
      els.spinBtn.classList.add('auto-active');
      els.spinBaseImg.src = `${SPRITE_DIR}auto_spin.png`;
      els.autoBadge.textContent = state.autoSpinsRemaining > 500 ? '∞' : state.autoSpinsRemaining;
    } else {
      els.spinBtn.classList.remove('auto-active');
      els.spinBaseImg.src = `${SPRITE_DIR}spin_base.png`;
    }
  }

  function showBannerWin(amount, isTotalWin = false) {
    els.marqueeSpriteWrap.classList.add('hidden');
    els.marqueeWinWrap.classList.remove('hidden');
    els.infoboardFrame.src = isTotalWin ? `${SPRITE_DIR}infoboard_c.png` : `${SPRITE_DIR}infoboard_a.png`;
    els.marqueeWinLabel.src = isTotalWin ? `${SPRITE_DIR}totalwin_info.png` : `${SPRITE_DIR}win_info.png`;
    els.marqueeWinAmount.textContent = formatIDR(amount);
  }

  function resetBannerTip() {
    els.marqueeWinWrap.classList.add('hidden');
    els.marqueeSpriteWrap.classList.remove('hidden');
    els.infoboardFrame.src = `${SPRITE_DIR}infoboard_b.png`;
    els.marqueeSpriteImg.src = INFO_SPRITES[infoIdx % INFO_SPRITES.length];
  }

  // Particle Burst Effect when tiles shatter or morph
  function spawnTileParticles(c, r, color = '#ffd54f') {
    const cellEl = getCellElement(c, r);
    if (!cellEl || !els.fxCanvas) return;

    const boardRect = els.fxCanvas.getBoundingClientRect();
    const cellRect = cellEl.getBoundingClientRect();
    const cx = cellRect.left - boardRect.left + cellRect.width / 2;
    const cy = cellRect.top - boardRect.top + cellRect.height / 2;

    for (let i = 0; i < 16; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 2 + Math.random() * 5.5;
      particles.push({
        x: cx,
        y: cy,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 1.5,
        size: 3 + Math.random() * 4.5,
        color: i % 2 === 0 ? color : '#ffffff',
        alpha: 1,
        decay: 0.032 + Math.random() * 0.025
      });
    }

    if (!fxAnimId) {
      runParticleLoop();
    }
  }

  function runParticleLoop() {
    const canvas = els.fxCanvas;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    canvas.width = canvas.offsetWidth || 430;
    canvas.height = canvas.offsetHeight || 460;

    function step() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particles = particles.filter(p => p.alpha > 0.02);

      particles.forEach(p => {
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.18;
        p.alpha -= p.decay;

        ctx.save();
        ctx.globalAlpha = Math.max(0, p.alpha);
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      });

      if (particles.length > 0) {
        fxAnimId = requestAnimationFrame(step);
      } else {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        fxAnimId = null;
      }
    }
    fxAnimId = requestAnimationFrame(step);
  }

  // Evaluate 1,024 Ways Wins from Reel 0 (leftmost) to right
  function evaluateWays(grid) {
    const candidateSymbols = new Set();
    for (let r = 0; r < PLAYABLE_ROWS; r++) {
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
        for (let r = 0; r < PLAYABLE_ROWS; r++) {
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

  function findScatters(grid) {
    const coords = [];
    for (let c = 0; c < COLS; c++) {
      for (let r = 0; r < PLAYABLE_ROWS; r++) {
        if (grid[c][r].type === 'scatter') {
          coords.push({ c, r });
        }
      }
    }
    return coords;
  }

  function triggerScreenShake() {
    els.gameShell.classList.remove('screen-shake');
    void els.gameShell.offsetWidth;
    els.gameShell.classList.add('screen-shake');
  }

  // Core Spin & Cascade Loop
  async function executeSpin() {
    if (state.isSpinning) return;

    const currentBet = BET_OPTIONS[state.betIndex];
    if (!state.inFreeSpins && state.balance < currentBet) {
      state.balance = 1000000;
      updateDashboardUI();
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
    els.reelBoard.classList.remove('has-active-win');

    els.spinBtn.classList.add('spinning-state');
    els.spinArrowImg.src = `${SPRITE_DIR}spin_arrow_blur.png`;
    window.MahjongSound.playSpinStart();

    // Authentic PG Soft SlotHandler.NORMAL_START_SCROLL_INTERVAL = 0.1s (100ms staggered column start in Normal Mode)
    if (!state.isTurbo) {
      for (let c = 0; c < COLS; c++) {
        els.reelCols[c].querySelectorAll('.tile-cell').forEach(el => el.classList.add('spin-windup'));
        setTimeout(() => {
          if (state.isSpinning) renderColumn(c, false, 0, true, null);
        }, 125 + c * 90);
        if (c < COLS - 1) await waitMs(90);
      }
      await waitMs(135);
    } else {
      renderBoard(false, true);
    }

    const forced = state.forceMode;
    state.forceMode = null;

    // Continuous reel spin duration: ~860ms relaxed in Normal Mode, ~240ms fast in Turbo Mode
    await sleep(860, 240);

    // Generate new board & stop reels column by column
    const generated = generateBoard(forced);
    state.grid = generated.grid;
    state.topPeek = generated.topPeek;
    state.bottomPeek = generated.bottomPeek;

    let scattersSeenSoFar = 0;

    for (let c = 0; c < COLS; c++) {
      if (scattersSeenSoFar >= 2 && !state.isTurbo) {
        els.reelCols[c].classList.add('anticipation-glow');
        window.MahjongSound.playAnticipationPulse();
        await waitMs(1400);
        els.reelCols[c].classList.remove('anticipation-glow');
        window.MahjongSound.stopAnticipationPulse();
      }

      renderColumn(c, true, 0, false, null);

      let colHasScatter = false;
      for (let r = 0; r < PLAYABLE_ROWS; r++) {
        if (state.grid[c][r].type === 'scatter') {
          colHasScatter = true;
          scattersSeenSoFar++;
        }
      }

      // Authentic PG Soft sound sync: play reelStopSingle precisely when column hits bottom bounce (190ms in Normal, 80ms in Turbo)
      const impactDelay = state.isTurbo ? 80 : 190;
      setTimeout(() => {
        if (state.isTurbo) {
          if (c === COLS - 1) window.MahjongSound.playReelStop(colHasScatter, true);
        } else {
          window.MahjongSound.playReelStop(colHasScatter, false);
        }
      }, impactDelay);

      if (c === COLS - 1) {
        setTimeout(() => window.MahjongSound.stopSpinLoop(), impactDelay);
      } else {
        // Staggered reel stop (NORMAL_STOP_SCROLL_INTERVAL = 0.2s): 215ms in Normal Mode, 45ms in Turbo Mode
        await sleep(215, 45);
      }
    }

    // Settle pause after final column lands before win evaluation
    await sleep(340, 130);

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

      let stepBaseCoins = 0;
      result.winDetails.forEach(w => {
        stepBaseCoins += w.basePay * w.ways;
      });
      const stepWinIDR = Math.round((currentBet / 20) * stepBaseCoins * activeMult);

      state.currentWin += stepWinIDR;
      state.balance += stepWinIDR;

      els.reelBoard.classList.add('has-active-win');

      // Authentic PG Soft MJPrizeState: highlight winning tiles column-by-column (80ms stagger in Normal, 0ms in Turbo)
      const colsWithWin = [...new Set(result.winningCoords.map(coord => coord.c))].sort((a, b) => a - b);
      for (let i = 0; i < colsWithWin.length; i++) {
        const winCol = colsWithWin[i];
        result.winningCoords
          .filter(coord => coord.c === winCol)
          .forEach(({ c, r }) => {
            const el = getCellElement(c, r);
            if (el) el.classList.add('winning');
          });
        if (!state.isTurbo && i < colsWithWin.length - 1) {
          await waitMs(75);
        }
      }

      // Play authentic PG Soft Mandarin voice callout & win SFX
      const primarySymId = result.winDetails[0].symbol;
      const voxCue = SYMBOLS[primarySymId] ? SYMBOLS[primarySymId].voxCue : null;
      const isMultiSym = result.winDetails.length > 1;

      window.MahjongSound.playCascadeWin(state.cascadeIndex, voxCue, isMultiSym);
      showBannerWin(stepWinIDR, false);
      updateDashboardUI();

      if (state.cascadeIndex >= 1 || stepWinIDR >= currentBet * 3) {
        triggerScreenShake();
      }

      // Let player clearly see winning tiles & hear Mandarin callout: ~860ms in Normal, ~380ms in Turbo
      await sleep(860, 380);

      // Gold-plated winning tiles morph into Wild Ingot; regular winning tiles shatter
      let hasGoldMorph = false;
      const toRemove = new Set();

      result.winningCoords.forEach(({ c, r }) => {
        const cell = state.grid[c][r];
        const el = getCellElement(c, r);
        if (cell.gold && cell.type !== 'wild' && cell.type !== 'scatter') {
          hasGoldMorph = true;
          cell.type = 'wild';
          cell.gold = false;
          spawnTileParticles(c, r, '#ffd54f');
          if (el) {
            el.classList.remove('winning');
            el.classList.add('morphing-wild');
            el.innerHTML = renderTileHTML(cell, false);
          }
        } else {
          toRemove.add(`${c},${r}`);
          spawnTileParticles(c, r, '#ffeb3b');
          if (el) {
            el.classList.remove('winning');
            el.classList.add('exploding');
          }
        }
      });

      // Authentic PG Soft removeSymbols: plays symbolShrink (whoosh/flip) and symbolWild (if gold morphed)
      window.MahjongSound.playTileShatter();
      if (hasGoldMorph) {
        window.MahjongSound.playGoldToWild();
      }

      // Tile flip/shatter & gold-to-wild morph duration: ~460ms in Normal, ~210ms in Turbo
      await sleep(460, 210);
      els.reelBoard.classList.remove('has-active-win');

      // Authentic PG Soft ShiftSlotHandler:
      // Calculate exact per-tile drop distance (in rows) so ONLY tiles above removed spaces fall down,
      // while tiles below removed spaces or in untouched columns remain 100% still!
      const colDropPlans = [];
      let affectedColOrder = 0;
      const affectedColsRightToLeft = [];
      for (let c = COLS - 1; c >= 0; c--) {
        let hasRemovedInCol = false;
        for (let r = 0; r < PLAYABLE_ROWS; r++) {
          if (toRemove.has(`${c},${r}`)) {
            hasRemovedInCol = true;
            break;
          }
        }
        if (hasRemovedInCol) affectedColsRightToLeft.push(c);
      }

      for (let c = 0; c < COLS; c++) {
        const survivingWithFall = [];
        for (let r = 0; r < PLAYABLE_ROWS; r++) {
          if (!toRemove.has(`${c},${r}`)) {
            // Count how many removed cells are strictly BELOW this row r in column c
            let holesBelow = 0;
            for (let br = r + 1; br < PLAYABLE_ROWS; br++) {
              if (toRemove.has(`${c},${br}`)) holesBelow++;
            }
            survivingWithFall.push({
              cell: state.grid[c][r],
              fallRows: holesBelow
            });
          }
        }

        const missingCount = PLAYABLE_ROWS - survivingWithFall.length;
        if (missingCount > 0) {
          // The column is a queue: the tile peeking above the board (state.topPeek) is next in line, so it
          // is the one that lands lowest. Tiles queued behind it have never been on screen, so they can be
          // drawn now. The whole new block falls together, and the tile behind the block becomes the new peek.
          const newTileFall = missingCount * ROW_PITCH;
          const newTopWithFall = [];
          for (let i = 0; i < missingCount - 1; i++) {
            newTopWithFall.push({
              cell: createRandomCell(c, true),
              fallRows: newTileFall
            });
          }
          newTopWithFall.push({
            cell: state.topPeek[c],
            fallRows: newTileFall
          });
          const combined = [...newTopWithFall, ...survivingWithFall];
          state.grid[c] = combined.map(item => item.cell);
          state.topPeek[c] = createRandomCell(c, true);

          const dropDistances = combined.map(item => item.fallRows);
          dropDistances.topPeek = newTileFall;
          const rtlIdx = affectedColsRightToLeft.indexOf(c);
          const delayMs = state.isTurbo ? 0 : Math.max(0, rtlIdx) * 75;
          colDropPlans[c] = { changed: true, dropDistances, delayMs };
          affectedColOrder++;
        } else {
          colDropPlans[c] = { changed: false, dropDistances: [0, 0, 0, 0], delayMs: 0 };
        }
      }

      // Render ONLY the columns where tiles actually shifted! Untouched columns are not re-rendered at all!
      for (let c = 0; c < COLS; c++) {
        if (colDropPlans[c].changed) {
          renderColumn(c, true, colDropPlans[c].delayMs, false, colDropPlans[c].dropDistances);
        }
      }

      // Authentic PG Soft ShiftSlotHandler & MJResultState:
      // Play symbolCollapse impact sound and step up Multiplier + Mandarin voice when cascading tiles hit the bottom!
      state.cascadeIndex++;
      const collapseImpactMs = state.isTurbo ? 120 : 240;
      setTimeout(() => {
        window.MahjongSound.playTileCollapseImpact();
        updateMultiplierUI();
        window.MahjongSound.playMultiplierUp(state.cascadeIndex);
      }, collapseImpactMs);

      // Wait for cascading tiles to finish landing + PG Soft 0.3s settle delay before checking next cascade
      const maxColDelay = state.isTurbo ? 0 : Math.max(0, (affectedColOrder - 1) * 75);
      await waitMs((state.isTurbo ? 240 : 540) + maxColDelay);
    }

    if (state.currentWin > 0) {
      showBannerWin(state.currentWin, true);
      window.MahjongSound.playGeneral('infoboardTotalwin', 1.0);

      state.history.unshift({
        time: new Date().toTimeString().slice(0, 8),
        bet: currentBet,
        win: state.currentWin,
        freeSpin: state.inFreeSpins
      });
      if (state.history.length > 25) state.history.pop();
      renderHistoryList();
    }

    // Check if 3+ Scatters (胡) landed to trigger 12 Free Spins
    const scatters = findScatters(state.grid);
    if (scatters.length >= 3) {
      els.reelBoard.classList.add('has-active-win');
      scatters.forEach(({ c, r }) => {
        const el = getCellElement(c, r);
        if (el) el.classList.add('winning');
      });
      window.MahjongSound.playScatterTrigger(true);
      const awardedSpins = 12 + (scatters.length - 3) * 2;
      state.freeSpinsRemaining += awardedSpins;
      state.inFreeSpins = true;
      window.MahjongSound.startBgm(true);

      await showFreeSpinsWonModal(awardedSpins);
      els.reelBoard.classList.remove('has-active-win');
      updateMultiplierUI();
      updateDashboardUI();
    } else if (state.currentWin >= currentBet * 5) {
      // Big Win / Mega Win / Super Mega Win
      let titleSprite = `${SPRITE_DIR}title_bw.png`;
      if (state.currentWin >= currentBet * 25) {
        titleSprite = `${SPRITE_DIR}title_smw.png`;
      } else if (state.currentWin >= currentBet * 12) {
        titleSprite = `${SPRITE_DIR}title_mw.png`;
      }
      window.MahjongSound.playScatterTrigger(false);
      await showBigWinModal(titleSprite, state.currentWin);
    }

    if (state.inFreeSpins && state.freeSpinsRemaining <= 0) {
      state.inFreeSpins = false;
      state.cascadeIndex = 0;
      window.MahjongSound.startBgm(false);
      updateMultiplierUI();
      updateDashboardUI();
    }

    els.spinBtn.classList.remove('spinning-state');
    els.spinArrowImg.src = `${SPRITE_DIR}spin_arrow.png`;
    state.isSpinning = false;

    if (state.inFreeSpins && state.freeSpinsRemaining > 0) {
      setTimeout(() => executeSpin(), state.isTurbo ? 340 : 880);
    } else if (state.autoSpinsRemaining > 0) {
      if (state.autoSpinsRemaining <= 500) state.autoSpinsRemaining--;
      updateDashboardUI();
      if (state.autoSpinsRemaining > 0) {
        setTimeout(() => executeSpin(), state.isTurbo ? 280 : 820);
      }
    }
  }

  // Official Free Spins Won Modal (uses freespin_won.png, feature_loading.png, bonus_button.png, btn_start_text.png)
  function showFreeSpinsWonModal(spinsCount) {
    return new Promise(resolve => {
      els.celebTitleSprite.src = `${SPRITE_DIR}freespin_won.png`;
      els.celebFsCount.textContent = spinsCount;
      els.celebFsCount.classList.remove('hidden');
      els.celebFsSub.classList.remove('hidden');
      els.celebAmount.classList.add('hidden');
      els.celebBtnTxtSprite.src = `${SPRITE_DIR}btn_start_text.png`;
      els.celebActionBtn.classList.remove('hidden');
      els.celebModal.classList.add('active');

      startCoinShower();

      let closed = false;
      const finish = () => {
        if (closed) return;
        closed = true;
        window.MahjongSound.playCollect();
        els.celebModal.classList.remove('active');
        stopCoinShower();
        resolve();
      };

      els.celebActionBtn.onclick = finish;
      els.celebModal.onclick = finish;
      setTimeout(finish, 4500);
    });
  }

  // Official Big Win / Mega Win / Super Mega Win Modal
  function showBigWinModal(titleSpriteUrl, targetAmount) {
    return new Promise(resolve => {
      els.celebTitleSprite.src = titleSpriteUrl;
      els.celebFsCount.classList.add('hidden');
      els.celebFsSub.classList.add('hidden');
      els.celebAmount.classList.remove('hidden');
      els.celebBtnTxtSprite.src = `${SPRITE_DIR}btn_collect_text.png`;
      els.celebActionBtn.classList.remove('hidden');
      els.celebModal.classList.add('active');

      startCoinShower();

      let closed = false;
      let current = 0;
      const steps = 40;
      const inc = targetAmount / steps;
      let stepCount = 0;
      els.celebAmount.textContent = formatIDR(0);

      const rollTimer = setInterval(() => {
        stepCount++;
        current += inc;
        if (stepCount >= steps) {
          current = targetAmount;
          clearInterval(rollTimer);
          window.MahjongSound.playBigWinEnd();
        }
        els.celebAmount.textContent = formatIDR(current);
        window.MahjongSound.playCoinTick();
      }, 55);

      const finish = () => {
        if (closed) return;
        closed = true;
        clearInterval(rollTimer);
        els.celebAmount.textContent = formatIDR(targetAmount);
        window.MahjongSound.playCollect();
        els.celebModal.classList.remove('active');
        stopCoinShower();
        resolve();
      };

      els.celebActionBtn.onclick = finish;
      els.celebModal.onclick = finish;
      setTimeout(finish, 3800);
    });
  }

  function startCoinShower() {
    const canvas = els.coinCanvas;
    const ctx = canvas.getContext('2d');
    canvas.width = canvas.offsetWidth || 430;
    canvas.height = canvas.offsetHeight || 860;

    const coins = Array.from({ length: 45 }, () => ({
      x: Math.random() * canvas.width,
      y: -20 - Math.random() * 320,
      r: 9 + Math.random() * 9,
      vy: 4 + Math.random() * 5,
      vx: -1.5 + Math.random() * 3,
      angle: Math.random() * Math.PI * 2,
      va: 0.08 + Math.random() * 0.12
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
        ctx.fillStyle = '#8c4600';
        ctx.fillRect(-c.r * 0.28, -c.r * 0.28, c.r * 0.56, c.r * 0.56);
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
        <div class="pt-icon">
          ${renderTileHTML({ type: sym.id, gold: false }, false)}
        </div>
        <div class="pt-info">
          <strong>${sym.name}</strong>
          <span>${desc}</span>
        </div>
      `;
      container.appendChild(card);
    });
  }

  function buildBetOptionsModal() {
    const grid = document.getElementById('betOptionsGrid');
    if (!grid) return;
    grid.innerHTML = '';
    BET_OPTIONS.forEach((amount, idx) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'bet-opt-btn' + (idx === state.betIndex ? ' selected' : '');
      btn.textContent = formatIDR(amount);
      btn.addEventListener('click', () => {
        if (!state.isSpinning && !state.inFreeSpins) {
          state.betIndex = idx;
          window.MahjongSound.playUiClick();
          updateDashboardUI();
          buildBetOptionsModal();
          els.betSheetModal.classList.remove('open');
        }
      });
      grid.appendChild(btn);
    });
  }

  function renderHistoryList() {
    const list = document.getElementById('historyList');
    if (!list) return;
    if (state.history.length === 0) {
      list.innerHTML = '<div style="text-align:center;padding:20px;color:#d6a97a;font-size:12px;">Belum ada riwayat putaran.</div>';
      return;
    }
    list.innerHTML = state.history
      .map(
        item => `
        <div class="history-row">
          <div>
            <strong>${item.time}</strong> ${item.freeSpin ? '<span style="color:#ffca28;">(Putaran Gratis)</span>' : ''}<br/>
            <span style="color:#d6a97a;font-size:11px;">Taruhan: ${formatIDR(item.bet)}</span>
          </div>
          <div class="h-win">+${formatIDR(item.win)}</div>
        </div>
      `
      )
      .join('');
  }

  function initGame() {
    els = {
      gameShell: document.getElementById('gameShell'),
      splashOverlay: document.getElementById('splashOverlay'),
      pgLoadArea: document.getElementById('pgLoadArea'),
      bootBar: document.getElementById('bootBar'),
      bootText: document.getElementById('bootText'),
      startBtn: document.getElementById('startGameBtn'),
      reelBoard: document.getElementById('reelBoard'),
      reelCols: Array.from(document.querySelectorAll('.reel-column')),
      fxCanvas: document.getElementById('fxCanvas'),
      tilePayoutPopup: document.getElementById('tilePayoutPopup'),
      tilePayoutCard: document.getElementById('tilePayoutCard'),
      multSlots: Array.from(document.querySelectorAll('.mult-slot')),
      demoMenuBtn: document.getElementById('demoMenuBtn'),
      demoPopupMenu: document.getElementById('demoPopupMenu'),
      demoScatterBtn: document.getElementById('demoScatterBtn'),
      demoBigWinBtn: document.getElementById('demoBigWinBtn'),
      infoboardFrame: document.getElementById('infoboardFrame'),
      marqueeSpriteWrap: document.getElementById('marqueeSpriteWrap'),
      marqueeSpriteImg: document.getElementById('marqueeSpriteImg'),
      marqueeWinWrap: document.getElementById('marqueeWinWrap'),
      marqueeWinLabel: document.getElementById('marqueeWinLabel'),
      marqueeWinAmount: document.getElementById('marqueeWinAmount'),
      freespinBanner: document.getElementById('freespinBanner'),
      fsCountBadge: document.getElementById('fsCountBadge'),
      balanceVal: document.getElementById('balanceVal'),
      betVal: document.getElementById('betVal'),
      winVal: document.getElementById('winVal'),
      pgShieldIcon: document.getElementById('pgShieldIcon'),
      pillWinBox: document.getElementById('pillWinBox'),
      walletMeterBtn: document.getElementById('walletMeterBtn'),
      betMeterBtn: document.getElementById('betMeterBtn'),
      winMeterBtn: document.getElementById('winMeterBtn'),
      turboBtn: document.getElementById('turboBtn'),
      turboIconImg: document.getElementById('turboIconImg'),
      betMinusBtn: document.getElementById('betMinusBtn'),
      spinBtn: document.getElementById('spinBtn'),
      spinBaseImg: document.getElementById('spinBaseImg'),
      spinArrowImg: document.getElementById('spinArrowImg'),
      autoBadge: document.getElementById('autoBadge'),
      betPlusBtn: document.getElementById('betPlusBtn'),
      autoBtn: document.getElementById('autoBtn'),
      soundToggleBtn: document.getElementById('soundToggleBtn'),
      paytableBtn: document.getElementById('paytableBtn'),
      historyBtn: document.getElementById('historyBtn'),
      paytableModal: document.getElementById('paytableModal'),
      closePaytableBtn: document.getElementById('closePaytableBtn'),
      betSheetModal: document.getElementById('betSheetModal'),
      closeBetSheetBtn: document.getElementById('closeBetSheetBtn'),
      autoSheetModal: document.getElementById('autoSheetModal'),
      closeAutoSheetBtn: document.getElementById('closeAutoSheetBtn'),
      historyModal: document.getElementById('historyModal'),
      closeHistoryBtn: document.getElementById('closeHistoryBtn'),
      installPwaBtn: document.getElementById('installPwaBtn'),
      installGuideModal: document.getElementById('installGuideModal'),
      closeInstallGuideBtn: document.getElementById('closeInstallGuideBtn'),
      celebModal: document.getElementById('celebModal'),
      celebTitleSprite: document.getElementById('celebTitleSprite'),
      celebFsCount: document.getElementById('celebFsCount'),
      celebFsSub: document.getElementById('celebFsSub'),
      celebAmount: document.getElementById('celebAmount'),
      celebActionBtn: document.getElementById('celebActionBtn'),
      celebBtnTxtSprite: document.getElementById('celebBtnTxtSprite'),
      coinCanvas: document.getElementById('coinCanvas')
    };

    // Simulate authentic PG Soft Splash Loading Progress Bar -> Red MULAI Button
    let progress = 20;
    const bootTimer = setInterval(() => {
      progress += 20;
      if (progress >= 100) {
        progress = 100;
        clearInterval(bootTimer);
        els.bootBar.style.width = '100%';
        els.bootText.textContent = 'Memuat sumber daya [100%]';
        setTimeout(() => {
          els.pgLoadArea.classList.add('hidden');
          els.startBtn.classList.remove('hidden');
        }, 280);
      } else {
        els.bootBar.style.width = progress + '%';
        els.bootText.textContent = progress < 60
          ? `Inisialisasi [${progress}%]`
          : `Memuat sumber daya [${progress}%]`;
      }
    }, 180);

    // Cycle marquee info sprites
    setInterval(() => {
      if (!state.isSpinning && els.marqueeWinWrap.classList.contains('hidden')) {
        infoIdx++;
        els.marqueeSpriteImg.src = INFO_SPRITES[infoIdx % INFO_SPRITES.length];
      }
    }, 8500);

    // Load initial showcase board matching `after_mulai_1.png` 1:1
    state.grid = JSON.parse(JSON.stringify(INITIAL_SHOWCASE_BOARD.grid));
    state.topPeek = JSON.parse(JSON.stringify(INITIAL_SHOWCASE_BOARD.topPeek));
    state.bottomPeek = JSON.parse(JSON.stringify(INITIAL_SHOWCASE_BOARD.bottomPeek));
    renderBoard(false, false);
    updateMultiplierUI();
    updateDashboardUI();
    buildPaytableModal();
    buildBetOptionsModal();

    // Close single-tile payout popup on click anywhere
    els.tilePayoutPopup.addEventListener('click', () => {
      els.tilePayoutPopup.classList.add('hidden');
    });

    // Splash MULAI button
    els.startBtn.addEventListener('click', () => {
      window.MahjongSound.init();
      window.MahjongSound.playStartGameButton();
      window.MahjongSound.startBgm(false);
      els.splashOverlay.classList.add('fade-out');
    });

    // Spin button & Spacebar
    els.spinBtn.addEventListener('click', () => {
      if (state.autoSpinsRemaining > 0) {
        state.autoSpinsRemaining = 0;
        window.MahjongSound.playUiClick();
        updateDashboardUI();
        return;
      }
      executeSpin();
    });

    window.addEventListener('keydown', e => {
      if (e.code === 'Space' && els.splashOverlay.classList.contains('fade-out')) {
        e.preventDefault();
        executeSpin();
      }
    });

    // Turbo Toggle
    els.turboBtn.addEventListener('click', () => {
      state.isTurbo = !state.isTurbo;
      els.gameShell.classList.toggle('turbo-mode', state.isTurbo);
      els.turboIconImg.src = state.isTurbo ? `${SPRITE_DIR}turbo_on.png` : `${SPRITE_DIR}turbo_off.png`;
      window.MahjongSound.playUiClick();
    });

    // Bet Minus & Plus
    els.betMinusBtn.addEventListener('click', () => {
      if (state.isSpinning || state.inFreeSpins) return;
      state.betIndex = Math.max(0, state.betIndex - 1);
      window.MahjongSound.playUiClick();
      updateDashboardUI();
      buildBetOptionsModal();
    });

    els.betPlusBtn.addEventListener('click', () => {
      if (state.isSpinning || state.inFreeSpins) return;
      state.betIndex = Math.min(BET_OPTIONS.length - 1, state.betIndex + 1);
      window.MahjongSound.playUiClick();
      updateDashboardUI();
      buildBetOptionsModal();
    });

    // Auto Spin Drawer
    els.autoBtn.addEventListener('click', () => {
      window.MahjongSound.playUiClick();
      if (state.autoSpinsRemaining > 0) {
        state.autoSpinsRemaining = 0;
        updateDashboardUI();
      } else {
        els.autoSheetModal.classList.add('open');
      }
    });

    document.querySelectorAll('.auto-opt-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const count = parseInt(btn.dataset.spins, 10) || 10;
        state.autoSpinsRemaining = count;
        window.MahjongSound.playUiClick();
        updateDashboardUI();
        els.autoSheetModal.classList.remove('open');
        if (!state.isSpinning) executeSpin();
      });
    });

    // Trophy Demo Menu Toggle
    els.demoMenuBtn.addEventListener('click', e => {
      e.stopPropagation();
      window.MahjongSound.playUiClick();
      els.demoPopupMenu.classList.toggle('hidden');
    });

    document.addEventListener('click', () => {
      if (els.demoPopupMenu) els.demoPopupMenu.classList.add('hidden');
    });

    els.demoScatterBtn.addEventListener('click', () => {
      els.demoPopupMenu.classList.add('hidden');
      state.forceMode = 'scatter';
      if (!state.isSpinning) executeSpin();
    });

    els.demoBigWinBtn.addEventListener('click', () => {
      els.demoPopupMenu.classList.add('hidden');
      state.forceMode = 'bigwin';
      if (!state.isSpinning) executeSpin();
    });

    // Wallet Top-Up on click
    els.walletMeterBtn.addEventListener('click', () => {
      window.MahjongSound.playUiClick();
      if (state.balance < 500000) {
        state.balance += 1000000;
        updateDashboardUI();
      }
    });

    // Open Modals
    els.betMeterBtn.addEventListener('click', () => {
      window.MahjongSound.playUiClick();
      buildBetOptionsModal();
      els.betSheetModal.classList.add('open');
    });

    const openHistoryModal = () => {
      window.MahjongSound.playUiClick();
      renderHistoryList();
      els.historyModal.classList.add('open');
    };
    els.winMeterBtn.addEventListener('click', openHistoryModal);
    els.historyBtn.addEventListener('click', openHistoryModal);

    els.paytableBtn.addEventListener('click', () => {
      window.MahjongSound.playUiClick();
      els.paytableModal.classList.add('open');
    });

    // Close Modals
    [
      [els.closePaytableBtn, els.paytableModal],
      [els.closeBetSheetBtn, els.betSheetModal],
      [els.closeAutoSheetBtn, els.autoSheetModal],
      [els.closeHistoryBtn, els.historyModal],
      [els.closeInstallGuideBtn, els.installGuideModal]
    ].forEach(([btn, modal]) => {
      if (btn && modal) {
        btn.addEventListener('click', () => modal.classList.remove('open'));
        modal.addEventListener('click', e => {
          if (e.target === modal) modal.classList.remove('open');
        });
      }
    });

    // Sound Toggle
    els.soundToggleBtn.addEventListener('click', () => {
      const on = window.MahjongSound.toggleMute();
      const soundIc = document.getElementById('soundIc');
      if (soundIc) {
        soundIc.textContent = on ? '🔊' : '🔇';
      } else {
        els.soundToggleBtn.textContent = on ? '🔊 Suara' : '🔇 Mute';
      }
      els.soundToggleBtn.classList.toggle('muted', !on);
    });

    // PWA Service Worker & Install Prompt Registration
    let deferredInstallPrompt = null;

    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('./sw.js').catch(() => {});
    }

    window.addEventListener('beforeinstallprompt', e => {
      e.preventDefault();
      deferredInstallPrompt = e;
      if (els.installPwaBtn) {
        els.installPwaBtn.classList.add('pwa-ready');
      }
    });

    window.addEventListener('appinstalled', () => {
      deferredInstallPrompt = null;
      if (els.installPwaBtn) {
        els.installPwaBtn.style.display = 'none';
      }
    });

    if (els.installPwaBtn) {
      els.installPwaBtn.addEventListener('click', async () => {
        window.MahjongSound.playUiClick();
        if (deferredInstallPrompt) {
          deferredInstallPrompt.prompt();
          await deferredInstallPrompt.userChoice;
          deferredInstallPrompt = null;
        } else if (els.installGuideModal) {
          els.installGuideModal.classList.add('open');
        }
      });
    }
  }

  document.addEventListener('DOMContentLoaded', initGame);
})();

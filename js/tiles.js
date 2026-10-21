// Authentic PG Soft Mahjong Ways (1) Official Tile & Paytable Definitions
// Uses the genuine sliced PG Soft sprite textures from assets/sprites/
// Paytable values match GameConstant in index.11599.js:
// GREEN (fa): 5:100, 4:60, 3:15
// RED (zhong): 5:80, 4:40, 3:10
// WHITE (bai): 5:60, 4:20, 3:8
// CHAR8 (wan8): 5:40, 4:15, 3:6
// BALL5 (tong5): 5:20, 4:10, 3:4
// BAMBOO5 (suo5): 5:20, 4:10, 3:4
// BALL2 (tong2): 5:10, 4:5, 3:2
// BAMBOO2 (suo2): 5:10, 4:5, 3:2

(function () {
  const SPRITE_DIR = 'assets/sprites/';

  const SYMBOLS = {
    wild: {
      id: 'wild',
      name: 'Simbol Wild (百搭)',
      voxCue: null,
      sprite: 's_wild.png',
      blurSprite: 's_wild_blur.png',
      pays: { 3: 0, 4: 0, 5: 0 }
    },
    scatter: {
      id: 'scatter',
      name: 'Simbol Scatter (胡)',
      voxCue: 'maJiangHuLe',
      sprite: 's_scatter.png',
      blurSprite: 's_scatter_blur.png',
      pays: { 3: 0, 4: 0, 5: 0 }
    },
    fa: {
      id: 'fa',
      name: 'Naga Hijau (發)',
      voxCue: 'voxPayoutFacai',
      sprite: 'h_green.png',
      blurSprite: 'h_green_blur.png',
      pays: { 3: 15, 4: 60, 5: 100 }
    },
    zhong: {
      id: 'zhong',
      name: 'Naga Merah (中)',
      voxCue: 'voxPayoutHongzhong',
      sprite: 'h_red.png',
      blurSprite: 'h_red_blur.png',
      pays: { 3: 10, 4: 40, 5: 80 }
    },
    bai: {
      id: 'bai',
      name: 'Papan Putih (白板)',
      voxCue: 'voxPayoutBaiban',
      sprite: 'h_white.png',
      blurSprite: 'h_white_blur.png',
      pays: { 3: 8, 4: 20, 5: 60 }
    },
    wan8: {
      id: 'wan8',
      name: '8 Karakter (八萬)',
      voxCue: 'voxPayout8wan',
      sprite: 'h_char_8.png',
      blurSprite: 'h_char_8_blur.png',
      pays: { 3: 6, 4: 15, 5: 40 }
    },
    tong5: {
      id: 'tong5',
      name: '5 Lingkaran (五筒)',
      voxCue: 'voxPayout5tong',
      sprite: 'l_ball_5.png',
      blurSprite: 'l_ball_5_blur.png',
      pays: { 3: 4, 4: 10, 5: 20 }
    },
    suo5: {
      id: 'suo5',
      name: '5 Bambu (五索)',
      voxCue: 'voxPayout5tiao',
      sprite: 'l_bamboo_5.png',
      blurSprite: 'l_bamboo_5_blur.png',
      pays: { 3: 4, 4: 10, 5: 20 }
    },
    tong2: {
      id: 'tong2',
      name: '2 Lingkaran (二筒)',
      voxCue: 'voxPayout2tong',
      sprite: 'l_ball_2.png',
      blurSprite: 'l_ball_2_blur.png',
      pays: { 3: 2, 4: 5, 5: 10 }
    },
    suo2: {
      id: 'suo2',
      name: '2 Bambu (二索)',
      voxCue: 'voxPayout2tiao',
      sprite: 'l_bamboo_2.png',
      blurSprite: 'l_bamboo_2_blur.png',
      pays: { 3: 2, 4: 5, 5: 10 }
    }
  };

  // Render authentic PG Soft layered sprite HTML for a cell:
  // - Regular tile: symbol_base_white.png + glyph sprite
  // - Gold-plated tile: symbol_base_gold.png + glyph sprite + symbol_base_gold_ingot.png emblem at bottom center
  // - Wild tile: symbol_base_ingot.png + s_wild.png
  // - Scatter tile: scatter_bg.png + s_scatter.png
  function renderTileHTML(cellData, isBlurred = false) {
    const sym = SYMBOLS[cellData.type] || SYMBOLS.fa;

    if (cellData.type === 'wild') {
      if (isBlurred) {
        return `
          <div class="pg-tile pg-tile-wild is-blurred">
            <img class="tile-layer base-ingot" src="${SPRITE_DIR}symbol_base_ingot_blur.png" alt="" draggable="false" />
            <img class="tile-layer sym-wild" src="${SPRITE_DIR}s_wild_blur.png" alt="WILD" draggable="false" />
          </div>`;
      }
      return `
        <div class="pg-tile pg-tile-wild">
          <img class="tile-layer base-ingot" src="${SPRITE_DIR}symbol_base_ingot.png" alt="" draggable="false" />
          <img class="tile-layer sym-wild" src="${SPRITE_DIR}s_wild.png" alt="WILD" draggable="false" />
        </div>`;
    }

    if (cellData.type === 'scatter') {
      if (isBlurred) {
        return `
          <div class="pg-tile pg-tile-scatter is-blurred">
            <img class="tile-layer sym-scatter" src="${SPRITE_DIR}s_scatter_blur.png" alt="SCATTER" draggable="false" />
          </div>`;
      }
      return `
        <div class="pg-tile pg-tile-scatter">
          <img class="tile-layer scatter-bg-glow" src="${SPRITE_DIR}scatter_bg.png" alt="" draggable="false" />
          <img class="tile-layer sym-scatter" src="${SPRITE_DIR}s_scatter.png" alt="SCATTER" draggable="false" />
        </div>`;
    }

    const isGold = !!cellData.gold;
    if (isBlurred) {
      const baseBlur = isGold ? 'symbol_base_gold_blur.png' : 'symbol_base_white_blur.png';
      return `
        <div class="pg-tile ${isGold ? 'pg-tile-gold' : 'pg-tile-white'} is-blurred">
          <img class="tile-layer tile-base" src="${SPRITE_DIR}${baseBlur}" alt="" draggable="false" />
          <img class="tile-layer tile-glyph" src="${SPRITE_DIR}${sym.blurSprite}" alt="${sym.name}" draggable="false" />
        </div>`;
    }

    const baseImg = isGold ? 'symbol_base_gold.png' : 'symbol_base_white.png';
    const goldBadge = isGold
      ? `<img class="tile-layer gold-ingot-badge" src="${SPRITE_DIR}symbol_base_gold_ingot.png" alt="" draggable="false" />`
      : '';

    return `
      <div class="pg-tile ${isGold ? 'pg-tile-gold' : 'pg-tile-white'}">
        <img class="tile-layer tile-base" src="${SPRITE_DIR}${baseImg}" alt="" draggable="false" />
        <img class="tile-layer tile-glyph" src="${SPRITE_DIR}${sym.sprite}" alt="${sym.name}" draggable="false" />
        ${goldBadge}
      </div>`;
  }

  const REGULAR_KEYS = ['fa', 'zhong', 'bai', 'wan8', 'tong5', 'suo5', 'tong2', 'suo2'];
  const WEIGHTED_POOL = [
    'fa', 'fa',
    'zhong', 'zhong', 'zhong',
    'bai', 'bai', 'bai', 'bai',
    'wan8', 'wan8', 'wan8', 'wan8', 'wan8',
    'tong5', 'tong5', 'tong5', 'tong5', 'tong5', 'tong5',
    'suo5', 'suo5', 'suo5', 'suo5', 'suo5', 'suo5',
    'tong2', 'tong2', 'tong2', 'tong2', 'tong2', 'tong2', 'tong2',
    'suo2', 'suo2', 'suo2', 'suo2', 'suo2', 'suo2', 'suo2'
  ];

  window.MahjongTiles = {
    SPRITE_DIR,
    SYMBOLS,
    REGULAR_KEYS,
    WEIGHTED_POOL,
    renderTileHTML
  };
})();

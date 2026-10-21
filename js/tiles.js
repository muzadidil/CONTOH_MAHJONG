// Authentic Mahjong Ways (1) PG Soft Tile Definitions, Paytable & Vector Art
(function () {
  const SYMBOLS = {
    wild: {
      id: 'wild',
      name: 'Wild (Ingot Emas)',
      pays: { 3: 0, 4: 0, 5: 0 },
      svg: () => `
        <svg viewBox="0 0 100 120" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="ingotG" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stop-color="#fff8b0"/>
              <stop offset="50%" stop-color="#f7b519"/>
              <stop offset="100%" stop-color="#9e5a00"/>
            </linearGradient>
          </defs>
          <!-- Glowing Red-Gold Frame -->
          <rect x="6" y="6" width="88" height="108" rx="10" fill="none" stroke="#ffd54f" stroke-width="3"/>
          <!-- Gold Sycee / Ingot Boat -->
          <ellipse cx="50" cy="46" rx="22" ry="12" fill="#fff3a1" stroke="#b36b00" stroke-width="2"/>
          <path d="M14 44 Q50 66 86 44 L74 78 Q50 90 26 78 Z" fill="url(#ingotG)" stroke="#fff199" stroke-width="2"/>
          <text x="50" y="68" text-anchor="middle" fill="#6b0509" font-family="'Noto Serif SC', serif" font-weight="900" font-size="22">百搭</text>
          <rect x="14" y="86" width="72" height="20" rx="6" fill="#b7091c" stroke="#ffd54f" stroke-width="1.8"/>
          <text x="50" y="100" text-anchor="middle" fill="#fff8c4" font-family="Nunito, sans-serif" font-weight="900" font-size="13" letter-spacing="1">WILD</text>
        </svg>`
    },

    scatter: {
      id: 'scatter',
      name: 'Scatter (胡)',
      pays: { 3: 0, 4: 0, 5: 0 },
      svg: () => `
        <svg viewBox="0 0 100 120" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="huGold" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stop-color="#ffffff"/>
              <stop offset="35%" stop-color="#ffe57f"/>
              <stop offset="100%" stop-color="#d48200"/>
            </linearGradient>
          </defs>
          <circle cx="50" cy="52" r="38" fill="#8f0711" stroke="#ffd54f" stroke-width="3"/>
          <text x="50" y="70" text-anchor="middle" fill="url(#huGold)" stroke="#3d0104" stroke-width="1.5" font-family="'Noto Serif SC', serif" font-weight="900" font-size="54">胡</text>
          <rect x="8" y="88" width="84" height="22" rx="7" fill="url(#huGold)" stroke="#5c0005" stroke-width="1.8"/>
          <text x="50" y="103" text-anchor="middle" fill="#5c0005" font-family="Nunito, sans-serif" font-weight="900" font-size="13" letter-spacing="0.8">SCATTER</text>
        </svg>`
    },

    fa: {
      id: 'fa',
      name: 'Naga Hijau (發)',
      pays: { 3: 15, 4: 60, 5: 100 },
      svg: () => `
        <svg viewBox="0 0 100 120" xmlns="http://www.w3.org/2000/svg">
          <rect x="8" y="8" width="84" height="104" rx="8" fill="none" stroke="rgba(16,110,69,0.22)" stroke-width="2"/>
          <text x="50" y="84" text-anchor="middle" fill="#0d8a47" stroke="#054d26" stroke-width="1.5" font-family="'Noto Serif SC', serif" font-weight="900" font-size="68">發</text>
        </svg>`
    },

    zhong: {
      id: 'zhong',
      name: 'Naga Merah (中)',
      pays: { 3: 10, 4: 40, 5: 80 },
      svg: () => `
        <svg viewBox="0 0 100 120" xmlns="http://www.w3.org/2000/svg">
          <rect x="8" y="8" width="84" height="104" rx="8" fill="none" stroke="rgba(196,20,32,0.22)" stroke-width="2"/>
          <text x="50" y="84" text-anchor="middle" fill="#c91622" stroke="#6e070e" stroke-width="1.5" font-family="'Noto Serif SC', serif" font-weight="900" font-size="68">中</text>
        </svg>`
    },

    bai: {
      id: 'bai',
      name: 'Papan Putih (白板)',
      pays: { 3: 8, 4: 20, 5: 60 },
      svg: () => `
        <svg viewBox="0 0 100 120" xmlns="http://www.w3.org/2000/svg">
          <rect x="16" y="16" width="68" height="88" rx="6" fill="none" stroke="#18479e" stroke-width="5"/>
          <rect x="23" y="23" width="54" height="74" rx="3" fill="none" stroke="#18479e" stroke-width="2" stroke-dasharray="6,3"/>
          <circle cx="24" cy="24" r="3.5" fill="#18479e"/>
          <circle cx="76" cy="24" r="3.5" fill="#18479e"/>
          <circle cx="24" cy="96" r="3.5" fill="#18479e"/>
          <circle cx="76" cy="96" r="3.5" fill="#18479e"/>
        </svg>`
    },

    wan8: {
      id: 'wan8',
      name: '8 Karakter (八萬)',
      pays: { 3: 6, 4: 15, 5: 40 },
      svg: () => `
        <svg viewBox="0 0 100 120" xmlns="http://www.w3.org/2000/svg">
          <text x="50" y="50" text-anchor="middle" fill="#17469e" stroke="#0c2659" stroke-width="1" font-family="'Noto Serif SC', serif" font-weight="900" font-size="42">八</text>
          <text x="50" y="98" text-anchor="middle" fill="#c91622" stroke="#6e070e" stroke-width="1.2" font-family="'Noto Serif SC', serif" font-weight="900" font-size="46">萬</text>
        </svg>`
    },

    tong5: {
      id: 'tong5',
      name: '5 Lingkaran (五筒)',
      pays: { 3: 4, 4: 10, 5: 20 },
      svg: () => {
        const dot = (cx, cy, c1, c2) => `
          <circle cx="${cx}" cy="${cy}" r="13.5" fill="${c1}" stroke="#1a1a1a" stroke-width="1.2"/>
          <circle cx="${cx}" cy="${cy}" r="8" fill="none" stroke="#ffffff" stroke-width="1.6" stroke-dasharray="3,2"/>
          <circle cx="${cx}" cy="${cy}" r="3.8" fill="${c2}"/>`;
        return `
        <svg viewBox="0 0 100 120" xmlns="http://www.w3.org/2000/svg">
          ${dot(28, 30, '#17469e', '#ffffff')}
          ${dot(72, 30, '#0d8a47', '#ffffff')}
          ${dot(50, 60, '#c91622', '#ffd54f')}
          ${dot(28, 90, '#0d8a47', '#ffffff')}
          ${dot(72, 90, '#17469e', '#ffffff')}
        </svg>`;
      }
    },

    suo5: {
      id: 'suo5',
      name: '5 Bambu (五索)',
      pays: { 3: 4, 4: 10, 5: 20 },
      svg: () => {
        const bamboo = (x, y, color) => `
          <g transform="translate(${x},${y})">
            <rect x="-4.5" y="-17" width="9" height="14" rx="4" fill="${color}"/>
            <rect x="-4.5" y="1" width="9" height="14" rx="4" fill="${color}"/>
            <rect x="-6" y="-2" width="12" height="4" rx="1.5" fill="#ffffff" stroke="${color}" stroke-width="1"/>
          </g>`;
        return `
        <svg viewBox="0 0 100 120" xmlns="http://www.w3.org/2000/svg">
          ${bamboo(26, 32, '#0d8a47')}
          ${bamboo(74, 32, '#0d8a47')}
          ${bamboo(50, 60, '#c91622')}
          ${bamboo(26, 88, '#0d8a47')}
          ${bamboo(74, 88, '#0d8a47')}
        </svg>`;
      }
    },

    tong2: {
      id: 'tong2',
      name: '2 Lingkaran (二筒)',
      pays: { 3: 2, 4: 5, 5: 10 },
      svg: () => `
        <svg viewBox="0 0 100 120" xmlns="http://www.w3.org/2000/svg">
          <circle cx="50" cy="36" r="19" fill="#0d8a47" stroke="#064523" stroke-width="1.5"/>
          <circle cx="50" cy="36" r="11" fill="none" stroke="#ffffff" stroke-width="2" stroke-dasharray="4,2"/>
          <circle cx="50" cy="36" r="5" fill="#c91622"/>
          <circle cx="50" cy="84" r="19" fill="#17469e" stroke="#0b2352" stroke-width="1.5"/>
          <circle cx="50" cy="84" r="11" fill="none" stroke="#ffffff" stroke-width="2" stroke-dasharray="4,2"/>
          <circle cx="50" cy="84" r="5" fill="#c91622"/>
        </svg>`
    },

    suo2: {
      id: 'suo2',
      name: '2 Bambu (二索)',
      pays: { 3: 2, 4: 5, 5: 10 },
      svg: () => `
        <svg viewBox="0 0 100 120" xmlns="http://www.w3.org/2000/svg">
          <g transform="translate(50,35)">
            <rect x="-6" y="-20" width="12" height="17" rx="5" fill="#0d8a47"/>
            <rect x="-6" y="1" width="12" height="17" rx="5" fill="#0d8a47"/>
            <rect x="-8" y="-3" width="16" height="5" rx="2" fill="#ffffff" stroke="#0d8a47" stroke-width="1.2"/>
          </g>
          <g transform="translate(50,85)">
            <rect x="-6" y="-20" width="12" height="17" rx="5" fill="#0d8a47"/>
            <rect x="-6" y="1" width="12" height="17" rx="5" fill="#0d8a47"/>
            <rect x="-8" y="-3" width="16" height="5" rx="2" fill="#ffffff" stroke="#0d8a47" stroke-width="1.2"/>
          </g>
        </svg>`
    }
  };

  // Weighted pool for spinning reels
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
    SYMBOLS,
    REGULAR_KEYS,
    WEIGHTED_POOL
  };
})();

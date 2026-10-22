// Original, hand-built SVG illustrations for each product type.

function Shirt({ c1, c2, pocket, check, mandarin }) {
  return (
    <g>
      {check && (
        <defs>
          <pattern id={`chk-${c1.slice(1)}`} width="14" height="14" patternUnits="userSpaceOnUse">
            <rect width="14" height="14" fill={c1} />
            <path d="M0 7H14M7 0V14" stroke={c2} strokeWidth="1.6" opacity="0.55" />
          </pattern>
        </defs>
      )}
      <path
        d="M70 38 L52 44 L24 64 L36 96 L54 88 L54 168 Q100 176 146 168 L146 88 L164 96 L176 64 L148 44 L130 38 Q100 58 70 38 Z"
        fill={check ? `url(#chk-${c1.slice(1)})` : c1}
        stroke="rgba(0,0,0,.18)" strokeWidth="1.5" strokeLinejoin="round"
      />
      {mandarin ? (
        <path d="M76 38 Q100 50 124 38 L124 46 Q100 58 76 46 Z" fill={c2} />
      ) : (
        <>
          <path d="M70 38 L84 64 L100 50 Z" fill={c2} opacity="0.9" />
          <path d="M130 38 L116 64 L100 50 Z" fill={c2} opacity="0.9" />
        </>
      )}
      <line x1="100" y1="52" x2="100" y2="170" stroke="rgba(0,0,0,.18)" strokeWidth="1.5" />
      {[72, 94, 116, 138, 158].map((y) => (
        <circle key={y} cx="105" cy={y} r="2.4" fill={c2} stroke="rgba(0,0,0,.25)" strokeWidth=".6" />
      ))}
      {pocket && (
        <>
          <rect x="62" y="78" width="26" height="28" rx="3" fill={c2} opacity=".55" />
          <rect x="112" y="78" width="26" height="28" rx="3" fill={c2} opacity=".55" />
        </>
      )}
    </g>
  );
}

function Watch({ c1, c2, strap, bezel, digital, smart, mesh }) {
  const round = !digital && !smart;
  return (
    <g>
      {mesh && (
        <defs>
          <pattern id="mesh" width="4" height="4" patternUnits="userSpaceOnUse">
            <rect width="4" height="4" fill={strap} />
            <circle cx="2" cy="2" r=".9" fill="rgba(255,255,255,.25)" />
          </pattern>
        </defs>
      )}
      <rect x="78" y="14" width="44" height="58" rx="8" fill={mesh ? 'url(#mesh)' : strap} />
      <rect x="78" y="128" width="44" height="58" rx="8" fill={mesh ? 'url(#mesh)' : strap} />
      {!mesh && [26, 40, 54, 140, 154, 168].map((y) => (
        <line key={y} x1="82" x2="118" y1={y} y2={y} stroke="rgba(0,0,0,.18)" strokeWidth="2" />
      ))}
      {round ? (
        <>
          <circle cx="100" cy="100" r="46" fill={c1} stroke="rgba(0,0,0,.25)" strokeWidth="1.5" />
          {bezel && <circle cx="100" cy="100" r="41" fill={bezel} />}
          <circle cx="100" cy="100" r={bezel ? 34 : 39} fill={c2} />
          {Array.from({ length: 12 }).map((_, i) => {
            const a = (i * Math.PI) / 6;
            const r1 = bezel ? 29 : 33, r2 = bezel ? 33 : 37;
            return <line key={i} x1={100 + r1 * Math.sin(a)} y1={100 - r1 * Math.cos(a)} x2={100 + r2 * Math.sin(a)} y2={100 - r2 * Math.cos(a)} stroke={c1} strokeWidth={i % 3 === 0 ? 3 : 1.5} />;
          })}
          <line x1="100" y1="100" x2="100" y2="76" stroke={c1} strokeWidth="3.5" strokeLinecap="round" />
          <line x1="100" y1="100" x2="118" y2="110" stroke={c1} strokeWidth="2.5" strokeLinecap="round" />
          <circle cx="100" cy="100" r="3" fill={c1} />
          <rect x="145" y="94" width="8" height="12" rx="2" fill={c1} />
        </>
      ) : (
        <>
          <rect x="58" y="58" width="84" height="84" rx={smart ? 22 : 12} fill={c1} stroke="rgba(0,0,0,.3)" strokeWidth="1.5" />
          <rect x="66" y="66" width="68" height="68" rx={smart ? 16 : 6} fill={c2} />
          {digital ? (
            <text x="100" y="108" textAnchor="middle" fontFamily="monospace" fontSize="22" fill="#7cf0b4">10:08</text>
          ) : (
            <>
              <text x="100" y="98" textAnchor="middle" fontFamily="Arial" fontSize="18" fontWeight="bold" fill="#fff">10:08</text>
              <path d="M78 116 h8 l4 -8 l5 14 l4 -10 l3 4 h20" stroke="#ff6b81" strokeWidth="2" fill="none" />
            </>
          )}
          <rect x="141" y="92" width="6" height="16" rx="2" fill={c1} />
        </>
      )}
    </g>
  );
}

function Lipstick({ c1, c2 }) {
  return (
    <g>
      <rect x="40" y="110" width="44" height="70" rx="4" fill="#1e1b24" />
      <rect x="40" y="100" width="44" height="14" fill={c2} />
      <path d="M48 100 V62 L76 48 V100 Z" fill={c1} />
      <rect x="112" y="80" width="44" height="100" rx="4" fill="#1e1b24" />
      <rect x="112" y="80" width="44" height="12" fill={c2} />
    </g>
  );
}

function Serum({ c1, c2 }) {
  return (
    <g>
      <rect x="84" y="20" width="32" height="34" rx="14" fill="#2b2b33" />
      <rect x="86" y="50" width="28" height="12" fill={c2} stroke="#333" strokeWidth="1" />
      <rect x="62" y="60" width="76" height="120" rx="14" fill={c1} opacity=".9" />
      <rect x="70" y="96" width="60" height="44" rx="4" fill={c2} />
      <text x="100" y="116" textAnchor="middle" fontFamily="Arial" fontSize="11" fontWeight="bold" fill="#7a4a10">VIT C</text>
      <text x="100" y="131" textAnchor="middle" fontFamily="Arial" fontSize="8" fill="#7a4a10">SERUM 30ml</text>
      <rect x="70" y="66" width="8" height="100" rx="4" fill="#fff" opacity=".35" />
    </g>
  );
}

function Palette({ c1, shades }) {
  return (
    <g>
      <rect x="26" y="50" width="148" height="100" rx="12" fill={c1} />
      <rect x="26" y="50" width="148" height="100" rx="12" fill="none" stroke="#c9a24a" strokeWidth="2" />
      {shades.map((s, i) => (
        <circle key={i} cx={56 + (i % 3) * 44} cy={i < 3 ? 80 : 120} r="16" fill={s} stroke="rgba(0,0,0,.2)" />
      ))}
    </g>
  );
}

function Compact({ c1, c2 }) {
  return (
    <g>
      <ellipse cx="100" cy="128" rx="66" ry="22" fill="#2b2023" />
      <ellipse cx="100" cy="118" rx="66" ry="22" fill="#3a2d31" />
      <ellipse cx="100" cy="116" rx="54" ry="16" fill={c1} />
      <ellipse cx="88" cy="112" rx="18" ry="5" fill={c2} opacity=".6" />
      <path d="M34 112 Q34 40 100 40 Q166 40 166 112" fill="none" stroke="#3a2d31" strokeWidth="10" />
    </g>
  );
}

function Tube({ c1, c2 }) {
  return (
    <g>
      <path d="M64 30 H136 L128 150 H72 Z" fill={c2} stroke="rgba(0,0,0,.15)" />
      <rect x="64" y="22" width="72" height="12" rx="2" fill={c1} />
      <rect x="76" y="148" width="48" height="32" rx="6" fill={c1} />
      <circle cx="100" cy="78" r="14" fill={c1} opacity=".8" />
      <text x="100" y="112" textAnchor="middle" fontFamily="Arial" fontSize="10" fontWeight="bold" fill="#2f6f61">FOAMING</text>
      <text x="100" y="124" textAnchor="middle" fontFamily="Arial" fontSize="8" fill="#2f6f61">CLEANSER</text>
    </g>
  );
}

function Gloss({ c1, c2 }) {
  return (
    <g>
      <rect x="84" y="20" width="32" height="60" rx="6" fill="#d8b56a" />
      <rect x="80" y="78" width="40" height="104" rx="18" fill={c1} />
      <rect x="88" y="86" width="8" height="86" rx="4" fill={c2} opacity=".5" />
    </g>
  );
}

function Perfume({ c1, c2, shape }) {
  if (shape === 'attar') {
    return (
      <g>
        <rect x="88" y="34" width="24" height="30" rx="4" fill={c2} />
        <path d="M100 64 C60 80 62 168 100 176 C138 168 140 80 100 64 Z" fill={c1} stroke={c2} strokeWidth="3" />
        <path d="M100 92 l10 14 -10 14 -10 -14 Z" fill={c2} />
      </g>
    );
  }
  if (shape === 'mist') {
    return (
      <g>
        <rect x="86" y="18" width="28" height="18" rx="3" fill="#ddd" />
        <rect x="90" y="34" width="20" height="12" fill="#bbb" />
        <rect x="70" y="44" width="60" height="140" rx="12" fill={c1} opacity=".85" />
        <rect x="78" y="90" width="44" height="40" rx="4" fill={c2} />
        <text x="100" y="114" textAnchor="middle" fontFamily="Arial" fontSize="10" fontWeight="bold" fill="#1f6c7a">BODY MIST</text>
      </g>
    );
  }
  const body = {
    round: <circle cx="100" cy="122" r="56" fill={c1} />,
    tall: <rect x="70" y="60" width="60" height="124" rx="6" fill={c1} />,
    square: <rect x="48" y="72" width="104" height="104" rx="10" fill={c1} />,
  }[shape || 'round'];
  return (
    <g>
      <rect x="82" y="22" width="36" height="34" rx="4" fill={c2} />
      <rect x="90" y="52" width="20" height="14" fill="#c9a24a" />
      {body}
      <rect x="74" y="106" width="52" height="30" rx="3" fill="#fff" opacity=".88" />
      <text x="100" y="119" textAnchor="middle" fontFamily="Georgia, serif" fontSize="8" letterSpacing="1" fill="#333">EAU DE</text>
      <text x="100" y="130" textAnchor="middle" fontFamily="Georgia, serif" fontSize="8" letterSpacing="1" fill="#333">PARFUM</text>
      <path d="M66 86 q6 -10 14 -12" stroke="#fff" strokeWidth="4" opacity=".4" fill="none" strokeLinecap="round" />
    </g>
  );
}

const MAP = { shirt: Shirt, watch: Watch, lipstick: Lipstick, serum: Serum, palette: Palette, compact: Compact, tube: Tube, gloss: Gloss, perfume: Perfume };

export default function ProductArt({ art, label, className = '' }) {
  const a = typeof art === 'string' ? JSON.parse(art) : art || {};
  const Comp = MAP[a.kind] || Shirt;
  return (
    <svg viewBox="0 0 200 200" role="img" aria-label={label} className={`art ${className}`}>
      <Comp {...a} />
    </svg>
  );
}

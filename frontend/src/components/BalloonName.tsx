/**
 * BalloonName — renders a string as metallic purple balloon letters.
 * Uses the /balloon-alphabet.jpeg sprite sheet (1024×1024, 3 rows × 9 cols).
 *
 * Row 0: A–I (9 letters, cols 0–8)
 * Row 1: J–R (9 letters, cols 0–8)
 * Row 2: S–Z (8 letters, cols 0–7)
 *
 * Each cell: 1024/9 ≈ 113.78px wide, 1024/3 ≈ 341.33px tall.
 * Row 2 has 8 letters so cell width = 1024/8 = 128px.
 */

const IMG_W = 1024;
const IMG_H = 1024;
const ROWS = 3;
const COLS_01 = 9;
const COLS_2 = 8;
const CELL_W_01 = IMG_W / COLS_01;   // ~113.78
const CELL_W_2  = IMG_W / COLS_2;    // 128
const CELL_H    = IMG_H / ROWS;      // ~341.33

interface LetterPos { col: number; row: number }

const LETTER_MAP: Record<string, LetterPos> = {
  A: { col: 0, row: 0 }, B: { col: 1, row: 0 }, C: { col: 2, row: 0 },
  D: { col: 3, row: 0 }, E: { col: 4, row: 0 }, F: { col: 5, row: 0 },
  G: { col: 6, row: 0 }, H: { col: 7, row: 0 }, I: { col: 8, row: 0 },
  J: { col: 0, row: 1 }, K: { col: 1, row: 1 }, L: { col: 2, row: 1 },
  M: { col: 3, row: 1 }, N: { col: 4, row: 1 }, O: { col: 5, row: 1 },
  P: { col: 6, row: 1 }, Q: { col: 7, row: 1 }, R: { col: 8, row: 1 },
  S: { col: 0, row: 2 }, T: { col: 1, row: 2 }, U: { col: 2, row: 2 },
  V: { col: 3, row: 2 }, W: { col: 4, row: 2 }, X: { col: 5, row: 2 },
  Y: { col: 6, row: 2 }, Z: { col: 7, row: 2 },
};

interface BalloonNameProps {
  name: string;
  /** Pixel height of each letter balloon. Width auto-scales. Default: 48 */
  letterHeight?: number;
  className?: string;
}

function BalloonLetter({ letter, height }: { letter: string; height: number }) {
  const pos = LETTER_MAP[letter.toUpperCase()];

  if (!pos) {
    // Space or unknown character → gap
    return <span style={{ display: "inline-block", width: height * 0.4 }} aria-hidden="true" />;
  }

  const cellW = pos.row < 2 ? CELL_W_01 : CELL_W_2;
  const scale = height / CELL_H;
  const displayW = Math.round(cellW * scale);

  const bgW = Math.round(IMG_W * scale);
  const bgH = Math.round(IMG_H * scale);
  const bgX = -Math.round(pos.col * cellW * scale);
  const bgY = -Math.round(pos.row * CELL_H * scale);

  return (
    <span
      aria-hidden="true"
      style={{
        display: "inline-block",
        width: displayW,
        height,
        backgroundImage: "url(/balloon-alphabet.jpeg)",
        backgroundSize: `${bgW}px ${bgH}px`,
        backgroundPosition: `${bgX}px ${bgY}px`,
        backgroundRepeat: "no-repeat",
        flexShrink: 0,
      }}
    />
  );
}

export function BalloonName({ name, letterHeight = 48, className = "" }: BalloonNameProps) {
  return (
    <span
      role="img"
      aria-label={name}
      className={`inline-flex items-end flex-wrap gap-0.5 ${className}`}
    >
      {name.split("").map((char, i) => (
        <BalloonLetter key={i} letter={char} height={letterHeight} />
      ))}
    </span>
  );
}

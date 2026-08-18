import React from 'react';

interface QRCodeDisplayProps {
  value: string;
  size?: number;
  label?: string;
  className?: string;
}

export const QRCodeDisplay: React.FC<QRCodeDisplayProps> = ({
  value,
  size = 96,
  label,
  className = "",
}) => {
  // Generate a clean stylized SVG matrix based on data string hash
  const hash = Math.abs(
    value.split('').reduce((acc, char) => ((acc << 5) - acc) + char.charCodeAt(0), 0)
  );

  const gridSize = 17;
  const cells: boolean[][] = [];

  for (let r = 0; r < gridSize; r++) {
    const row: boolean[] = [];
    for (let c = 0; c < gridSize; c++) {
      // Corner finder patterns (top-left, top-right, bottom-left)
      const isTopLeft = r < 5 && c < 5;
      const isTopRight = r < 5 && c >= gridSize - 5;
      const isBottomLeft = r >= gridSize - 5 && c < 5;

      if (isTopLeft || isTopRight || isBottomLeft) {
        const localR = isBottomLeft ? r - (gridSize - 5) : r;
        const localC = isTopRight ? c - (gridSize - 5) : c;
        if (localR === 0 || localR === 4 || localC === 0 || localC === 4 || (localR === 2 && localC === 2)) {
          row.push(true);
        } else {
          row.push(false);
        }
      } else {
        // Deterministic pseudo-random pattern based on string hash
        const val = (hash * (r * 31 + c * 17) + r * 13 + c) % 100;
        row.push(val > 45);
      }
    }
    cells.push(row);
  }

  const cellSize = size / gridSize;

  return (
    <div className={`flex flex-col items-center justify-center ${className}`}>
      <div 
        className="bg-white dark:bg-slate-900 p-1.5 rounded-lg border border-neutral-200 dark:border-slate-800 shadow-xs inline-block"
        style={{ width: size + 12, height: size + 12 }}
      >
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          {cells.map((row, r) =>
            row.map((active, c) =>
              active ? (
                <rect
                  key={`${r}-${c}`}
                  x={c * cellSize}
                  y={r * cellSize}
                  width={cellSize * 0.92}
                  height={cellSize * 0.92}
                  rx={cellSize * 0.15}
                  className="fill-slate-800 dark:fill-slate-100"
                />
              ) : null
            )
          )}
        </svg>
      </div>
      {label && <span className="text-[10px] text-neutral-500 dark:text-slate-400 font-mono mt-1">{label}</span>}
    </div>
  );
};

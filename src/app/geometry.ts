export const DISTRICT_COORDS: Record<string, { x: number; y: number }> = {
  Canggu: { x: 190, y: 240 },
  Ubud: { x: 260, y: 160 },
  Seminyak: { x: 180, y: 280 },
  Uluwatu: { x: 120, y: 380 },
  Sanur: { x: 290, y: 290 },
  'Nusa Dua': { x: 280, y: 390 },
  Kuta: { x: 160, y: 320 },
  Jimbaran: { x: 170, y: 350 },
  Amed: { x: 420, y: 80 },
  Lovina: { x: 210, y: 60 }
};

export const isPointInPolygon = (
  point: { x: number; y: number },
  polygon: { x: number; y: number }[]
) => {
  let inside = false;
  const x = point.x;
  const y = point.y;

  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i].x;
    const yi = polygon[i].y;
    const xj = polygon[j].x;
    const yj = polygon[j].y;
    const intersect = ((yi > y) !== (yj > y))
      && (x < ((xj - xi) * (y - yi)) / (yj - yi) + xi);
    if (intersect) inside = !inside;
  }

  return inside;
};

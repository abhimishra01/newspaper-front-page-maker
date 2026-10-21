// A drawn sample picture (our own art), shown in the main photo box until the user adds a photo.
// It is a normal photo slot: it prints if kept, and Remove takes it out.
export function samplePicture() {
  const c = document.createElement('canvas');
  c.width = 1200; c.height = 860;
  const g = c.getContext('2d');
  const sky = g.createLinearGradient(0, 0, 0, 860);
  sky.addColorStop(0, '#8fc1ea'); sky.addColorStop(1, '#fbe3b8');
  g.fillStyle = sky; g.fillRect(0, 0, 1200, 860);
  // Bunting across the top.
  const cols = ['#e4572e', '#f3a712', '#29335c', '#669bbc', '#a8c686'];
  g.strokeStyle = '#5a4a3a'; g.lineWidth = 4;
  g.beginPath(); g.moveTo(0, 60); g.quadraticCurveTo(600, 190, 1200, 60); g.stroke();
  for (let i = 0; i < 13; i++) {
    const t = (i + 0.5) / 13, x = t * 1200, y = 60 + 130 * 4 * t * (1 - t) * 0.5 + 2;
    g.fillStyle = cols[i % cols.length];
    g.beginPath(); g.moveTo(x - 34, y); g.lineTo(x + 34, y); g.lineTo(x, y + 80); g.closePath(); g.fill();
  }
  // Balloons.
  [['#e4572e', 170, 300], ['#29335c', 1010, 260], ['#f3a712', 1090, 390], ['#669bbc', 260, 420]].forEach(([col, x, y]) => {
    g.strokeStyle = '#6b5b4b'; g.lineWidth = 3;
    g.beginPath(); g.moveTo(x, y + 88); g.bezierCurveTo(x + 30, y + 200, x - 30, y + 300, x + 10, y + 420); g.stroke();
    g.fillStyle = col; g.beginPath(); g.ellipse(x, y, 70, 88, 0, 0, Math.PI * 2); g.fill();
    g.fillStyle = 'rgba(255,255,255,.35)'; g.beginPath(); g.ellipse(x - 24, y - 30, 14, 24, -0.5, 0, Math.PI * 2); g.fill();
  });
  // Table and a gift box.
  g.fillStyle = '#8a5a35'; g.fillRect(300, 700, 600, 34);
  g.fillStyle = '#29335c'; g.fillRect(470, 500, 260, 200);
  g.fillStyle = '#f3a712'; g.fillRect(585, 500, 30, 200); g.fillRect(470, 585, 260, 30);
  g.fillStyle = '#e4572e';
  g.beginPath(); g.ellipse(565, 480, 50, 26, -0.4, 0, Math.PI * 2); g.fill();
  g.beginPath(); g.ellipse(635, 480, 50, 26, 0.4, 0, Math.PI * 2); g.fill();
  // Confetti.
  let s = 11;
  const r = () => { s = (s * 16807) % 2147483647; return s / 2147483647; };
  for (let i = 0; i < 140; i++) {
    g.fillStyle = cols[i % cols.length];
    g.save(); g.translate(r() * 1200, 150 + r() * 560); g.rotate(r() * 6.28); g.fillRect(-7, -3, 14, 6); g.restore();
  }
  g.fillStyle = '#7aa95c'; g.fillRect(0, 734, 1200, 126);
  return { canvas: c, w: c.width, h: c.height, zoom: 1, fx: 0, fy: 0, name: 'Sample picture', sample: true };
}

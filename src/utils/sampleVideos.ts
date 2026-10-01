/**
 * Built-in Canvas Procedural Animation Generators
 * Provides instantly playable video/animation streams for NES ROM conversion
 */

export interface SampleVideoOption {
  id: string;
  name: string;
  category: string;
  durationFrames: number;
  fps: number;
  description: string;
  renderFrame: (ctx: CanvasRenderingContext2D, width: number, height: number, frame: number, totalFrames: number) => void;
}

export const SAMPLE_VIDEOS: SampleVideoOption[] = [
  {
    id: 'silhouette_bad_apple',
    name: 'Shadow Dancer (Bad Apple Style)',
    category: 'High Contrast Animation',
    durationFrames: 60,
    fps: 15,
    description: 'Iconic monochrome flowing silhouette animation with fluid limbs and floating petals',
    renderFrame: (ctx, width, height, frame, total) => {
      const progress = frame / total;
      const angle = progress * Math.PI * 2;
      const cx = width / 2;
      const cy = height / 2 + 10;

      // Background
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, width, height);

      // Black silhouette figure
      ctx.fillStyle = '#000000';

      // Floating petals / leaves
      for (let i = 0; i < 18; i++) {
        const pSpeed = (i % 3 + 1) * 0.8;
        const pX = (cx + Math.sin(angle * pSpeed + i * 1.5) * 110 + (i * 20)) % width;
        const pY = (cy + Math.cos(angle * 1.2 + i * 0.9) * 80 + frame * 3 + i * 15) % height;
        const pSize = 3 + (i % 4);
        ctx.beginPath();
        ctx.ellipse(pX, pY, pSize * 2, pSize, angle + i, 0, Math.PI * 2);
        ctx.fill();
      }

      // Dancing silhouette torso & dress
      ctx.beginPath();
      // Head
      const headBobY = Math.sin(angle * 2) * 5;
      const headBobX = Math.cos(angle) * 8;
      ctx.arc(cx + headBobX, cy - 50 + headBobY, 16, 0, Math.PI * 2);
      ctx.fill();

      // Flowing hair ribbon
      ctx.beginPath();
      ctx.moveTo(cx + headBobX - 10, cy - 50 + headBobY);
      ctx.quadraticCurveTo(
        cx + headBobX - 35 + Math.sin(angle * 3) * 15,
        cy - 60 + Math.cos(angle * 2) * 10,
        cx + headBobX - 55,
        cy - 40 + Math.sin(angle * 2) * 20
      );
      ctx.lineWidth = 6;
      ctx.strokeStyle = '#000000';
      ctx.stroke();

      // Body dress
      ctx.beginPath();
      ctx.moveTo(cx + headBobX - 10, cy - 34 + headBobY);
      ctx.lineTo(cx + headBobX + 10, cy - 34 + headBobY);

      // Swirling skirt
      const skirtSway1 = Math.sin(angle) * 35;
      const skirtSway2 = Math.cos(angle) * 30;
      ctx.bezierCurveTo(
        cx + 25 + skirtSway1, cy + 10,
        cx + 50 + skirtSway2, cy + 50,
        cx + 60 + skirtSway1 * 0.5, cy + 65
      );
      ctx.lineTo(cx - 60 + skirtSway2 * 0.5, cy + 65);
      ctx.bezierCurveTo(
        cx - 50 + skirtSway1, cy + 50,
        cx - 25 + skirtSway2, cy + 10,
        cx + headBobX - 10, cy - 34 + headBobY
      );
      ctx.fill();

      // Dancing arms
      const arm1X = cx + headBobX + Math.cos(angle * 2) * 40;
      const arm1Y = cy - 30 + Math.sin(angle * 2) * 30;
      ctx.beginPath();
      ctx.moveTo(cx + headBobX + 8, cy - 30 + headBobY);
      ctx.lineTo(arm1X, arm1Y);
      ctx.lineWidth = 5;
      ctx.stroke();

      const arm2X = cx + headBobX - Math.sin(angle * 2) * 45;
      const arm2Y = cy - 30 - Math.cos(angle * 2) * 25;
      ctx.beginPath();
      ctx.moveTo(cx + headBobX - 8, cy - 30 + headBobY);
      ctx.lineTo(arm2X, arm2Y);
      ctx.lineWidth = 5;
      ctx.stroke();

      // Feet
      ctx.fillStyle = '#000000';
      ctx.fillRect(cx - 15 + Math.sin(angle) * 10, cy + 65, 8, 18);
      ctx.fillRect(cx + 8 - Math.sin(angle) * 10, cy + 65, 8, 18);
    },
  },
  {
    id: 'wireframe_cube_3d',
    name: '3D Demoscene Wireframe Cube',
    category: 'Vector & Math',
    durationFrames: 60,
    fps: 15,
    description: '3D rotating perspective wireframe cube with glowing vertices and coordinates',
    renderFrame: (ctx, width, height, frame, total) => {
      const progress = frame / total;
      const ax = progress * Math.PI * 2;
      const ay = progress * Math.PI * 4;
      const az = progress * Math.PI;

      // Dark background
      ctx.fillStyle = '#080808';
      ctx.fillRect(0, 0, width, height);

      // Grid background
      ctx.strokeStyle = '#1a1a2e';
      ctx.lineWidth = 1;
      for (let x = 0; x < width; x += 16) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }
      for (let y = 0; y < height; y += 16) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }

      // Cube vertices [-1, 1]
      const nodes = [
        [-1, -1, -1], [1, -1, -1], [1, 1, -1], [-1, 1, -1],
        [-1, -1, 1], [1, -1, 1], [1, 1, 1], [-1, 1, 1],
      ];

      const edges = [
        [0, 1], [1, 2], [2, 3], [3, 0],
        [4, 5], [5, 6], [6, 7], [7, 4],
        [0, 4], [1, 5], [2, 6], [3, 7],
      ];

      // Inner cube
      const innerNodes = nodes.map(([x, y, z]) => [x * 0.5, y * 0.5, z * 0.5]);

      const cx = width / 2;
      const cy = height / 2;
      const fov = 160;

      function project(node: number[], scale = 55): [number, number, number] {
        let [x, y, z] = node;
        x *= scale;
        y *= scale;
        z *= scale;

        // Rotate X
        let y1 = y * Math.cos(ax) - z * Math.sin(ax);
        let z1 = y * Math.sin(ax) + z * Math.cos(ax);

        // Rotate Y
        let x2 = x * Math.cos(ay) + z1 * Math.sin(ay);
        let z2 = -x * Math.sin(ay) + z1 * Math.cos(ay);

        // Rotate Z
        let x3 = x2 * Math.cos(az) - y1 * Math.sin(az);
        let y3 = x2 * Math.sin(az) + y1 * Math.cos(az);

        const distance = 140;
        const pz = z2 + distance;
        const px = cx + (x3 * fov) / pz;
        const py = cy + (y3 * fov) / pz;
        return [px, py, pz];
      }

      // Draw outer cube edges
      const projected = nodes.map((n) => project(n, 52));
      const projectedInner = innerNodes.map((n) => project(n, 52));

      ctx.lineWidth = 3;
      ctx.strokeStyle = '#40efb0';
      edges.forEach(([i, j]) => {
        ctx.beginPath();
        ctx.moveTo(projected[i][0], projected[i][1]);
        ctx.lineTo(projected[j][0], projected[j][1]);
        ctx.stroke();
      });

      // Draw inner edges
      ctx.lineWidth = 1.5;
      ctx.strokeStyle = '#ecab46';
      edges.forEach(([i, j]) => {
        ctx.beginPath();
        ctx.moveTo(projectedInner[i][0], projectedInner[i][1]);
        ctx.lineTo(projectedInner[j][0], projectedInner[j][1]);
        ctx.stroke();
      });

      // Connect inner and outer
      ctx.lineWidth = 1;
      ctx.strokeStyle = '#ffffff';
      for (let k = 0; k < 8; k++) {
        ctx.beginPath();
        ctx.moveTo(projected[k][0], projected[k][1]);
        ctx.lineTo(projectedInner[k][0], projectedInner[k][1]);
        ctx.stroke();
      }

      // Draw vertex markers
      projected.forEach(([px, py]) => {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(px - 3, py - 3, 6, 6);
      });
    },
  },
  {
    id: 'warp_starfield',
    name: '8-Bit Space Cruiser Warp',
    category: 'Retro Gaming',
    durationFrames: 60,
    fps: 15,
    description: 'Starfield warp drive with pixel spaceship and radar crosshairs',
    renderFrame: (ctx, width, height, frame, total) => {
      const progress = frame / total;
      const cx = width / 2;
      const cy = height / 2;

      // Deep space black
      ctx.fillStyle = '#000000';
      ctx.fillRect(0, 0, width, height);

      // Radial warp stars
      const numStars = 64;
      for (let i = 0; i < numStars; i++) {
        const starAngle = (i / numStars) * Math.PI * 2 + (i % 5) * 0.2;
        const speed = 1.2 + (i % 4) * 0.8;
        const dist = ((frame * speed * 4 + i * 25) % (width * 0.8)) + 10;

        const sx = cx + Math.cos(starAngle) * dist;
        const sy = cy + Math.sin(starAngle) * dist * 0.8;

        const tailLen = Math.min(24, dist * 0.18);
        const tx = sx - Math.cos(starAngle) * tailLen;
        const ty = sy - Math.sin(starAngle) * tailLen * 0.8;

        ctx.strokeStyle = i % 3 === 0 ? '#64b0ff' : '#ffffff';
        ctx.lineWidth = dist > 70 ? 2 : 1;
        ctx.beginPath();
        ctx.moveTo(tx, ty);
        ctx.lineTo(sx, sy);
        ctx.stroke();
      }

      // Space fighter ship at bottom-center
      const shipY = cy + 45 + Math.sin(progress * Math.PI * 4) * 4;
      const shipX = cx + Math.sin(progress * Math.PI * 2) * 20;

      // Engine glow
      ctx.fillStyle = (frame % 2 === 0) ? '#ff8e80' : '#ecab46';
      ctx.fillRect(shipX - 6, shipY + 22, 12, 14 + (frame % 4) * 3);

      // Ship body
      ctx.fillStyle = '#adadad';
      ctx.beginPath();
      ctx.moveTo(shipX, shipY - 24);
      ctx.lineTo(shipX + 22, shipY + 20);
      ctx.lineTo(shipX + 8, shipY + 16);
      ctx.lineTo(shipX - 8, shipY + 16);
      ctx.lineTo(shipX - 22, shipY + 20);
      ctx.closePath();
      ctx.fill();

      // Cockpit
      ctx.fillStyle = '#64b0ff';
      ctx.fillRect(shipX - 3, shipY - 6, 6, 12);

      // Targeting crosshair
      ctx.strokeStyle = '#349000';
      ctx.lineWidth = 1;
      const crossSize = 24;
      ctx.strokeRect(cx - crossSize / 2, cy - crossSize / 2, crossSize, crossSize);
      ctx.beginPath();
      ctx.moveTo(cx - crossSize, cy);
      ctx.lineTo(cx + crossSize, cy);
      ctx.moveTo(cx, cy - crossSize);
      ctx.lineTo(cx, cy + crossSize);
      ctx.stroke();
    },
  },
  {
    id: 'retro_arcade_fire',
    name: 'Arcade Bonfire & Embers',
    category: 'Procedural VFX',
    durationFrames: 60,
    fps: 15,
    description: 'Dynamic organic pixel fire simulation with rising embers and smoke',
    renderFrame: (ctx, width, height, frame, total) => {
      const cx = width / 2;
      const cy = height * 0.75;

      // Dark background
      ctx.fillStyle = '#050302';
      ctx.fillRect(0, 0, width, height);

      // Wood logs
      ctx.fillStyle = '#561d00';
      ctx.fillRect(cx - 50, cy + 18, 100, 14);
      ctx.fillStyle = '#985700';
      ctx.fillRect(cx - 45, cy + 22, 90, 4);

      // Fire layers from outer red to inner white
      const colors = ['#6c0600', '#b43915', '#ecab46', '#ffffff'];
      const numFlames = 9;

      for (let layer = 0; layer < 4; layer++) {
        ctx.fillStyle = colors[layer];
        const scale = 1 - layer * 0.22;
        const hScale = 1 - layer * 0.18;

        ctx.beginPath();
        ctx.moveTo(cx - 40 * scale, cy + 20);

        for (let i = 0; i <= numFlames; i++) {
          const fx = cx - 40 * scale + (80 * scale / numFlames) * i;
          const wobble = Math.sin(frame * 0.4 + i * 1.7 + layer) * (14 * scale);
          const flameH = (75 + Math.sin(frame * 0.5 + i * 2.3) * 25) * hScale;
          const fy = cy - flameH + wobble;

          if (i === 0) {
            ctx.lineTo(fx, cy + 10);
          } else {
            const prevFx = cx - 40 * scale + (80 * scale / numFlames) * (i - 1);
            ctx.quadraticCurveTo(prevFx + 5, fy + 20, fx, fy);
          }
        }

        ctx.lineTo(cx + 40 * scale, cy + 20);
        ctx.closePath();
        ctx.fill();
      }

      // Embers rising
      for (let e = 0; e < 24; e++) {
        const speed = (e % 3 + 1) * 2.5;
        const ex = cx + Math.sin(frame * 0.15 + e * 4.2) * 55;
        const ey = (cy - (frame * speed + e * 20)) % (height - 30);
        const eSize = 2 + (e % 3);

        ctx.fillStyle = e % 2 === 0 ? '#ecab46' : '#ff8e80';
        ctx.fillRect(ex, Math.max(10, ey), eSize, eSize);
      }
    },
  },
  {
    id: 'famicom_coin',
    name: 'Super Famicom Rotating Coin',
    category: 'Sprite & Icons',
    durationFrames: 60,
    fps: 15,
    description: 'Shining gold coin rotating in 3D with star glints and shadow',
    renderFrame: (ctx, width, height, frame, total) => {
      const progress = frame / total;
      const angle = progress * Math.PI * 2;
      const cx = width / 2;
      const cy = height / 2;

      // Dark background
      ctx.fillStyle = '#100818';
      ctx.fillRect(0, 0, width, height);

      // Floor shadow
      ctx.fillStyle = '#08040d';
      ctx.beginPath();
      ctx.ellipse(cx, cy + 65, 55, 14, 0, 0, Math.PI * 2);
      ctx.fill();

      // Coin width scales by cos(angle)
      const coinWidth = Math.cos(angle) * 44;
      const coinHeight = 80;
      const absWidth = Math.abs(coinWidth);

      // Rim
      ctx.fillStyle = '#985700';
      ctx.beginPath();
      ctx.ellipse(cx + (coinWidth > 0 ? 3 : -3), cy, absWidth + 4, coinHeight / 2 + 2, 0, 0, Math.PI * 2);
      ctx.fill();

      // Outer coin face
      ctx.fillStyle = '#ecab46';
      ctx.beginPath();
      ctx.ellipse(cx, cy, Math.max(3, absWidth), coinHeight / 2, 0, 0, Math.PI * 2);
      ctx.fill();

      // Inner coin ring
      if (absWidth > 12) {
        ctx.fillStyle = '#ffce87';
        ctx.beginPath();
        ctx.ellipse(cx, cy, absWidth * 0.75, coinHeight * 0.38, 0, 0, Math.PI * 2);
        ctx.fill();

        // Embossed Star / Dollar
        ctx.fillStyle = '#985700';
        ctx.fillRect(cx - absWidth * 0.25, cy - 14, absWidth * 0.5, 28);
      }

      // Star sparkle when face on
      const sparkleIntensity = Math.pow(Math.abs(Math.cos(angle)), 8);
      if (sparkleIntensity > 0.4) {
        const sx = cx + coinWidth * 0.4;
        const sy = cy - 25;
        const sSize = 16 * sparkleIntensity;

        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.moveTo(sx, sy - sSize);
        ctx.lineTo(sx + sSize * 0.3, sy);
        ctx.lineTo(sx + sSize, sy);
        ctx.lineTo(sx + sSize * 0.3, sy + sSize * 0.4);
        ctx.lineTo(sx + sSize * 0.5, sy + sSize);
        ctx.lineTo(sx, sy + sSize * 0.6);
        ctx.lineTo(sx - sSize * 0.5, sy + sSize);
        ctx.lineTo(sx - sSize * 0.3, sy + sSize * 0.4);
        ctx.lineTo(sx - sSize, sy);
        ctx.lineTo(sx - sSize * 0.3, sy);
        ctx.closePath();
        ctx.fill();
      }
    },
  },
];

export function createProceduralArtwork(theme, type = 'poster', variant = 0) {
  const canvas = document.createElement('canvas');
  if (type === 'poster') {
    canvas.width = 800;
    canvas.height = 1200;
  } else if (type === 'backdrop') {
    canvas.width = 1280;
    canvas.height = 720;
  } else {
    canvas.width = 800;
    canvas.height = 220;
  }
  const context = canvas.getContext('2d');
  const width = canvas.width;
  const height = canvas.height;

  if (type === 'logo') {
    context.clearRect(0, 0, width, height);
    context.textAlign = 'center';
    context.textBaseline = 'middle';
    if (theme === 'dune2') {
      context.fillStyle = '#FFF5E1';
      context.font = '800 92px "Syne", sans-serif';
      context.fillText('D U N E', width / 2, height / 2 - 18);
      context.font = '600 26px "JetBrains Mono", monospace';
      context.fillStyle = '#E89B4C';
      context.fillText('P A R T   T W O', width / 2, height / 2 + 48);
    } else if (theme === 'itmfl') {
      context.fillStyle = '#FFE4E6';
      context.font = 'italic 82px "Instrument Serif", serif';
      context.fillText('In the Mood for Love', width / 2, height / 2 - 10);
      context.font = '600 22px "Plus Jakarta Sans", sans-serif';
      context.fillStyle = '#FB7185';
      context.fillText('WONG KAR-WAI · 2000', width / 2, height / 2 + 48);
    } else if (theme === 'br2049') {
      context.fillStyle = '#38BDF8';
      context.font = '800 66px "Syne", sans-serif';
      context.fillText('BLADE RUNNER', width / 2, height / 2 - 20);
      context.fillStyle = '#F97316';
      context.font = '700 50px "JetBrains Mono", monospace';
      context.fillText('2 0 4 9', width / 2, height / 2 + 42);
    } else {
      context.fillStyle = '#F8FAFC';
      context.font = '800 74px "Syne", sans-serif';
      context.fillText('SUCCESSION', width / 2, height / 2 - 14);
      context.fillStyle = '#94A3B8';
      context.font = '600 22px "JetBrains Mono", monospace';
      context.fillText('WAYSTAR ROYCO · HBO', width / 2, height / 2 + 46);
    }
    return canvas.toDataURL('image/png');
  }

  if (theme === 'dune2') {
    const palettes = [
      ['#1A0D06', '#6E260E', '#D96B27', '#F4B860', '#FCE5B8'],
      ['#0B1320', '#1C2E4A', '#A85A2A', '#E08E45', '#F9D89C']
    ];
    const palette = palettes[variant % palettes.length];
    const gradient = context.createLinearGradient(0, 0, 0, height);
    gradient.addColorStop(0, palette[0]);
    gradient.addColorStop(0.35, palette[1]);
    gradient.addColorStop(0.7, palette[2]);
    gradient.addColorStop(1, palette[3]);
    context.fillStyle = gradient;
    context.fillRect(0, 0, width, height);

    const sunY = type === 'poster' ? height * 0.34 : height * 0.42;
    const sunR = type === 'poster' ? width * 0.28 : height * 0.28;
    const sunGradient = context.createRadialGradient(width * 0.5, sunY, sunR * 0.1, width * 0.5, sunY, sunR * 1.4);
    sunGradient.addColorStop(0, palette[4]);
    sunGradient.addColorStop(0.5, palette[3]);
    sunGradient.addColorStop(1, 'rgba(217, 107, 39, 0)');
    context.fillStyle = sunGradient;
    context.beginPath();
    context.arc(width * 0.5, sunY, sunR * 1.4, 0, Math.PI * 2);
    context.fill();

    const drawDune = (yStart, cp1y, cp2y, yEnd, color) => {
      context.fillStyle = color;
      context.beginPath();
      context.moveTo(0, yStart);
      context.bezierCurveTo(width * 0.35, cp1y, width * 0.65, cp2y, width, yEnd);
      context.lineTo(width, height);
      context.lineTo(0, height);
      context.closePath();
      context.fill();
    };
    drawDune(height * 0.58, height * 0.48, height * 0.66, height * 0.54, '#7C2D12');
    drawDune(height * 0.68, height * 0.62, height * 0.56, height * 0.72, '#431407');
    drawDune(height * 0.78, height * 0.72, height * 0.84, height * 0.75, '#180802');
  } else if (theme === 'itmfl') {
    const gradient = context.createRadialGradient(width * 0.65, height * 0.3, 40, width * 0.5, height * 0.5, Math.max(width, height) * 0.85);
    gradient.addColorStop(0, '#FBBF24');
    gradient.addColorStop(0.28, '#E11D48');
    gradient.addColorStop(0.65, '#4A0E1C');
    gradient.addColorStop(1, '#0F0508');
    context.fillStyle = gradient;
    context.fillRect(0, 0, width, height);
    context.fillStyle = 'rgba(10, 4, 7, 0.38)';
    for (let y = 0; y < height; y += 38) context.fillRect(0, y, width, 14);
  } else if (theme === 'br2049') {
    const gradient = context.createLinearGradient(0, 0, width, height);
    gradient.addColorStop(0, '#050B14');
    gradient.addColorStop(0.45, '#0F2942');
    gradient.addColorStop(0.75, '#EA580C');
    gradient.addColorStop(1, '#FDBA74');
    context.fillStyle = gradient;
    context.fillRect(0, 0, width, height);
    context.fillStyle = 'rgba(5, 11, 20, 0.72)';
    context.fillRect(width * 0.08, height * 0.18, width * 0.18, height * 0.82);
    context.fillRect(width * 0.72, height * 0.12, width * 0.22, height * 0.88);
  } else {
    const gradient = context.createLinearGradient(0, 0, 0, height);
    gradient.addColorStop(0, '#090D16');
    gradient.addColorStop(0.45, '#1E293B');
    gradient.addColorStop(0.8, '#334155');
    gradient.addColorStop(1, '#94A3B8');
    context.fillStyle = gradient;
    context.fillRect(0, 0, width, height);
    context.fillStyle = '#0B0F19';
    [0.06, 0.22, 0.38, 0.56, 0.74, 0.88].forEach((tileX, index) => {
      const tileWidth = width * 0.12;
      const tileHeight = height * (0.35 + ((index * 17) % 35) / 100);
      context.fillRect(width * tileX, height - tileHeight, tileWidth, tileHeight);
    });
  }
  return canvas.toDataURL('image/jpeg', 0.92);
}

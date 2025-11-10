/**
 * Avatar Generator
 * Generates unique SVG avatars based on wallet address
 * Similar to Jazzicon/Blockies but simpler
 */

interface AvatarConfig {
  size?: number;
  address: string;
}

/**
 * Generate a deterministic color from address
 */
function addressToColor(address: string, index: number): string {
  const hash = address.slice(2 + index * 6, 8 + index * 6);
  const num = parseInt(hash, 16);
  
  // Generate vibrant colors
  const hue = num % 360;
  const saturation = 65 + (num % 20);
  const lightness = 50 + (num % 15);
  
  return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
}

/**
 * Generate a simple geometric pattern based on address
 */
function generatePattern(address: string): string {
  const hash = address.toLowerCase().slice(2);
  const patterns: string[] = [];
  
  // Create 5x5 grid of squares (symmetric)
  for (let y = 0; y < 5; y++) {
    for (let x = 0; x < 3; x++) { // Only generate half, mirror the rest
      const index = y * 3 + x;
      const value = parseInt(hash[index % hash.length], 16);
      
      if (value > 7) { // 50% chance of square appearing
        const color = addressToColor(address, index);
        
        // Draw square and its mirror
        patterns.push(`<rect x="${x * 20}" y="${y * 20}" width="20" height="20" fill="${color}" opacity="0.8"/>`);
        if (x < 2) { // Mirror (except center column)
          patterns.push(`<rect x="${(4 - x) * 20}" y="${y * 20}" width="20" height="20" fill="${color}" opacity="0.8"/>`);
        }
      }
    }
  }
  
  return patterns.join('\n');
}

/**
 * Generate gradient background based on address
 */
function generateGradient(address: string): string {
  const color1 = addressToColor(address, 0);
  const color2 = addressToColor(address, 1);
  
  return `
    <defs>
      <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" style="stop-color:${color1};stop-opacity:1" />
        <stop offset="100%" style="stop-color:${color2};stop-opacity:1" />
      </linearGradient>
    </defs>
    <rect width="100" height="100" fill="url(#grad)"/>
  `;
}

/**
 * Generate SVG avatar from wallet address
 */
export function generateAvatar({ address, size = 100 }: AvatarConfig): string {
  const gradient = generateGradient(address);
  const pattern = generatePattern(address);
  
  const svg = `
    <svg width="${size}" height="${size}" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
      ${gradient}
      ${pattern}
    </svg>
  `;
  
  return svg.trim();
}

/**
 * Generate avatar as data URL (for use in img src)
 */
export function generateAvatarDataURL(address: string, size = 100): string {
  const svg = generateAvatar({ address, size });
  const base64 = btoa(svg);
  return `data:image/svg+xml;base64,${base64}`;
}

/**
 * Generate avatar as Blob (for file upload)
 */
export function generateAvatarBlob(address: string, size = 100): Blob {
  const svg = generateAvatar({ address, size });
  return new Blob([svg], { type: 'image/svg+xml' });
}

/**
 * Generate avatar as File (for form submission)
 */
export function generateAvatarFile(address: string, size = 100): File {
  const blob = generateAvatarBlob(address, size);
  return new File([blob], `avatar-${address.slice(0, 8)}.svg`, { type: 'image/svg+xml' });
}

/**
 * Alternative: Generate a simple circular avatar with initials
 */
export function generateInitialsAvatar(name: string, address: string, size = 100): string {
  const initials = name
    .split(' ')
    .map(word => word[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
  
  const bgColor = addressToColor(address, 0);
  const textColor = '#ffffff';
  
  const svg = `
    <svg width="${size}" height="${size}" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
      <circle cx="50" cy="50" r="50" fill="${bgColor}"/>
      <text 
        x="50" 
        y="50" 
        font-family="Arial, sans-serif" 
        font-size="40" 
        font-weight="bold" 
        fill="${textColor}" 
        text-anchor="middle" 
        dominant-baseline="central"
      >
        ${initials}
      </text>
    </svg>
  `;
  
  return svg.trim();
}

/**
 * Generate initials avatar as data URL
 */
export function generateInitialsAvatarDataURL(name: string, address: string, size = 100): string {
  const svg = generateInitialsAvatar(name, address, size);
  const base64 = btoa(svg);
  return `data:image/svg+xml;base64,${base64}`;
}

/**
 * Generate a more artistic avatar with shapes
 */
export function generateArtisticAvatar(address: string, size = 100): string {
  const hash = address.toLowerCase().slice(2);
  const color1 = addressToColor(address, 0);
  const color2 = addressToColor(address, 1);
  const color3 = addressToColor(address, 2);
  
  // Generate random-ish positions based on address
  const shapes: string[] = [];
  
  for (let i = 0; i < 8; i++) {
    const value = parseInt(hash[i * 4] + hash[i * 4 + 1], 16);
    const x = (value % 80) + 10;
    const y = (parseInt(hash[i * 4 + 2] + hash[i * 4 + 3], 16) % 80) + 10;
    const r = (value % 20) + 10;
    const color = [color1, color2, color3][i % 3];
    
    shapes.push(`<circle cx="${x}" cy="${y}" r="${r}" fill="${color}" opacity="0.6"/>`);
  }
  
  const svg = `
    <svg width="${size}" height="${size}" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:${color1};stop-opacity:0.3" />
          <stop offset="100%" style="stop-color:${color2};stop-opacity:0.3" />
        </linearGradient>
      </defs>
      <rect width="100" height="100" fill="url(#bg)"/>
      ${shapes.join('\n')}
    </svg>
  `;
  
  return svg.trim();
}

/**
 * Generate artistic avatar as data URL
 */
export function generateArtisticAvatarDataURL(address: string, size = 100): string {
  const svg = generateArtisticAvatar(address, size);
  const base64 = btoa(svg);
  return `data:image/svg+xml;base64,${base64}`;
}

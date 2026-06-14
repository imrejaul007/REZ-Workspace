import logger from './utils/logger';

const http = require('http');
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

const DIST = path.join(__dirname, 'dist');
const PORT = 8081;
const MIME = {
  '.html': 'text/html', '.js': 'application/javascript', '.css': 'text/css',
  '.json': 'application/json', '.png': 'image/png', '.jpg': 'image/jpeg',
  '.gif': 'image/gif', '.svg': 'image/svg+xml', '.ico': 'image/x-icon',
  '.woff': 'font/woff', '.woff2': 'font/woff2', '.ttf': 'font/ttf',
  '.webp': 'image/webp', '.mp4': 'video/mp4',
};

http.createServer((req, res) => {
  let urlPath = req.url.split('?')[0];
  
  // Try exact file, then .html, then dynamic [param].html, then index.html fallback
  let filePath = path.join(DIST, urlPath);
  if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
    const htmlPath = path.join(DIST, urlPath + '.html');
    if (fs.existsSync(htmlPath)) {
      filePath = htmlPath;
    } else if (fs.existsSync(path.join(filePath, 'index.html'))) {
      filePath = path.join(filePath, 'index.html');
    } else {
      // Expo dynamic routes: /experience/organic → dist/experience/[type].html
      // Walk up the URL segments looking for [param].html files
      const segments = urlPath.split('/').filter(Boolean);
      let found = false;
      for (let i = segments.length; i > 0 && !found; i--) {
        const parentDir = path.join(DIST, ...segments.slice(0, i - 1));
        if (fs.existsSync(parentDir) && fs.statSync(parentDir).isDirectory()) {
          // Look for any [param].html file in this directory
          try {
            const files = fs.readdirSync(parentDir);
            const dynamicFile = files.find(f => f.startsWith('[') && f.endsWith('].html'));
            if (dynamicFile) {
              filePath = path.join(parentDir, dynamicFile);
              found = true;
            }
          } catch {}
        }
      }
      if (!found) {
        // Deep dynamic routes: /MainCategory/food-dining/search → check parent for [slug] dir
        for (let i = segments.length - 1; i > 0 && !found; i--) {
          const parentDir = path.join(DIST, ...segments.slice(0, i - 1));
          if (fs.existsSync(parentDir) && fs.statSync(parentDir).isDirectory()) {
            try {
              const dirs = fs.readdirSync(parentDir).filter(d => d.startsWith('[') && d.endsWith(']'));
              for (const dynDir of dirs) {
                const innerPath = path.join(parentDir, dynDir, ...segments.slice(i));
                // Try exact file in dynamic dir
                if (fs.existsSync(innerPath + '.html')) { filePath = innerPath + '.html'; found = true; break; }
                if (fs.existsSync(path.join(innerPath, 'index.html'))) { filePath = path.join(innerPath, 'index.html'); found = true; break; }
                // Try dynamic file inside dynamic dir
                if (fs.existsSync(innerPath) && fs.statSync(innerPath).isDirectory()) {
                  const innerFiles = fs.readdirSync(innerPath);
                  const innerDynamic = innerFiles.find(f => f.startsWith('[') && f.endsWith('].html'));
                  if (innerDynamic) { filePath = path.join(innerPath, innerDynamic); found = true; break; }
                }
              }
            } catch {}
          }
        }
      }
      if (!found) filePath = path.join(DIST, 'index.html');
    }
  }
  
  if (!fs.existsSync(filePath)) {
    res.writeHead(404); res.end('Not found'); return;
  }
  
  const ext = path.extname(filePath);
  const mime = MIME[ext] || 'application/octet-stream';
  const raw = fs.readFileSync(filePath);
  
  // Cache static assets
  if (ext !== '.html') {
    res.setHeader('Cache-Control', 'public, max-age=86400');
  }
  
  // Gzip compress text-based files > 1KB
  const acceptGzip = (req.headers['accept-encoding'] || '').includes('gzip');
  if (acceptGzip && ['.js', '.css', '.html', '.json', '.svg'].includes(ext) && raw.length > 1024) {
    res.writeHead(200, { 'Content-Type': mime, 'Content-Encoding': 'gzip', 'Vary': 'Accept-Encoding' });
    zlib.gzip(raw, { level: 6 }, (err, compressed) => {
      if (err) { res.end(raw); } else { res.end(compressed); }
    });
  } else {
    res.writeHead(200, { 'Content-Type': mime });
    res.end(raw);
  }
}).listen(PORT, () => logger.info(`Rez App: http://localhost:${PORT} (gzip enabled)`));

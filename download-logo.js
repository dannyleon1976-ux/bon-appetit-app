import fs from 'fs';
import path from 'path';
import https from 'https';

const logoUrl = 'https://lh3.googleusercontent.com/d/1PM66mFfsBp8P-6UV6h2N91_UgIkAM3Wo';

const publicDir = path.join(process.cwd(), 'public');
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

// 1x1 transparent PNG fallback
const FALLBACK_BASE64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR4nGNgYAAAAAMAAWgmWQ0AAAAASUVORK5CYII=';

function writeFallback(destPath) {
  try {
    fs.writeFileSync(destPath, Buffer.from(FALLBACK_BASE64, 'base64'));
    console.log(`Wrote fallback image to ${destPath}`);
  } catch (err) {
    console.error('Failed to write fallback image:', err);
  }
}

function downloadImage(url, destPath) {
  return new Promise((resolve, reject) => {
    try {
      const req = https.get(url, (res) => {
        // Follow redirects (301/302)
        if (res.statusCode === 301 || res.statusCode === 302) {
          const location = res.headers.location;
          if (!location) {
            reject(new Error(`Redirected but no location header for ${url}`));
            return;
          }
          // small safeguard to avoid infinite redirect loops
          if (location === url) {
            reject(new Error('Redirect loop detected'));
            return;
          }
          downloadImage(location, destPath).then(resolve).catch(reject);
          return;
        }

        if (res.statusCode !== 200) {
          reject(new Error(`Failed to get '${url}' (Status Code: ${res.statusCode})`));
          return;
        }

        const fileStream = fs.createWriteStream(destPath);
        res.pipe(fileStream);

        fileStream.on('finish', () => {
          fileStream.close();
          console.log(`Successfully downloaded to ${destPath}`);
          resolve();
        });

        fileStream.on('error', (err) => {
          try { fs.unlinkSync(destPath); } catch (e) {}
          reject(err);
        });
      });

      // Timeout in 10s
      req.setTimeout(10000, () => {
        req.destroy(new Error('Request timeout'));
      });

      req.on('error', (err) => {
        reject(err);
      });
    } catch (err) {
      reject(err);
    }
  });
}

async function main() {
  try {
    console.log('Downloading logo...');
    await downloadImage(logoUrl, path.join(publicDir, 'logo.png'))
      .catch((err) => {
        console.error('Error downloading logo (logo.png):', err.message || err);
        writeFallback(path.join(publicDir, 'logo.png'));
      });

    await downloadImage(logoUrl, path.join(publicDir, 'apple-touch-icon.png'))
      .catch((err) => {
        console.error('Error downloading logo (apple-touch-icon.png):', err.message || err);
        writeFallback(path.join(publicDir, 'apple-touch-icon.png'));
      });

    await downloadImage(logoUrl, path.join(publicDir, 'favicon.png'))
      .catch((err) => {
        console.error('Error downloading logo (favicon.png):', err.message || err);
        writeFallback(path.join(publicDir, 'favicon.png'));
      });

    // Copy to root level as well for extra compatibility
    try {
      const faviconSrc = path.join(publicDir, 'favicon.png');
      const rootFavicon = path.join(process.cwd(), 'favicon.ico');
      const publicFaviconIco = path.join(publicDir, 'favicon.ico');

      if (fs.existsSync(faviconSrc)) {
        // Attempt to copy; if conversion to .ico is desired, keep as png copy to .ico filename
        fs.copyFileSync(faviconSrc, rootFavicon);
        fs.copyFileSync(faviconSrc, publicFaviconIco);
      } else {
        writeFallback(rootFavicon);
        writeFallback(publicFaviconIco);
      }
    } catch (err) {
      console.error('Error copying favicon files:', err.message || err);
    }

    console.log('All icons compiled and saved locally!');
  } catch (err) {
    console.error('Unexpected error in download script:', err);
    // As a final fallback, ensure we have minimal icons
    writeFallback(path.join(publicDir, 'logo.png'));
    writeFallback(path.join(publicDir, 'apple-touch-icon.png'));
    writeFallback(path.join(publicDir, 'favicon.png'));
    try { writeFallback(path.join(process.cwd(), 'favicon.ico')); } catch (e) {}
  }
}

main();

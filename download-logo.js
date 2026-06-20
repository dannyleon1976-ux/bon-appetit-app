import fs from 'fs';
import path from 'path';
import https from 'https';

const logoUrl = 'https://lh3.googleusercontent.com/d/1PM66mFfsBp8P-6UV6h2N91_UgIkAM3Wo';

const publicDir = path.join(process.cwd(), 'public');
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

function downloadImage(url, destPath) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      if (res.statusCode === 301 || res.statusCode === 302) {
        // Handle redirect
        downloadImage(res.headers.location, destPath).then(resolve).catch(reject);
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
        fs.unlink(destPath, () => {});
        reject(err);
      });
    }).on('error', (err) => {
      reject(err);
    });
  });
}

async function main() {
  try {
    console.log('Downloading logo...');
    await downloadImage(logoUrl, path.join(publicDir, 'logo.png'));
    await downloadImage(logoUrl, path.join(publicDir, 'apple-touch-icon.png'));
    await downloadImage(logoUrl, path.join(publicDir, 'favicon.png'));
    
    // Copy to root level as well for extra compatibility
    fs.copyFileSync(path.join(publicDir, 'favicon.png'), path.join(process.cwd(), 'favicon.ico'));
    fs.copyFileSync(path.join(publicDir, 'favicon.png'), path.join(publicDir, 'favicon.ico'));
    
    console.log('All icons compiled and saved locally!');
  } catch (err) {
    console.error('Error downloading logo:', err);
  }
}

main();

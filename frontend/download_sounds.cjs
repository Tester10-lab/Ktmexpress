const https = require('https');
const fs = require('fs');
const path = require('path');

const download = (url, dest) => {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(dest);
    https.get(url, (response) => {
      if (response.statusCode === 301 || response.statusCode === 302) {
         return download(response.headers.location, dest).then(resolve).catch(reject);
      }
      if (response.statusCode !== 200) {
         return reject(new Error('Status ' + response.statusCode));
      }
      response.pipe(file);
      file.on('finish', () => {
        file.close(resolve);
      });
    }).on('error', (err) => {
      fs.unlink(dest, () => reject(err));
    });
  });
};

const urls = [
  { url: 'https://actions.google.com/sounds/v1/alarms/beep_short.ogg', dest: 'public/sounds/notification.ogg' },
  { url: 'https://actions.google.com/sounds/v1/alarms/digital_watch_alarm_long.ogg', dest: 'public/sounds/alert.ogg' },
  { url: 'https://actions.google.com/sounds/v1/cartoon/cartoon_boing.ogg', dest: 'public/sounds/success.ogg' },
  { url: 'https://actions.google.com/sounds/v1/alarms/bugle_tune.ogg', dest: 'public/sounds/error.ogg' }
];

console.log('Downloading sounds...');
Promise.all(urls.map(u => download(u.url, path.join(__dirname, u.dest))))
  .then(() => console.log('All sounds downloaded successfully!'))
  .catch(err => console.error('Error downloading sounds:', err));

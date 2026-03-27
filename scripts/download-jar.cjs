const https = require('https');
const fs = require('fs');

const url = 'https://raw.githubusercontent.com/gradle/gradle/v8.14.3/platforms/core-runtime/wrapper/src/main/resources/gradle-wrapper.jar';
const file = fs.createWriteStream('test.jar');

https.get(url, (res) => {
  if (res.statusCode === 200) {
    res.pipe(file);
    file.on('finish', () => {
      file.close();
      console.log('Downloaded successfully. Size:', fs.statSync('test.jar').size);
    });
  } else {
    console.log('Failed to download:', res.statusCode);
  }
}).on('error', (err) => {
  console.log('Error:', err.message);
});

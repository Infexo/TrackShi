import fs from 'fs';
import path from 'path';

const iconBase64 = "iVBORw0KGgoAAAANSUhEUgAAAQAAAAEAAQMAAABmvDolAAAAA1BMVEUATK9I8b+xAAAAH0lEQVR42u3BAQEAAACCIP+vbwmAAQAAAAAAAAAAwKMBJ0AAAX10f2cAAAAASUVORK5CYII="; // 256x256 green square

const splashBase64 = "iVBORw0KGgoAAAANSUhEUgAAAgAAAAIAAQMAAADOtka5AAAAA1BMVEUATK9I8b+xAAAAIklEQVR42u3BAQEAAACCIP+vbwmAAQAAAAAAAAAAAAAAwKMBWwAAAc1V7kUAAAAASUVORK5CYII="; // 512x512 green square

fs.mkdirSync('assets', { recursive: true });
fs.writeFileSync('assets/icon.png', Buffer.from(iconBase64, 'base64'));
fs.writeFileSync('assets/splash.png', Buffer.from(splashBase64, 'base64'));
console.log('Assets created!');

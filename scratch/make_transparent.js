const Jimp = require('jimp');

async function run() {
  try {
    const image = await Jimp.read('C:\\Users\\akinrodolu.olajide\\.gemini\\antigravity-ide\\brain\\9cad3fa2-4305-4341-9c7a-34635d6da26a\\.user_uploaded\\media_1790232428661.png');
    image.scan(0, 0, image.bitmap.width, image.bitmap.height, function (x, y, idx) {
      const red = this.bitmap.data[idx + 0];
      const green = this.bitmap.data[idx + 1];
      const blue = this.bitmap.data[idx + 2];
      
      // Target white and near-white pixels
      if (red > 245 && green > 245 && blue > 245) {
        this.bitmap.data[idx + 3] = 0; // Transparent
      }
    });
    await image.writeAsync('C:\\Users\\akinrodolu.olajide\\Downloads\\PATCHWORK\\apps\\mobile\\assets\\images\\builders.png');
    console.log('Done!');
  } catch(e) {
    console.error(e);
  }
}
run();

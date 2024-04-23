// @ts-ignore
const FileCompressor = require("./FileCompressor.js");
const compressor = new FileCompressor();
const fs = require("fs");
const path = require("path");

main();

async function main() {
  const filePath = path.join(__dirname, "test.jpg");
  if (!fs.existsSync(filePath)) {
    console.log(`filePath: ${filePath} 路径不存在`);
    return;
  }

  if (fs.existsSync(filePath + ".br")) {
    fs.unlinkSync(filePath + ".br");
  }
  if (fs.existsSync("./test2.jpg")) {
    fs.unlinkSync("./test2.jpg");
  }

  await new Promise((resolve) => setTimeout(resolve, 1000));

  // br 压缩
  await compressor
    .compress(filePath)
    .then(() => {
      console.log("br压缩后的文件", filePath + ".br");
    })
    .catch(console.error);
  // gzip 压缩
  await compressor
    .compress(filePath, undefined, false)
    .then(() => {
      console.log("gzip压缩后的文件", filePath + ".gz");
    })
    .catch(console.error);
  // 解压
  await compressor
    .decompress("test.jpg.br", "test2.jpg")
    .then(() => {
      console.log("解码后的照片", "test2.jpg");
    })
    .catch(console.error);
}

// 压缩整个文件夹，输出路径省略
// compressor
//   .compress("path/to/inputFolder")
//   .then(console.log)
//   .catch(console.error);

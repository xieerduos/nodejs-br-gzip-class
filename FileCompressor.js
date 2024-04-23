const fs = require("fs");
const path = require("path");
const zlib = require("zlib");
const { promisify } = require("util");
const readdir = promisify(fs.readdir);
const stat = promisify(fs.stat);

class FileCompressor {
  constructor() {
    this.brotliOptions = {
      params: {
        [zlib.constants.BROTLI_PARAM_QUALITY]:
          zlib.constants.BROTLI_MAX_QUALITY,
      },
    };
    this.gzipOptions = {
      level: zlib.constants.Z_MAX_LEVEL,
    };
  }

  async compressFile(inputPath, outputPath, compressFunction) {
    return new Promise((resolve, reject) => {
      const output = fs.createWriteStream(outputPath);
      const compressionStream = compressFunction();

      fs.createReadStream(inputPath)
        .pipe(compressionStream)
        .pipe(output)
        .on("finish", () => resolve(`Compression completed: ${outputPath}`))
        .on("error", reject);
    });
  }

  async decompressFile(inputPath, outputPath, decompressFunction) {
    return new Promise((resolve, reject) => {
      const output = fs.createWriteStream(outputPath);
      const decompressionStream = decompressFunction();

      fs.createReadStream(inputPath)
        .pipe(decompressionStream)
        .pipe(output)
        .on("finish", () => resolve(`Decompression completed: ${outputPath}`))
        .on("error", reject);
    });
  }

  async compressDirectory(inputPath, outputPath, compressFunction, extension) {
    const files = await readdir(inputPath);
    for (let file of files) {
      const fullInputPath = path.join(inputPath, file);
      const fullOutputPath = path.join(outputPath, `${file}${extension}`);
      const fileInfo = await stat(fullInputPath);

      if (fileInfo.isDirectory()) {
        await this.compressDirectory(
          fullInputPath,
          fullOutputPath,
          compressFunction,
          extension
        );
      } else {
        if (!fs.existsSync(fullOutputPath)) {
          await this.compressFile(
            fullInputPath,
            fullOutputPath,
            compressFunction
          );
        }
      }
    }
  }

  async compress(inputPath, outputPath, useBrotli = true) {
    const fileInfo = await stat(inputPath);
    const extension = useBrotli ? ".br" : ".gz";
    const compressFunction = useBrotli
      ? () => zlib.createBrotliCompress(this.brotliOptions)
      : () => zlib.createGzip(this.gzipOptions);

    if (!outputPath) {
      outputPath = inputPath + extension;
    }

    if (fileInfo.isDirectory()) {
      await this.compressDirectory(
        inputPath,
        outputPath,
        compressFunction,
        extension
      );
    } else {
      if (fs.existsSync(outputPath)) {
        fs.unlinkSync(outputPath);
      }
      await this.compressFile(inputPath, outputPath, compressFunction);
    }
  }

  async decompress(inputPath, outputPath, useBrotli = true) {
    const fileInfo = await stat(inputPath);
    const decompressFunction = useBrotli
      ? () => zlib.createBrotliDecompress()
      : () => zlib.createGunzip();

    if (!outputPath) {
      // Remove the extension (.br or .gz) for the decompressed file's path
      outputPath = inputPath.replace(
        new RegExp(`${useBrotli ? ".br$" : ".gz$"}`),
        ""
      );
    }

    if (fileInfo.isDirectory()) {
      throw new Error(
        "Decompressing directories is not supported directly. Please decompress individual files."
      );
    } else {
      await this.decompressFile(inputPath, outputPath, decompressFunction);
    }
  }
}

module.exports = FileCompressor;

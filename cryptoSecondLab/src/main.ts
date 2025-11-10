import sharp from 'sharp';
// @ts-ignore
import { LSBSteganography } from './lsb.ts';
// @ts-ignore
import { CryptoMetrics } from './analysis.ts';
import path from 'path';

class StegoLSBCLI {
  async run() {
    const args = this.parseArgs();
    if (args.mode === 'embed') {
      await this.embed(args);
    } else if (args.mode === 'extract') {
      await this.extract(args);
    } else if (args.mode === 'analyze') {
      await this.analyze(args);
    }
  }

  parseArgs() {
    const args: any = {
      mode: null,
      input: null,
      output: null,
      message: null,
      payload: 1.0,
      cover: null,
      stego: null,
      outputDir: './results'
    };

    for (let i = 2; i < process.argv.length; i++) {
      const arg = process.argv[i];
      if (arg === '--mode') {
        args.mode = process.argv[++i];
      } else if (arg === '--in') {
        args.input = process.argv[++i];
      } else if (arg === '--out') {
        args.output = process.argv[++i];
      } else if (arg === '--message') {
        args.message = process.argv[++i];
      } else if (arg === '--payload') {
        args.payload = parseFloat(process.argv[++i]);
      } else if (arg === '--cover') {
        args.cover = process.argv[++i];
      } else if (arg === '--stego') {
        args.stego = process.argv[++i];
      } else if (arg === '--output-dir') {
        args.outputDir = process.argv[++i];
      }
    }
    return args;
  }

  async embed(args) {
    const imageBuffer = await sharp(args.input).raw().toBuffer();
    const metadata = await sharp(args.input).metadata();
    const imageData = {
      data: imageBuffer,
      width: metadata.width,
      height: metadata.height
    };
    const capacity = LSBSteganography.calculateCapacity(imageData);
    console.log(`Емкость: ${capacity} бит (${Math.floor(capacity / 8)} байт)`);
    console.log(`Payload: ${args.payload * 100}%`);
    const result = LSBSteganography.embedMessage(imageData, args.message, args.payload);
    const outputPath = args.output || this.generateOutputPath(args.input, 'stego');
    await sharp(result.data, {
      raw: {
        width: result.width,
        height: result.height,
        channels: 3
      }
    }).png().toFile(outputPath);
    console.log(`Сообщение встроено: ${outputPath}`);
    const psnr = CryptoMetrics.calculatePSNR(imageData, result);
    const ssim = CryptoMetrics.calculateSSIM(imageData, result);
    console.log(`PSNR: ${psnr.toFixed(2)} dB`);
    console.log(`SSIM: ${ssim.toFixed(6)}`);
  }

  async extract(args) {
    const imageBuffer = await sharp(args.input).raw().toBuffer();
    const metadata = await sharp(args.input).metadata();
    const imageData = {
      data: imageBuffer,
      width: metadata.width,
      height: metadata.height
    };
    const message = LSBSteganography.extractMessage(imageData);
    if (args.output) {
      const fs = await import('fs/promises');
      await fs.writeFile(args.output, message, { encoding: 'utf8' });
    } else {
      console.log(`\nИзвлеченное сообщение:\n${message}`);
    }
  }

  async analyze(args) {
    const coverBuffer = await sharp(args.cover).raw().toBuffer();
    const coverMetadata = await sharp(args.cover).metadata();
    const stegoBuffer = await sharp(args.stego).raw().toBuffer();
    const stegoMetadata = await sharp(args.stego).metadata();
    const cover = {
      data: coverBuffer,
      width: coverMetadata.width,
      height: coverMetadata.height
    };
    const stego = {
      data: stegoBuffer,
      width: stegoMetadata.width,
      height: stegoMetadata.height
    };
    const fs = await import('fs/promises');
    await fs.mkdir(args.outputDir, { recursive: true });
    const baseName = path.basename(args.cover, path.extname(args.cover));
    const outputDir = path.join(args.outputDir, baseName);
    await fs.mkdir(outputDir, { recursive: true });
    await fs.writeFile(path.join(outputDir, 'message.txt'), LSBSteganography.extractMessage(stego), { encoding: 'utf8' });
    const entropyCover = CryptoMetrics.calculateEntropy(cover);
    const entropyStego = CryptoMetrics.calculateEntropy(stego);
    const { npcr, uaci } = CryptoMetrics.calculateNPCRUACI(cover, stego);
    const psnr = CryptoMetrics.calculatePSNR(cover, stego);
    const ssim = CryptoMetrics.calculateSSIM(cover, stego);
    const detection = CryptoMetrics.chiSquareTestAllChannels(stego);
    console.log('\nРезультаты анализа:');
    console.log(`PSNR: ${psnr.toFixed(2)} dB`);
    console.log(`SSIM: ${ssim.toFixed(6)}`);
    console.log(`Энтропия (cover/stego): ${entropyCover.toFixed(4)} / ${entropyStego.toFixed(4)} бит`);
    console.log(`NPCR: ${npcr.toFixed(2)}%`);
    console.log(`UACI: ${uaci.toFixed(2)}%`);
    console.log(`Детекция: ${detection.overallDetected ? 'ОБНАРУЖЕНО' : 'НЕ ОБНАРУЖЕНО'}`);
  }

  generateOutputPath(inputPath, suffix) {
    const ext = path.extname(inputPath);
    const base = path.basename(inputPath, ext);
    const dir = path.dirname(inputPath);
    return path.join(dir, `${base}_${suffix}${ext}`);
  }
}

const cli = new StegoLSBCLI();
cli.run().catch(console.error);

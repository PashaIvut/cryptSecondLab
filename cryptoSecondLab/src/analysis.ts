export class CryptoMetrics {
  static calculateEntropy(imageData: any) {
    const histogram = new Array(256).fill(0);
    const bytes = new Uint8Array(imageData.data.buffer);
    const totalBytes = bytes.length;
    for (let i = 0; i < totalBytes; i += 3) {
      histogram[bytes[i]]++;
      histogram[bytes[i + 1]]++;
      histogram[bytes[i + 2]]++;
    }
    let entropy = 0;
    const totalPixels = (totalBytes / 3) * 3;
    for (let i = 0; i < 256; i++) {
      if (histogram[i] > 0) {
        const probability = histogram[i] / totalPixels;
        entropy -= probability * Math.log2(probability);
      }
    }
    return entropy;
  }

  static calculateCorrelation(imageData: any) {
    const width = imageData.width;
    const height = imageData.height;
    const data = imageData.data;
    let horizontalCorr = 0;
    let verticalCorr = 0;
    let diagonalCorr = 0;
    let count = 0;
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const idx = (y * width + x) * 3;
        if (x < width - 1) {
          const nextIdx = (y * width + x + 1) * 3;
          horizontalCorr += this.calculatePixelCorrelation(data, idx, nextIdx);
        }
        if (y < height - 1) {
          const nextIdx = ((y + 1) * width + x) * 3;
          verticalCorr += this.calculatePixelCorrelation(data, idx, nextIdx);
        }
        if (x < width - 1 && y < height - 1) {
          const nextIdx = ((y + 1) * width + x + 1) * 3;
          diagonalCorr += this.calculatePixelCorrelation(data, idx, nextIdx);
        }
        count++;
      }
    }
    return {
      horizontal: horizontalCorr / count,
      vertical: verticalCorr / count,
      diagonal: diagonalCorr / count,
    };
  }

  static calculatePixelCorrelation(data: any, idx1: number, idx2: number) {
    const r1 = data[idx1], g1 = data[idx1 + 1], b1 = data[idx1 + 2];
    const r2 = data[idx2], g2 = data[idx2 + 1], b2 = data[idx2 + 2];
    const avg1 = (r1 + g1 + b1) / 3;
    const avg2 = (r2 + g2 + b2) / 3;
    return Math.abs(avg1 - avg2) / 255;
  }

  static calculateNPCRUACI(enc1: any, enc2: any) {
    const data1 = new Uint8Array(enc1.data.buffer);
    const data2 = new Uint8Array(enc2.data.buffer);
    let changedPixels = 0;
    let totalDifference = 0;
    const totalPixels = data1.length / 3;
    for (let i = 0; i < data1.length; i += 3) {
      const r1 = data1[i], g1 = data1[i + 1], b1 = data1[i + 2];
      const r2 = data2[i], g2 = data2[i + 1], b2 = data2[i + 2];
      if (r1 !== r2 || g1 !== g2 || b1 !== b2) {
        changedPixels++;
      }
      totalDifference += Math.abs(r1 - r2) + Math.abs(g1 - g2) + Math.abs(b1 - b2);
    }
    const npcr = (changedPixels / totalPixels) * 100;
    const uaci = (totalDifference / (totalPixels * 3 * 255)) * 100;
    return { npcr, uaci };
  }

  static calculateHistogram(imageData: any) {
    const histogram = {
      r: new Array(256).fill(0),
      g: new Array(256).fill(0),
      b: new Array(256).fill(0),
    };
    const data = imageData.data;
    for (let i = 0; i < data.length; i += 3) {
      histogram.r[data[i]]++;
      histogram.g[data[i + 1]]++;
      histogram.b[data[i + 2]]++;
    }
    return histogram;
  }

  static calculatePSNR(cover: any, stego: any) {
    const data1 = new Uint8Array(cover.data);
    const data2 = new Uint8Array(stego.data);
    let sumSquaredError = 0;
    const totalPixels = data1.length;
    for (let i = 0; i < data1.length; i++) {
      const diff = data1[i] - data2[i];
      sumSquaredError += diff * diff;
    }
    const mse = sumSquaredError / totalPixels;
    if (mse === 0) {
      return Infinity;
    }
    const maxPixelValue = 255;
    const psnr = 10 * Math.log10((maxPixelValue * maxPixelValue) / mse);
    return psnr;
  }

  static calculateSSIM(cover: any, stego: any) {
    const width = cover.width;
    const height = cover.height;
    const c1 = 0.01 * 255;
    const c2 = 0.03 * 255;
    let totalSSIM = 0;
    for (let c = 0; c < 3; c++) {
      const coverChannel = [];
      const stegoChannel = [];
      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          const idx = (y * width + x) * 3 + c;
          coverChannel.push(cover.data[idx]);
          stegoChannel.push(stego.data[idx]);
        }
      }
      const mu1 = this.mean(coverChannel);
      const mu2 = this.mean(stegoChannel);
      const sigma1Sq = this.variance(coverChannel, mu1);
      const sigma2Sq = this.variance(stegoChannel, mu2);
      const sigma12 = this.covariance(coverChannel, stegoChannel, mu1, mu2);
      const numerator = (2 * mu1 * mu2 + c1) * (2 * sigma12 + c2);
      const denominator = (mu1 * mu1 + mu2 * mu2 + c1) * (sigma1Sq + sigma2Sq + c2);
      const ssim = numerator / denominator;
      totalSSIM += ssim;
    }
    return totalSSIM / 3;
  }

  static mean(channel: number[]) {
    return channel.reduce((sum, val) => sum + val, 0) / channel.length;
  }

  static variance(channel: number[], mean: number) {
    return channel.reduce((sum, val) => sum + (val - mean) * (val - mean), 0) / channel.length;
  }

  static covariance(channel1: number[], channel2: number[], mean1: number, mean2: number) {
    let sum = 0;
    for (let i = 0; i < channel1.length; i++) {
      sum += (channel1[i] - mean1) * (channel2[i] - mean2);
    }
    return sum / channel1.length;
  }

  static chiSquareTest(imageData: any, channel: number = 0) {
    const histogram = new Array(256).fill(0);
    for (let i = channel; i < imageData.data.length; i += 3) {
      histogram[imageData.data[i]]++;
    }
    const pairs = [];
    for (let k = 0; k < 128; k++) {
      pairs.push([histogram[2 * k], histogram[2 * k + 1]]);
    }
    let chiSquare = 0;
    let degreesOfFreedom = 0;
    for (const [f2k, f2k1] of pairs) {
      const total = f2k + f2k1;
      if (total > 0) {
        const expected = total / 2;
        const chi2k = ((f2k - expected) ** 2) / expected;
        const chi2k1 = ((f2k1 - expected) ** 2) / expected;
        chiSquare += chi2k + chi2k1;
        degreesOfFreedom++;
      }
    }
    const pValue = Math.exp(-chiSquare / (2 * degreesOfFreedom));
    const detected = pValue < 0.05;
    return {
      chiSquare,
      pValue,
      detected,
    };
  }

  static chiSquareTestAllChannels(imageData: any) {
    const results: any[] = [];
    for (let c = 0; c < 3; c++) {
      const result = this.chiSquareTest(imageData, c);
      results.push({
        channel: c,
        ...result,
      });
    }
    const overallDetected = results.some((r) => r.detected);
    return {
      channels: results,
      overallDetected,
    };
  }
}

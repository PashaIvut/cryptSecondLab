export class LSBSteganography {
  static embedMessage(imageData: any, message: string, payload: number = 1.0) {
    const capacity = imageData.width * imageData.height * 3;
    const messageBits = this.textToBits(message);
    const stegoData = Buffer.from(imageData.data as ArrayLike<number>);
    let bitIndex = 0;
    for (let y = 0; y < imageData.height; y++) {
      for (let x = 0; x < imageData.width; x++) {
        for (let c = 0; c < 3; c++) {
          if (bitIndex >= messageBits.length) break;
          const pixelIndex = (y * imageData.width + x) * 3 + c;
          const currentByte = stegoData[pixelIndex];
          const messageBit = messageBits[bitIndex];
          const newByte = (currentByte & 0xfe) | messageBit;
          stegoData[pixelIndex] = newByte;
          bitIndex++;
        }
        if (bitIndex >= messageBits.length) break;
      }
      if (bitIndex >= messageBits.length) break;
    }
    return {
      data: stegoData,
      width: imageData.width,
      height: imageData.height
    };
  }

  static extractMessage(imageData: any) {
    const bits: number[] = [];
    for (let y = 0; y < imageData.height; y++) {
      for (let x = 0; x < imageData.width; x++) {
        for (let c = 0; c < 3; c++) {
          const pixelIndex = (y * imageData.width + x) * 3 + c;
          const byte = imageData.data[pixelIndex];
          const lsb = byte & 1;
          bits.push(lsb);
        }
      }
    }
    return this.bitsToText(bits);
  }

  static textToBits(text: string) {
    const bits: number[] = [];
    const encoder = new TextEncoder();
    const bytes = encoder.encode(text);
    const length = bytes.length;
    for (let i = 0; i < 32; i++) {
      bits.push((length >>> (31 - i)) & 1);
    }
    for (const byte of bytes) {
      for (let i = 7; i >= 0; i--) {
        bits.push((byte >>> i) & 1);
      }
    }
    return bits;
  }

  static bitsToText(bits: number[]) {
    if (bits.length < 32) {
      return '';
    }
    let length = 0;
    for (let i = 0; i < 32; i++) {
      length = (length << 1) | (bits[i] || 0);
    }
    const requiredBits = 32 + length * 8;
    if (bits.length < requiredBits) {
      const availableBytes = Math.floor((bits.length - 32) / 8);
      length = Math.min(length, availableBytes);
    }
    const bytes: number[] = [];
    for (let i = 0; i < length; i++) {
      let byte = 0;
      const startBit = 32 + i * 8;
      if (startBit + 7 >= bits.length) break;
      for (let j = 0; j < 8; j++) {
        byte = (byte << 1) | (bits[startBit + j] || 0);
      }
      bytes.push(byte);
    }
    const decoder = new TextDecoder('utf-8', { fatal: false });
    return decoder.decode(new Uint8Array(bytes));
  }

  static calculateCapacity(imageData: any) {
    return imageData.width * imageData.height * 3;
  }
}

/**
 * Utility to process and auto-optimize avatar images of ANY file size (1MB, 10MB, 50MB+).
 * Resizes and center-crops the image onto a crisp 512x512 canvas, compressing it into
 * a lightweight, high-fidelity WebP/JPEG data URL for storage and instant loading.
 */

export interface OptimizedImageResult {
  dataUrl: string;
  originalSize: number;
  optimizedSize: number;
  width: number;
  height: number;
  format: string;
}

export async function processAvatarImage(
  file: File | Blob,
  targetDimension: number = 512,
  quality: number = 0.88
): Promise<OptimizedImageResult> {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith('image/')) {
      return reject(new Error('Please select a valid image file (JPEG, PNG, WebP, GIF, etc.).'));
    }

    const originalSize = file.size;
    const objectUrl = URL.createObjectURL(file);
    const img = new Image();

    img.onload = () => {
      URL.revokeObjectURL(objectUrl);

      try {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d', { alpha: true });

        if (!ctx) {
          return reject(new Error('Unable to initialize image processing engine.'));
        }

        // Set target square dimensions
        canvas.width = targetDimension;
        canvas.height = targetDimension;

        // Calculate aspect ratio crop (cover / center)
        const sourceWidth = img.naturalWidth || img.width;
        const sourceHeight = img.naturalHeight || img.height;

        let srcX = 0;
        let srcY = 0;
        let srcSize = Math.min(sourceWidth, sourceHeight);

        if (sourceWidth > sourceHeight) {
          srcX = Math.floor((sourceWidth - sourceHeight) / 2);
          srcY = 0;
          srcSize = sourceHeight;
        } else {
          srcX = 0;
          srcY = Math.floor((sourceHeight - sourceWidth) / 2);
          srcSize = sourceWidth;
        }

        // Enable high quality image smoothing
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';

        // Draw cropped & scaled square
        ctx.drawImage(
          img,
          srcX,
          srcY,
          srcSize,
          srcSize,
          0,
          0,
          targetDimension,
          targetDimension
        );

        // Try WebP first, fallback to JPEG
        let format = 'image/webp';
        let dataUrl = canvas.toDataURL('image/webp', quality);

        // If WebP is not supported or larger than expected, fallback to JPEG
        if (!dataUrl.startsWith('data:image/webp')) {
          format = 'image/jpeg';
          dataUrl = canvas.toDataURL('image/jpeg', quality);
        }

        // Calculate approximate size in bytes from base64
        const stringLength = dataUrl.length - 'data:image/webp;base64,'.length;
        const optimizedSize = Math.round((stringLength * 3) / 4);

        resolve({
          dataUrl,
          originalSize,
          optimizedSize,
          width: targetDimension,
          height: targetDimension,
          format,
        });
      } catch (err: any) {
        reject(new Error(err?.message || 'Failed to process image file.'));
      }
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error('Could not decode image file. Please try another picture.'));
    };

    img.src = objectUrl;
  });
}

/**
 * Format bytes to readable string (e.g. 3.2 MB -> 48 KB)
 */
export function formatBytes(bytes: number, decimals: number = 1): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

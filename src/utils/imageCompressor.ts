/**
 * Client-Side Image Compressor & Resizer Utility
 * Compresses large camera photos (e.g. 5MB-15MB) into lightweight high-quality Web JPEGs (~100-250KB)
 * to prevent upload timeouts and comply with Firebase Storage size limits.
 */
export async function compressImage(
  file: File,
  maxWidth = 1280,
  maxHeight = 1280,
  quality = 0.8
): Promise<File> {
  // If file is not an image, return original
  if (!file.type.startsWith('image/')) {
    return file;
  }

  return new Promise((resolve) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(objectUrl);

      let width = img.width;
      let height = img.height;

      // Calculate proportional new dimensions
      if (width > maxWidth || height > maxHeight) {
        if (width > height) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        } else {
          width = Math.round((width * maxHeight) / height);
          maxHeight = Math.round((height * maxHeight) / height);
          height = maxHeight;
        }
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        resolve(file);
        return;
      }

      // Smooth rendering
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';

      // Draw image onto canvas
      ctx.drawImage(img, 0, 0, width, height);

      canvas.toBlob(
        (blob) => {
          if (!blob) {
            resolve(file);
            return;
          }

          // Create clean compressed File object with .jpg extension
          const cleanName = file.name.replace(/\.[^/.]+$/, '') + '.jpg';
          const compressedFile = new File([blob], cleanName, {
            type: 'image/jpeg',
            lastModified: Date.now(),
          });

          resolve(compressedFile);
        },
        'image/jpeg',
        quality
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      resolve(file); // Fallback to original file on error
    };

    img.src = objectUrl;
  });
}

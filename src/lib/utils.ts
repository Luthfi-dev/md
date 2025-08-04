import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function optimizeImage(file: File, maxWidth: number = 1024, quality: number = 0.8): Promise<File> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const scaleFactor = maxWidth / img.width;
        
        if (scaleFactor >= 1) {
          // Image is smaller than max width, no need to resize
          resolve(file);
          return;
        }

        canvas.width = maxWidth;
        canvas.height = img.height * scaleFactor;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          return reject(new Error('Could not get canvas context'));
        }
        
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

        canvas.toBlob((blob) => {
          if (!blob) {
            return reject(new Error('Canvas toBlob failed'));
          }
          const newFile = new File([blob], file.name, {
            type: `image/${file.type.split('/')[1] || 'jpeg'}`,
            lastModified: Date.now(),
          });
          resolve(newFile);
        }, `image/${file.type.split('/')[1] || 'jpeg'}`, quality);
      };
      img.onerror = reject;
      img.src = event.target?.result as string;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/**
 * Gets a cookie by name from the browser's document.cookie.
 * @param name The name of the cookie to retrieve.
 * @returns The cookie value or an empty string if not found.
 */
export function getCookie(name: string): string {
  if (typeof document === 'undefined') {
    return '';
  }
  const nameEQ = name + "=";
  const ca = document.cookie.split(';');
  for(let i=0;i < ca.length;i++) {
    let c = ca[i];
    while (c.charAt(0)==' ') c = c.substring(1,c.length);
    if (c.indexOf(nameEQ) == 0) return c.substring(nameEQ.length,c.length);
  }
  return '';
}

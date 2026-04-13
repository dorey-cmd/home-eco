export const resizeImage = (file: File, maxWidth: number = 400, maxHeight: number = 400): Promise<File> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = reject;
    reader.onload = (e) => {
      const img = new Image();
      img.onerror = reject;
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        // Calculate aspect ratio
        if (width > height) {
          if (width > maxWidth) {
            height = Math.round((height *= maxWidth / width));
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = Math.round((width *= maxHeight / height));
            height = maxHeight;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          return reject(new Error('Canvas context is null'));
        }

        ctx.drawImage(img, 0, 0, width, height);
        
        // Convert back to file as medium quality JPEG
        canvas.toBlob(
          (blob) => {
            if (!blob) return reject(new Error('Canvas to Blob failed'));
            const newFile = new File([blob], file.name.replace(/\.[^/.]+$/, "") + ".jpg", {
              type: 'image/jpeg',
              lastModified: Date.now(),
            });
            resolve(newFile);
          },
          'image/jpeg',
          0.7
        );
      };
      
      if (typeof e.target?.result === 'string') {
          img.src = e.target.result;
      }
    };
    reader.readAsDataURL(file);
  });
};

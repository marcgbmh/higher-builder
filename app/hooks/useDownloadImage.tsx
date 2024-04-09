"use client";

import { useCallback } from "react";

export function useDownloadImage() {
  const downloadCombinedImage = useCallback(() => {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    canvas.width = 480; // Adjust based on your actual image size
    canvas.height = 480;

    const loadImage = (src) =>
      new Promise((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = "Anonymous"; // Handle CORS if your images are served from an external source
        img.onload = () => resolve(img);
        img.onerror = reject;
        img.src = src;
      });

    Promise.all([
      loadImage("/default.png"), // higher symbol
      loadImage("/default.png"), // green overlay
      loadImage("/default.png"), // user image
    ])
      .then((images) => {
        images.forEach((img) =>
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
        );
        const dataUrl = canvas.toDataURL("image/png");
        const link = document.createElement("a");
        link.download = "combined-image.png";
        link.href = dataUrl;
        document.body.appendChild(link); // Append to body to ensure visibility in some browsers
        link.click();
        document.body.removeChild(link); // Clean up
      })
      .catch(console.error);
  }, []);

  return downloadCombinedImage;
}

export default useDownloadImage;

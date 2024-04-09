"use client";

import { useCallback } from "react";

export function useDownloadImage() {
  const downloadCombinedImage = useCallback(() => {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      console.error("Failed to get canvas context");
      return; // Early return if ctx is null
    }
    canvas.width = 480; // Adjust based on your actual image size
    canvas.height = 480;

    const loadImage = (src: string) =>
      new Promise<HTMLImageElement>((resolve, reject) => {
        // Specify the promise to resolve with HTMLImageElement
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
        images.forEach((img) => {
          if (ctx) {
            ctx.drawImage(
              img as CanvasImageSource,
              0,
              0,
              canvas.width,
              canvas.height
            ); // Assert img as CanvasImageSource
          }
        });
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

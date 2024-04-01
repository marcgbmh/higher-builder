import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function Home() {
  const downloadCombinedImage = () => {
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
  };

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="flex flex-col items-center justify-center space-y-4">
        <div className="w-full bg-blue-500 text-white text-center p-4 flex items-center">
          <Input className="h-14" />
          <Button variant="default" size="lg">
            upload
          </Button>
        </div>
        <div className="flex w-full">
          <div className="flex-1 bg-green-500 text-white text-center p-4">
            <div className="relative w-[48rem] h-[48rem]">
              <img
                src="/default.png"
                alt="Logo"
                className="absolute inset-0 w-full h-full object-cover"
              />
              <img
                src="/default.png"
                alt="Overlay"
                className="absolute inset-0 w-full h-full object-cover"
              />
              <img
                src="/default.png"
                alt="User Image"
                className="absolute inset-0 w-full h-full object-cover"
              />
            </div>
          </div>
          <div className="w-1/6 bg-red-500 text-white text-center p-4">
            <img src="/default.png" alt="Logo" className="w-[8rem]" />
            <img src="/default.png" alt="Logo" className="w-[8rem]" />
            <img src="/default.png" alt="Logo" className="w-[8rem]" />
            <img src="/default.png" alt="Logo" className="w-[8rem]" />
          </div>
        </div>
        <div className="w-full bg-yellow-500 text-white text-center p-4">
          <Button size="lg" variant="default">
            download
          </Button>
          <Button size="lg" variant="default">
            mint
          </Button>
          <Button size="lg" variant="default">
            post
          </Button>
        </div>
      </div>
    </div>
  );
}

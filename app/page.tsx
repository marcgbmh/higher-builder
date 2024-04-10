"use client";

import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState, useEffect, useRef } from "react";
import { redirect } from "next/navigation";
import { put } from "@vercel/blob";
import { useRouter } from "next/navigation";

interface Overlay {
  src: string;
  opacity: number;
}

type OverlayTrigger = "trigger1" | "trigger2" | "trigger3" | "trigger4";

export default function Home() {
  const [overlays, setOverlays] = useState<Overlay[]>([]);
  const [baseImageUrl, setBaseImageUrl] = useState("/default.png");
  const [selectedTrigger, setSelectedTrigger] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [mintLink, setMintLink] = useState("");
  const [postLink, setPostLink] = useState("");
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const uploadImageToVercel = async (imageBlob: Blob) => {
    const fileName = `${Date.now()}-image.png`;
    const filePath = `images/${fileName}`;

    const vercelToken =
      "vercel_blob_rw_JFsKqoWUyqEt5dyT_AqkNXKkISBpwr8FcNXyKnb0htZXpjH";

    const { url } = await put(filePath, imageBlob, {
      access: "public",
      token: vercelToken,
    });

    if (!url) {
      throw new Error("Upload failed");
    }

    return url;
  };
  const processImage = async (
    action: "download" | "blob"
  ): Promise<Blob | void> => {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    canvas.width = 1000;
    canvas.height = 1000;

    const loadImage = (src: string) =>
      new Promise<HTMLImageElement>((resolve, reject) => {
        const img = new window.Image();
        img.crossOrigin = "Anonymous";
        img.onload = () => resolve(img);
        img.onerror = reject;
        img.src = src;
      });

    try {
      const images = await Promise.all([
        loadImage(baseImageUrl), // Load the base image
        ...overlays.map((overlay) => loadImage(overlay.src)), // Load each overlay
      ]);

      const [baseImage, ...overlayImages] = images;

      // Calculate the scale factor to fit the base image within the canvas
      const scaleFactor = Math.max(
        canvas.width / baseImage.width,
        canvas.height / baseImage.height
      );

      // Calculate the scaled dimensions of the base image
      const scaledWidth = baseImage.width * scaleFactor;
      const scaledHeight = baseImage.height * scaleFactor;

      // Calculate the position to center the base image
      const offsetX = (canvas.width - scaledWidth) / 2;
      const offsetY = (canvas.height - scaledHeight) / 2;

      // Draw the base image on the canvas
      ctx!.drawImage(baseImage, offsetX, offsetY, scaledWidth, scaledHeight);

      // Then draw each overlay
      overlayImages.forEach((img, index) => {
        ctx!.globalAlpha = overlays[index].opacity; // Set the globalAlpha to the overlay's opacity

        let x, y, overlayWidth, overlayHeight;

        // Check if the overlay is the arrow and should be kept at specific size
        if (overlays[index].src.includes("arrow.png")) {
          // Set the arrow size as specified
          overlayWidth = 450.26;
          overlayHeight = 479.74;
          x = (canvas.width - overlayWidth) / 2;
          y = (canvas.height - overlayHeight) / 2;
        } else {
          // For other overlays, you might want to scale them or handle differently
          // This example stretches them to cover the canvas, but you can adjust as needed
          overlayWidth = canvas.width;
          overlayHeight = canvas.height;
          x = 0;
          y = 0;
        }

        ctx!.drawImage(img, x, y, overlayWidth, overlayHeight); // Draw the overlay
      });
      ctx!.globalAlpha = 1;

      if (action === "download") {
        const dataUrl = canvas.toDataURL("image/png");
        const link = document.createElement("a");
        link.download = "combined-image.png";
        link.href = dataUrl;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } else if (action === "blob") {
        return new Promise((resolve, reject) => {
          canvas.toBlob((blob) => {
            if (blob) {
              resolve(blob);
            } else {
              reject(new Error("Blob generation failed"));
            }
          }, "image/png");
        });
      }
    } catch (error) {
      console.error(error);
      if (action === "blob") {
        return Promise.reject(error);
      }
    }
  };

  const overlaySets = {
    trigger1: [{ src: "/arrow.png", opacity: 0.6 }],
    trigger3: [
      { src: "/green_overlay.png", opacity: 0.6 },
      { src: "/arrow.png", opacity: 0.6 },
    ],
    trigger2: [{ src: "/arrow.png", opacity: 1 }],
    trigger4: [
      { src: "/green_overlay.png", opacity: 0.6 },
      { src: "/arrow.png", opacity: 1 },
    ],
  };

  useEffect(() => {
    setOverlays(overlaySets["trigger1"]);
  }, []);

  const selectOverlaySet = (triggerKey: OverlayTrigger) => {
    setOverlays(overlaySets[triggerKey]);
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const imageUrl = URL.createObjectURL(file);
      setBaseImageUrl(imageUrl);
    }
  };

  const handleBaseImageUrlChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const newValue = event.target.value;
    if (newValue === "") {
      setBaseImageUrl("/default.png");
    } else {
      setBaseImageUrl(newValue);
    }
  };

  const handleMintOrPostClick = async (action: "mint" | "post") => {
    setIsLoading(true);
    const blob = await processImage("blob");

    if (!blob) {
      console.error("Failed to generate image blob");
      return;
    }

    try {
      const imageUrl = await uploadImageToVercel(blob);
      const encodedImageUrl = encodeURIComponent(imageUrl);
      if (action === "mint") {
        setIsLoading(false);
        window.open(
          `https://zora.co/create/edition?image=${encodedImageUrl}`,
          "_blank"
        );
      } else if (action === "post") {
        setIsLoading(false);
        window.open(
          `https://warpcast.com/~/compose?text=Hello%20world!&embeds[]=${encodedImageUrl}`,
          "_blank"
        );
      }
    } catch (error) {
      setIsLoading(false);
      console.error("Failed to upload image: ", error);
    }
  };

  return (
    <div>
      <img
        src="/clouds.jpg"
        alt="Clouds"
        style={{
          width: "100%",
          height: "100%",
          objectFit: "cover", // Cover the div area without losing aspect ratio
          position: "absolute", // Position it similarly to a background image
          zIndex: -1, // Ensure it stays behind other content
        }}
      />
      <nav className="hidden md:block text-white p-4 absolute ">
        <Image
          src="/logo.png"
          alt="Logo"
          width={50}
          height={50}
          className="rounded-full"
        />
      </nav>
      <div className="flex min-h-screen items-center justify-center">
        <div className="max-w-xl mx-auto w-full ">
          <div className="flex flex-col items-center h-[100vh] w-[100vw]  md:h-[100%] md:w-[100%]  justify-center space-y-4 bg-white/30 p-4 backdrop-blur-lg ">
            <div className="w-full text-white text-center flex flex-col sm:flex-row items-center gap-4 0">
              <Input
                type="text"
                value={baseImageUrl !== "/default.png" ? baseImageUrl : ""}
                onChange={handleBaseImageUrlChange}
                className="h-16 w-full sm:w-1/2 text-lg border-none bg-black/50 placeholder:text-gray-400 ring-offset-2 ring-blue-600 p-4"
                placeholder="enter image url..."
              />
              <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                onChange={handleFileChange}
                accept="image/*"
              />
              <Button
                variant="outline"
                size="lg"
                className="w-full sm:w-1/2 bg-neutral-700/90 hover:bg-neutral-700/100"
                onClick={() => fileInputRef.current?.click()}
              >
                upload image
              </Button>
            </div>
            <div>
              <div className="grid grid-cols-5 gap-4 ">
                <div className="col-span-4 relative">
                  {overlays.map((overlay, index) => (
                    <img
                      key={index}
                      src={overlay.src}
                      alt={`Overlay ${index + 1}`}
                      className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10 object-cover ${
                        overlay.src === "/green_overlay.png"
                          ? "w-full"
                          : "w-1/2"
                      } `}
                      style={{ opacity: overlay.opacity, height: "auto" }}
                    />
                  ))}
                  <img
                    src={baseImageUrl}
                    alt="Base Image"
                    className="absolute inset-0 w-full h-full object-cover 
                    
                    "
                  />
                </div>
                <div className="col-span-1 grid grid-rows-4 gap-4">
                  {[
                    { trigger: "trigger1", src: "/1.png" },
                    { trigger: "trigger2", src: "/2.png" },
                    { trigger: "trigger3", src: "/3.png" },
                    { trigger: "trigger4", src: "/4.png" },
                  ].map(({ trigger, src }, index) => (
                    <img
                      key={index}
                      src={src}
                      alt={`Trigger ${index + 1}`}
                      className={`object-cover cursor-pointer  ${
                        selectedTrigger === trigger
                          ? "border-4 border-green-500"
                          : ""
                      }`}
                      onClick={() =>
                        selectOverlaySet(trigger as OverlayTrigger)
                      }
                    />
                  ))}
                </div>
              </div>
            </div>
            <div className="w-full flex flex-col sm:flex-row justify-between text-white text-center gap-4">
              <Button
                size="lg"
                variant="default"
                className="w-full bg-[#018A08]/80 hover:bg-[#018A08]/100"
                onClick={() => processImage("download")}
              >
                download
              </Button>
              <Button
                size="lg"
                variant="default"
                className="w-full bg-blue-700 hover:bg-blue-800 relative"
                onClick={() => handleMintOrPostClick("mint")}
                disabled={isLoading}
              >
                {isLoading ? (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <p className="pr-2">mint</p>
                    <svg
                      className="animate-spin h-5 w-5 text-white"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                  </div>
                ) : (
                  <div className="flex items-center justify-center">
                    <p>mint</p>
                  </div>
                )}
              </Button>
              {/* <Button
                onClick={() => handleMintOrPostClick("post")}
                size="lg"
                variant="default"
                className="w-full bg-purple-700 hover:bg-purple-800"
              >
                post
              </Button> */}
            </div>
          </div>
        </div>
      </div>
      <footer className="p-4 text-grey absolute bottom-0 w-full text-white hidden md:block">
        <div className="flex justify-between ">
          <div>↑ 2024 higher technology</div>
          <div className="flex gap-4">
            <a href="https://zora.co/explore/higher" target="blank">
              zora
            </a>
            <a href="https://warpcast.com/~/channel/higher" target="blank">
              warpcast
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}

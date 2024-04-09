"use client";

import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState, useEffect, useRef } from "react";
import { redirect } from "next/navigation";
import { put } from "@vercel/blob";

export default function Home() {
  const [overlays, setOverlays] = useState([]);
  const [baseImageUrl, setBaseImageUrl] = useState("/default.png");
  const [selectedTrigger, setSelectedTrigger] = useState("");
  const fileInputRef = useRef(null);

  const uploadImageToVercel = async (imageBlob) => {
    const fileName = `${Date.now()}-image.png`;

    const filePath = `images/${fileName}`;

    const { url } = await put(filePath, imageBlob, { access: "public" });

    if (!url) {
      throw new Error("Upload failed");
    }

    return url;
  };

  const downloadCombinedImage = () => {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    canvas.width = 1000;
    canvas.height = 1000;

    const loadImage = (src) =>
      new Promise((resolve, reject) => {
        const img = new window.Image();
        img.crossOrigin = "Anonymous";
        img.onload = () => resolve(img);
        img.onerror = reject;
        img.src = src;
      });

    const updateButtonLinks = (imageUrl) => {
      setMintLink(
        `https://zora.co/create/edition?image=${encodeURIComponent(imageUrl)}`
      );
      setPostLink(
        `https://warpcast.com/~/compose?text=↑%20higher&embeds[]=${encodeURIComponent(
          imageUrl
        )}`
      );
    };

    Promise.all([
      loadImage(baseImageUrl), // Load the base image
      ...overlays.map((overlay) => loadImage(overlay.src)), // Load each overlay
    ])
      .then(([baseImage, ...overlayImages]) => {
        // Draw the base image first
        ctx.drawImage(baseImage, 0, 0, canvas.width, canvas.height);

        // Then draw each overlay
        overlayImages.forEach((img, index) => {
          ctx.globalAlpha = overlays[index].opacity; // Set the globalAlpha to the overlay's opacity

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

          ctx.drawImage(img, x, y, overlayWidth, overlayHeight); // Draw the overlay
        });
        ctx.globalAlpha = 1; // Reset the globalAlpha to default

        // Proceed to create a link and trigger the download
        const dataUrl = canvas.toDataURL("image/png");
        const link = document.createElement("a");
        link.download = "combined-image.png";
        link.href = dataUrl;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      })
      .catch(console.error);
  };
  const overlaySets = {
    trigger1: [{ src: "/arrow.png", opacity: 0.6 }],
    trigger2: [
      { src: "/green_overlay.png", opacity: 0.6 },
      { src: "/arrow.png", opacity: 0.6 },
    ],
    trigger3: [{ src: "/arrow.png", opacity: 1 }],
    trigger4: [
      { src: "/green_overlay.png", opacity: 0.6 },
      { src: "/arrow.png", opacity: 1 },
    ],
  };

  useEffect(() => {
    setOverlays(overlaySets["trigger1"]);
  }, []);

  const selectOverlaySet = (triggerKey) => {
    setOverlays(overlaySets[triggerKey]);
  };

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      const imageUrl = URL.createObjectURL(file);
      setBaseImageUrl(imageUrl);
    }
  };

  const handleBaseImageUrlChange = (event) => {
    const newValue = event.target.value;
    if (newValue === "") {
      setBaseImageUrl("/default.png");
    } else {
      setBaseImageUrl(newValue);
    }
  };

  const handleMintOrPostClick = async () => {
    const canvas = document.createElement("canvas");

    canvas.toBlob(async (blob) => {
      try {
        const imageUrl = await uploadImageToVercel(blob);
        if (action === "mint") {
          router.push(`/mint?image=${encodeURIComponent(imageUrl)}`);
        } else if (action === "post") {
          router.push(`/post?image=${encodeURIComponent(imageUrl)}`);
        }
      } catch (error) {
        console.error("Failed to upload image: ", error);
      }
    }, "image/png");
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
      <div className="flex min-h-screen items-center justify-center ">
        <div className="max-w-xl mx-auto w-full ">
          <div className="flex flex-col items-center h-[100vh] w-[100vw]  md:h-[100%] md:w-[100%]  justify-center space-y-4 bg-white/30 p-4 backdrop-blur-lg">
            <div className="w-full text-white text-center flex flex-col sm:flex-row items-center gap-4">
              <Input
                type="text"
                value={baseImageUrl !== "/default.png" ? baseImageUrl : ""}
                onChange={handleBaseImageUrlChange}
                className="h-16 w-full sm:w-1/2 text-xl border-none bg-black/50 placeholder:text-gray-400 ring-offset-2 ring-blue-600 p-4 rounded-md"
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
                className="w-full sm:w-1/2"
                onClick={() => fileInputRef.current.click()}
              >
                upload image
              </Button>
            </div>
            <div className="flex w-full gap-4 ">
              <div className="flex-grow relative aspect-square">
                {overlays.map((overlay, index) => (
                  <img
                    key={index}
                    src={overlay.src}
                    alt={`Overlay ${index + 1}`}
                    className={`absolute top-1/2 left-1/2 rounded-lg -translate-x-1/2 -translate-y-1/2 z-10 object-cover ${
                      overlay.src === "/green_overlay.png" ? "w-full" : "w-1/2"
                    } rounded-lg`}
                    style={{ opacity: overlay.opacity, height: "auto" }}
                  />
                ))}
                <img
                  src={baseImageUrl}
                  alt="Base Image"
                  className="absolute inset-0 w-full h-full object-cover rounded-lg" // Added rounded-lg here
                />
              </div>
              <div className="flex-col w-1/6  flex justify-between gap-4">
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
                    className={`object-cover rounded-md cursor-pointer rounded-lg ${
                      selectedTrigger === trigger
                        ? "border-4 border-green-500"
                        : ""
                    }`} // Step 3: Apply conditional class
                    onClick={() => selectOverlaySet(trigger)}
                  />
                ))}
              </div>
            </div>
            <div className="w-full flex flex-col sm:flex-row justify-between text-white text-center gap-4">
              <Button
                size="lg"
                variant="default"
                className="w-full bg-[#018A08]/80 hover:bg-[#018A08]/90"
                onClick={downloadCombinedImage}
              >
                download
              </Button>
              <Button
                onClick={handleMintOrPostClick}
                size="lg"
                variant="default"
                className="w-full bg-blue-700"
              >
                mint
              </Button>
              <Button
                onClick={handleMintOrPostClick}
                size="lg"
                variant="default"
                className="w-full bg-purple-700"
              >
                post
              </Button>
            </div>
          </div>
        </div>
      </div>
      <footer className="p-4 text-grey absolute bottom-0 w-full text-white hidden md:block">
        <div className="flex justify-between ">
          <div>↑ 2024 higher technology</div>
          <div className="flex gap-4">
            <a href="hi">zora</a>
            <a href="hi">warpcast</a>
          </div>
        </div>
      </footer>
    </div>
  );
}

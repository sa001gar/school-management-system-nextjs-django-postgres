"use client";

import React, { useState, useRef, useCallback } from "react";
import ReactCrop, {
  Crop,
  PixelCrop,
  centerCrop,
  makeAspectCrop,
} from "react-image-crop";
import imageCompression from "browser-image-compression";
import { Camera, X, Check, RotateCcw } from "lucide-react";
import { Button } from "./button";
import { Modal, ModalFooter } from "./modal";
import "react-image-crop/dist/ReactCrop.css";

interface ImageCropperProps {
  currentImage?: string | null;
  onImageChange: (file: File | null, preview: string | null) => void;
  disabled?: boolean;
}

// Generate secure random filename to prevent directory traversal
function generateSecureFilename(originalName: string): string {
  const timestamp = Date.now();
  const randomString = crypto.randomUUID().replace(/-/g, "");
  const extension = originalName.split(".").pop()?.toLowerCase() || "jpg";
  return `student_${timestamp}_${randomString.substring(0, 12)}.${extension}`;
}

// Compress image to target size
async function compressImage(
  file: File,
  targetSizeKB: number = 100
): Promise<File> {
  const options = {
    maxSizeMB: targetSizeKB / 1024,
    maxWidthOrHeight: 500,
    useWebWorker: true,
    fileType: "image/jpeg" as const,
  };

  try {
    const compressedFile = await imageCompression(file, options);
    // Rename with secure filename
    const secureFilename = generateSecureFilename(file.name);
    return new File([compressedFile], secureFilename, {
      type: compressedFile.type,
    });
  } catch (error) {
    console.error("Image compression failed:", error);
    throw error;
  }
}

// Get cropped image as blob
function getCroppedImg(
  image: HTMLImageElement,
  crop: PixelCrop,
  filename: string
): Promise<File> {
  const canvas = document.createElement("canvas");
  const scaleX = image.naturalWidth / image.width;
  const scaleY = image.naturalHeight / image.height;

  canvas.width = crop.width;
  canvas.height = crop.height;

  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Failed to get canvas context");

  ctx.drawImage(
    image,
    crop.x * scaleX,
    crop.y * scaleY,
    crop.width * scaleX,
    crop.height * scaleY,
    0,
    0,
    crop.width,
    crop.height
  );

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error("Canvas toBlob failed"));
          return;
        }
        const file = new File([blob], filename, { type: "image/jpeg" });
        resolve(file);
      },
      "image/jpeg",
      0.95
    );
  });
}

function centerAspectCrop(
  mediaWidth: number,
  mediaHeight: number,
  aspect: number
) {
  return centerCrop(
    makeAspectCrop(
      {
        unit: "%",
        width: 90,
      },
      aspect,
      mediaWidth,
      mediaHeight
    ),
    mediaWidth,
    mediaHeight
  );
}

export function ImageCropper({
  currentImage,
  onImageChange,
  disabled = false,
}: ImageCropperProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [imgSrc, setImgSrc] = useState<string>("");
  const [crop, setCrop] = useState<Crop>();
  const [completedCrop, setCompletedCrop] = useState<PixelCrop>();
  const [isProcessing, setIsProcessing] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const onSelectFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];

      // Validate file type
      if (!file.type.startsWith("image/")) {
        alert("Please select an image file");
        return;
      }

      // Validate file size (max 10MB for initial upload)
      if (file.size > 10 * 1024 * 1024) {
        alert("Image size should be less than 10MB");
        return;
      }

      const reader = new FileReader();
      reader.addEventListener("load", () => {
        setImgSrc(reader.result?.toString() || "");
        setIsModalOpen(true);
      });
      reader.readAsDataURL(file);
    }
  };

  const onImageLoad = useCallback(
    (e: React.SyntheticEvent<HTMLImageElement>) => {
      const { width, height } = e.currentTarget;
      setCrop(centerAspectCrop(width, height, 1));
    },
    []
  );

  const handleCropComplete = async () => {
    if (!imgRef.current || !completedCrop || completedCrop.width === 0) {
      alert("Please select a crop area");
      return;
    }

    setIsProcessing(true);
    try {
      // Get cropped image
      const croppedFile = await getCroppedImg(
        imgRef.current,
        completedCrop,
        "cropped.jpg"
      );

      // Compress to 100KB
      const compressedFile = await compressImage(croppedFile, 100);

      // Create preview URL
      const previewUrl = URL.createObjectURL(compressedFile);

      onImageChange(compressedFile, previewUrl);
      setIsModalOpen(false);
      setImgSrc("");
      setCrop(undefined);
      setCompletedCrop(undefined);
    } catch (error) {
      console.error("Error processing image:", error);
      alert("Failed to process image. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRemoveImage = () => {
    onImageChange(null, null);
    if (inputRef.current) {
      inputRef.current.value = "";
    }
  };

  const handleCancel = () => {
    setIsModalOpen(false);
    setImgSrc("");
    setCrop(undefined);
    setCompletedCrop(undefined);
    if (inputRef.current) {
      inputRef.current.value = "";
    }
  };

  return (
    <>
      <div className="shrink-0">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Photo
        </label>
        <div className="relative">
          {currentImage ? (
            <div className="relative w-24 h-24 rounded-lg overflow-hidden border-2 border-amber-200 group">
              <img
                src={currentImage}
                alt="Profile"
                className="w-full h-full object-cover"
              />
              {!disabled && (
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1">
                  <button
                    type="button"
                    onClick={() => inputRef.current?.click()}
                    className="p-1.5 bg-white rounded-full text-gray-700 hover:bg-gray-100"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={handleRemoveImage}
                    className="p-1.5 bg-red-500 rounded-full text-white hover:bg-red-600"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>
          ) : (
            <label
              className={`flex flex-col items-center justify-center w-24 h-24 border-2 border-dashed border-gray-300 rounded-lg transition-colors ${
                disabled
                  ? "opacity-50 cursor-not-allowed"
                  : "cursor-pointer hover:border-amber-400 hover:bg-amber-50"
              }`}
            >
              <Camera className="w-6 h-6 text-gray-400" />
              <span className="text-xs text-gray-500 mt-1">Upload</span>
              {!disabled && (
                <input
                  ref={inputRef}
                  type="file"
                  accept="image/*"
                  onChange={onSelectFile}
                  className="hidden"
                />
              )}
            </label>
          )}
          {!currentImage && !disabled && (
            <input
              ref={inputRef}
              type="file"
              accept="image/*"
              onChange={onSelectFile}
              className="hidden"
            />
          )}
        </div>
      </div>

      {/* Crop Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={handleCancel}
        title="Crop Profile Picture"
        size="md"
      >
        <div className="p-4">
          {imgSrc && (
            <div className="flex flex-col items-center">
              <p className="text-sm text-gray-500 mb-3">
                Drag to reposition. Image will be compressed to ~100KB.
              </p>
              <div className="max-h-[400px] overflow-auto">
                <ReactCrop
                  crop={crop}
                  onChange={(_, percentCrop) => setCrop(percentCrop)}
                  onComplete={(c) => setCompletedCrop(c)}
                  aspect={1}
                  circularCrop={false}
                >
                  <img
                    ref={imgRef}
                    alt="Crop preview"
                    src={imgSrc}
                    onLoad={onImageLoad}
                    className="max-w-full"
                  />
                </ReactCrop>
              </div>
            </div>
          )}
        </div>
        <ModalFooter>
          <Button
            variant="outline"
            onClick={handleCancel}
            disabled={isProcessing}
          >
            Cancel
          </Button>
          <Button
            onClick={handleCropComplete}
            isLoading={isProcessing}
            disabled={isProcessing || !completedCrop}
            className="bg-amber-600 hover:bg-amber-700"
          >
            <Check className="w-4 h-4 mr-2" />
            Apply
          </Button>
        </ModalFooter>
      </Modal>
    </>
  );
}

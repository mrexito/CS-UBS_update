"use client";

import { CldImage } from "next-cloudinary";

type CloudinaryProps = {
  className?: string;
  alt?: string;
};

export default function CloudinaryAsset({ className = "", alt = "Archival still" }: CloudinaryProps) {
  return (
    <CldImage
      src="https://res.cloudinary.com/dymwgac6m/image/upload/v1767463727/ChatGPT_Image_3._Jan._2026_19_08_32_soztd2.png"
      width="1200"
      height="800"
      crop="fill"
      gravity="auto"
      quality="auto"
      format="auto"
      alt={alt}
      className={className}
      priority
    />
  );
}
import Image from "next/image";
import { Pizza } from "lucide-react";
import { imageUrl } from "@/lib/cloudinary";
import { cn } from "@/lib/utils";

/** Product image from Cloudinary (already resized there), with a placeholder when missing. */
export function FoodImage({
  publicId,
  alt,
  size = 400,
  className,
}: {
  publicId: string | null | undefined;
  alt: string;
  size?: number;
  className?: string;
}) {
  const src = imageUrl(publicId, size);
  if (!src) {
    return (
      <div className={cn("flex items-center justify-center bg-brand-soft text-brand/50", className)}>
        <Pizza className="h-1/3 w-1/3" />
      </div>
    );
  }
  return <Image src={src} alt={alt} width={size} height={size} className={cn("object-cover", className)} unoptimized />;
}

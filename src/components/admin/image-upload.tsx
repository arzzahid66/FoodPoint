"use client";

import * as React from "react";
import { ImagePlus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { FoodImage } from "@/components/food-image";

const MAX_BYTES = 5 * 1024 * 1024;

/** Uploads an image straight to Cloudinary and stores its public id in a hidden input named `name`. */
export function ImageUpload({ name, defaultValue }: { name: string; defaultValue?: string | null }) {
  const [publicId, setPublicId] = React.useState(defaultValue ?? "");
  const [uploading, setUploading] = React.useState(false);
  const inputRef = React.useRef<HTMLInputElement>(null);

  async function upload(file: File) {
    if (!file.type.startsWith("image/")) return toast.error("Please choose an image file");
    if (file.size > MAX_BYTES) return toast.error("Image must be smaller than 5 MB");
    setUploading(true);
    try {
      const signRes = await fetch("/api/cloudinary/sign", { method: "POST" });
      const sign = await signRes.json();
      if (!signRes.ok) throw new Error(sign.error ?? "Could not start upload");

      const body = new FormData();
      body.append("file", file);
      body.append("api_key", sign.apiKey);
      body.append("timestamp", String(sign.timestamp));
      body.append("signature", sign.signature);
      body.append("folder", sign.folder);
      const res = await fetch(`https://api.cloudinary.com/v1_1/${sign.cloudName}/image/upload`, { method: "POST", body });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error?.message ?? "Upload failed");
      setPublicId(data.public_id);
      toast.success("Image uploaded");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <div className="flex items-center gap-4">
      <input type="hidden" name={name} value={publicId} />
      <FoodImage publicId={publicId || null} alt="" size={200} className="h-24 w-24 shrink-0 rounded-xl border border-zinc-200" />
      <div className="flex flex-col gap-2">
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) void upload(file);
          }}
        />
        <Button type="button" variant="outline" size="sm" disabled={uploading} onClick={() => inputRef.current?.click()}>
          <ImagePlus className="h-4 w-4" />
          {uploading ? "Uploading..." : publicId ? "Change image" : "Upload image"}
        </Button>
        {publicId && (
          <Button type="button" variant="ghost" size="sm" onClick={() => setPublicId("")}>
            <Trash2 className="h-4 w-4" /> Remove
          </Button>
        )}
      </div>
    </div>
  );
}

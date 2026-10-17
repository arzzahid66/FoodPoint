const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;

/** Build a delivery URL for a Cloudinary public id, resized and auto-formatted. */
export function imageUrl(publicId: string | null | undefined, width = 600) {
  if (!publicId || !cloudName) return null;
  return `https://res.cloudinary.com/${cloudName}/image/upload/c_fill,f_auto,q_auto,w_${width},h_${width}/${publicId}`;
}

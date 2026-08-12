import Image from "next/image";

type ResponsiveWatchImageProps = {
  src: string;
  alt: string;
  sizes: string;
  priority?: boolean;
  className?: string;
  fit?: "cover" | "contain";
};

export default function ResponsiveWatchImage({
  src,
  alt,
  sizes,
  priority = false,
  className,
  fit = "cover",
}: ResponsiveWatchImageProps) {
  return (
    <Image
      src={src}
      alt={alt}
      fill
      sizes={sizes}
      priority={priority}
      quality={priority ? 92 : 86}
      unoptimized={src.startsWith("/api/product-images/")}
      className={className}
      style={{ objectFit: fit, objectPosition: "center" }}
    />
  );
}

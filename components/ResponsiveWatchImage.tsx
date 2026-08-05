import Image from "next/image";

type ResponsiveWatchImageProps = {
  src: string;
  alt: string;
  sizes: string;
  priority?: boolean;
  className?: string;
};

export default function ResponsiveWatchImage({
  src,
  alt,
  sizes,
  priority = false,
  className,
}: ResponsiveWatchImageProps) {
  return (
    <Image
      src={src}
      alt={alt}
      fill
      sizes={sizes}
      priority={priority}
      quality={priority ? 92 : 86}
      className={className}
    />
  );
}

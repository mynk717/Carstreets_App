'use client';

interface CarImageProps {
  src: string;
  alt: string;
  className?: string;
}

export function CarImage({ src, alt, className }: CarImageProps) {
  return (
    <img
      src={src}
      alt={alt}
      className={className}
      onError={(e) => {
        (e.target as HTMLImageElement).src = '/placeholder-car.jpg';
      }}
    />
  );
}

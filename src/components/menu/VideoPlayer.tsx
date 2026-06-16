"use client"

import { useEffect, useRef } from "react"

interface Props {
  src: string | null
  poster: string | null
  className?: string
}

export default function VideoPlayer({ src, poster, className = "" }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null)

  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          video.play().catch(() => {
            // Autoplay blocked — leave paused, user can tap
          })
        } else {
          video.pause()
        }
      },
      { threshold: 0.5 }
    )

    observer.observe(video)
    return () => observer.disconnect()
  }, [src])

  if (!src) {
    return (
      <div
        className={`absolute inset-0 bg-surface-muted ${className}`}
        style={
          poster
            ? {
                backgroundImage: `url(${poster})`,
                backgroundSize: "cover",
                backgroundPosition: "center",
              }
            : undefined
        }
      />
    )
  }

  return (
    <video
      ref={videoRef}
      src={src}
      poster={poster ?? undefined}
      loop
      muted
      playsInline
      preload="metadata"
      className={`absolute inset-0 h-full w-full object-cover ${className}`}
    />
  )
}

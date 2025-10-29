"use client"
import React, { useState, useEffect } from 'react'
import Image from 'next/image'
import styles from './Carousel.module.css'

interface CarouselProps {
  photos: string[]
  interval?: number 
}

export const Carousel: React.FC<CarouselProps> = ({
  photos,
  interval = 5000
}) => {
  const [current, setCurrent] = useState(0)

  useEffect(() => {
    if (photos.length <= 1) return
    const id = setInterval(() => {
      setCurrent((prev) => (prev + 1) % photos.length)
    }, interval)
    return () => clearInterval(id)
  }, [photos.length, interval])

  return (
    <div className={styles.carousel}>
      {photos.map((src, idx) => (
        <div
          key={idx}
          className={`${styles.slide} ${
            idx === current ? styles.active : ''
          }`}
        >
          <Image
            src={src}
            alt={`Slide ${idx + 1}`}
            fill
            style={{ objectFit: 'cover' }}
            sizes="100vw"
          />
        </div>
      ))}
    </div>
  )
}

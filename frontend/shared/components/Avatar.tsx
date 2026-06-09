import React from 'react'

interface AvatarProps {
  src?: string
  alt: string
  size?: 'sm' | 'md' | 'lg'
  fallback?: string
}

export const Avatar: React.FC<AvatarProps> = ({ src, alt, size = 'md', fallback }) => {
  const sizeStyles = {
    sm: 'h-8 w-8 text-xs',
    md: 'h-10 w-10 text-sm',
    lg: 'h-14 w-14 text-base',
  }

  const initials = fallback || alt.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)

  return (
    <div
      className={`inline-flex items-center justify-center rounded-full bg-[#adc6ff]/10 text-[#adc6ff] font-medium ${sizeStyles[size]}`}
    >
      {src ? (
        <img src={src} alt={alt} className="h-full w-full rounded-full object-cover" />
      ) : (
        <span className="select-none">{initials}</span>
      )}
    </div>
  )
}

import React, { useState, useEffect } from 'react';
import { Image as ImageIcon, AlertCircle } from 'lucide-react';

type AspectRatio = 'video' | 'square' | 'banner' | 'auto';

interface SmartImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  aspectRatio?: AspectRatio;
  objectFit?: 'cover' | 'contain';
  fallbackIcon?: React.ReactNode;
  containerClassName?: string;
}

export function SmartImage({
  src: rawSrc,
  alt = '',
  className = '',
  containerClassName = '',
  aspectRatio = 'auto',
  objectFit = 'cover',
  fallbackIcon,
  ...props
}: SmartImageProps) {
  const [status, setStatus] = useState<'loading' | 'loaded' | 'error'>('loading');

  // Automatically optimize Cloudinary URLs by injecting transform parameters
  const optimizeImageUrl = (url: string | undefined) => {
    if (!url) return url;
    
    // Cloudinary optimization
    if (url.includes('res.cloudinary.com') && url.includes('/upload/')) {
      // Avoid double optimizing if already has transformations
      if (url.includes('/upload/f_auto') || url.includes('/upload/q_auto')) {
        return url;
      }
      
      // Inject f_auto,q_auto,w_800 to serve smaller WebP/AVIF images
      return url.replace('/upload/', '/upload/f_auto,q_auto,w_800/');
    }
    
    return url;
  };

  const src = optimizeImageUrl(rawSrc);

  useEffect(() => {
    if (!src) {
      setStatus('error');
      return;
    }
    
    const img = new Image();
    img.src = src;
    if (img.complete) {
      setStatus('loaded');
    } else {
      setStatus('loading');
      img.onload = () => setStatus('loaded');
      img.onerror = () => setStatus('error');
    }
  }, [src]);

  const isAuto = aspectRatio === 'auto';
  
  const objectFitClass = {
    'cover': 'object-cover',
    'contain': 'object-contain'
  }[objectFit];

  const wrapperClasses = isAuto 
    ? `relative overflow-hidden max-w-full w-full rounded-xl ${status === 'loading' ? 'min-w-[200px] min-h-[200px]' : ''} ${containerClassName}`
    : `relative overflow-hidden w-full max-w-full ${containerClassName}`;

  const imageClasses = isAuto
    ? `max-w-full h-auto max-h-[600px] object-contain transition-opacity duration-500 ${status === 'loaded' ? 'opacity-100' : 'opacity-0'} ${className}`
    : `w-full max-w-full h-full ${objectFitClass} transition-opacity duration-500 ${status === 'loaded' ? 'opacity-100' : 'opacity-0'} ${className}`;

  const aspectStyles = {
    'video': { aspectRatio: '16 / 9' },
    'square': { aspectRatio: '1 / 1' },
    'banner': { aspectRatio: '21 / 9' },
    'auto': {}
  }[aspectRatio];

  return (
    <div className={wrapperClasses} style={aspectStyles}>
      {status === 'loading' && (
        <div className="absolute inset-0 bg-slate-100 dark:bg-slate-800/50 flex items-center justify-center">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 dark:via-white/5 to-transparent -translate-x-full animate-[shimmer_1.5s_infinite]" />
          <ImageIcon className="w-8 h-8 text-slate-600 dark:text-slate-300 dark:text-slate-600 opacity-50" />
        </div>
      )}
      
      {status === 'error' && (
        <div className="absolute inset-0 bg-slate-50 dark:bg-slate-900/50 flex flex-col items-center justify-center text-slate-500 dark:text-slate-400 dark:text-slate-500 border border-slate-100 dark:border-slate-800 shadow-sm dark:shadow-none">
          {fallbackIcon || <AlertCircle className="w-8 h-8 mb-2 opacity-50" />}
          <span className="text-[11px] font-medium uppercase tracking-wider">Failed to load media</span>
        </div>
      )}
      
      {status !== 'error' && (
        <img
          src={src}
          alt={alt}
          className={imageClasses}
          style={isAuto ? undefined : { maxWidth: '100%', width: '100%', overflow: 'hidden', display: 'block' }}
          loading="lazy"
          decoding="async"
          {...props}
        />
      )}
    </div>
  );
}

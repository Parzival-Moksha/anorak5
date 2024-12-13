export function isMobileDevice(): boolean {
  if (typeof window === 'undefined') return false;
  
  return (
    window.matchMedia('(max-width: 768px)').matches ||
    /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
      navigator.userAgent
    )
  );
} 
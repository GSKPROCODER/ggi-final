import { SVGProps } from 'react';

export default function Logo(props: SVGProps<SVGSVGElement>) {
  return (
    <svg 
      viewBox="0 0 100 100" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="4" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      {...props}
    >
      {/* Main diagonal 1 */}
      <line x1="30" y1="30" x2="70" y2="70" />
      <circle cx="22" cy="22" r="8" />
      <circle cx="78" cy="78" r="8" />
      
      {/* Main diagonal 2 */}
      <line x1="30" y1="70" x2="42" y2="58" />
      <line x1="58" y1="42" x2="70" y2="30" />
      <circle cx="22" cy="78" r="8" />
      <circle cx="78" cy="22" r="8" />

      {/* Inner nodes */}
      <circle cx="50" cy="50" r="4" fill="currentColor" />
      <circle cx="40" cy="40" r="3" fill="currentColor" />
      <circle cx="60" cy="60" r="3" fill="currentColor" />
    </svg>
  );
}

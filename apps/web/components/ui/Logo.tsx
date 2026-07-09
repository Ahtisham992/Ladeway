interface LogoProps {
  className?: string;
  white?: boolean;
}

export function Logo({ className = 'w-48 h-12', white = false }: LogoProps) {
  return (
    <div className={`overflow-hidden flex items-center justify-center ${className}`}>
      <img 
        src="/logo.png" 
        alt="Ladeway" 
        className={`w-full h-full object-cover scale-[1.3] ${white ? 'invert brightness-0' : ''}`}
      />
    </div>
  );
}

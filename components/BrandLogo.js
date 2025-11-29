export default function BrandLogo({ className = '', size = 56, src = '/images/kaburlu.jpg', showText = false }) {
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <div style={{ width: size, height: size }} className="flex items-center justify-center animate-float-logo">
        <img
          src={src}
          alt="Kaburlu Logo"
          className="w-full h-full object-contain drop-shadow-sm rounded"
          onError={(e) => { e.currentTarget.style.display = 'none'; }}
        />
      </div>
      {showText && (
        <div className="flex flex-col">
          <span className="relative font-bold text-2xl tracking-tight text-brand">
            Kaburlu
            <span className="absolute left-0 -bottom-1 h-[3px] w-full rounded-full bg-brand/40 animate-pulse-accent" />
          </span>
          <span className="text-[11px] uppercase font-medium text-gray-500 tracking-wide">Media Admin</span>
        </div>
      )}
    </div>
  )
}
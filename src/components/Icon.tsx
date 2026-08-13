/**
 * The Figma file's icons are Material Symbols instances — their component
 * descriptions carry the Material keyword lists verbatim (`chevron_right`,
 * `local_cafe`, `drag_indicator`…). Rendering them from the real Material
 * Symbols Rounded webfont keeps the glyphs, optical sizing and weight exact,
 * and lets them inherit `currentColor`.
 */
export function Icon({
  name,
  size = 20,
  fill = false,
  className = '',
}: {
  name: string
  size?: number
  fill?: boolean
  className?: string
}) {
  return (
    <span
      className={`icon ${className}`}
      style={{
        fontSize: size,
        width: size,
        height: size,
        fontVariationSettings: `'FILL' ${fill ? 1 : 0}, 'wght' 400, 'GRAD' 0, 'opsz' ${size}`,
      }}
      aria-hidden="true"
    >
      {name}
    </span>
  )
}

interface Props {
  rating: number
  reviews: number
  /** `lg` is the detail sheet (16px stars), `sm` is a list row (14px). */
  size?: 'sm' | 'lg'
  gem?: boolean
  /** Trailing detail on the same line, e.g. the `1.5 mi` detour. */
  suffix?: string
  /**
   * `single` is the redesigned list row: one star instead of the five-star
   * strip, which is what leaves room for the distance.
   */
  stars?: 'full' | 'single'
}

export function Rating({ rating, reviews, size = 'sm', gem = false, suffix, stars: mode = 'full' }: Props) {
  const full = Math.floor(rating)
  const stars = mode === 'single' ? [true] : Array.from({ length: 5 }, (_, i) => i < full)
  const px = size === 'lg' ? 16 : 14
  const src = size === 'lg' ? ['/assets/star-full.svg', '/assets/star-empty.svg'] : ['/assets/star-sm-full.svg', '/assets/star-sm-empty.svg']

  return (
    <div className={`rating rating-${size}`}>
      <span className="rating-cluster">
        <span className="rating-value">{rating}</span>
        <span className="stars">
          {stars.map((on, i) => (
            <img key={i} src={on ? src[0] : src[1]} width={px} height={px} alt="" />
          ))}
        </span>
        <span className="rating-count">({reviews.toLocaleString('en-US')})</span>
      </span>
      {suffix && (
        <>
          <span className="rating-dot" aria-hidden>
            •
          </span>
          <span className="rating-suffix">{suffix}</span>
        </>
      )}
      {gem && (
        <>
          <span className="rating-dot" aria-hidden>
            •
          </span>
          <span className="rating-gem" role="img" aria-label="Marked as a gem">
            💎
          </span>
        </>
      )}
    </div>
  )
}

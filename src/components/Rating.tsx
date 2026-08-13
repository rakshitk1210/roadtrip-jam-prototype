interface Props {
  rating: number
  reviews: number
  /** `lg` is the detail sheet (16px stars), `sm` is a list row (14px). */
  size?: 'sm' | 'lg'
  gem?: boolean
}

export function Rating({ rating, reviews, size = 'sm', gem = false }: Props) {
  const full = Math.floor(rating)
  const stars = Array.from({ length: 5 }, (_, i) => i < full)
  const px = size === 'lg' ? 16 : 14
  const src = size === 'lg' ? ['/assets/star-full.svg', '/assets/star-empty.svg'] : ['/assets/star-sm-full.svg', '/assets/star-sm-empty.svg']

  return (
    <div className={`rating rating-${size}`}>
      {gem && <img className="rating-gem" src="/assets/gem-diamond.png" alt="Marked as a gem" />}
      <span className="rating-value">{rating}</span>
      <span className="stars">
        {stars.map((on, i) => (
          <img key={i} src={on ? src[0] : src[1]} width={px} height={px} alt="" />
        ))}
      </span>
      <span className="rating-count">({reviews})</span>
    </div>
  )
}

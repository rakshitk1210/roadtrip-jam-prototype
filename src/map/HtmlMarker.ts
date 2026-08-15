export type Anchor = 'center' | 'left' | 'right'

/** Matches the anchor semantics the markers relied on under Mapbox. */
const TRANSFORM: Record<Anchor, string> = {
  center: 'translate(-50%, -50%)',
  left: 'translate(0, -50%)',
  right: 'translate(-100%, -50%)',
}

export interface HtmlMarker {
  setMap(map: google.maps.Map | null): void
}

type Ctor = new (
  position: google.maps.LatLngLiteral,
  element: HTMLElement,
  anchor: Anchor,
) => HtmlMarker

let ctor: Ctor | null = null

/**
 * `OverlayView` only exists once the Maps API has loaded, so the class is built
 * on first use rather than at module scope.
 *
 * This is deliberately not `AdvancedMarkerElement`: that needs a cloud-configured
 * Map ID, whereas an overlay works with a bare API key and leaves the `styles`
 * option free, should the avocado palette ever come back.
 */
function build(): Ctor {
  class Overlay extends google.maps.OverlayView implements HtmlMarker {
    constructor(
      private readonly position: google.maps.LatLngLiteral,
      private readonly element: HTMLElement,
      private readonly anchor: Anchor,
    ) {
      super()
    }

    onAdd() {
      // floatPane sits above the base map and still forwards pointer events, so
      // `.sticker.is-interactive { pointer-events: auto }` keeps working.
      this.getPanes()?.floatPane.appendChild(this.element)
    }

    draw() {
      const point = this.getProjection()?.fromLatLngToDivPixel(
        new google.maps.LatLng(this.position),
      )
      if (!point) return

      this.element.style.position = 'absolute'
      this.element.style.left = `${point.x}px`
      this.element.style.top = `${point.y}px`
      this.element.style.transform = TRANSFORM[this.anchor]
    }

    onRemove() {
      this.element.remove()
    }
  }

  return Overlay
}

export function createHtmlMarker(
  position: google.maps.LatLngLiteral,
  element: HTMLElement,
  anchor: Anchor,
): HtmlMarker {
  ctor ??= build()
  return new ctor(position, element, anchor)
}

import { Fragment, useCallback, useEffect, useMemo, useRef } from 'react'
import { Icon } from '../components/Icon'
import { Rating } from '../components/Rating'
import { detourFromRoute, formatMiles } from '../data/directions'
import { useTrip, type Day, type ItineraryItem } from '../state/tripContext'
import { PostTripPanel } from './PostTripPanel'
import { useReorder } from './useReorder'

function Row({
  item,
  handleProps,
  offset,
  lifted,
  added,
}: {
  item: ItineraryItem
  handleProps: Record<string, unknown>
  offset: number
  lifted: boolean
  /** Just added from Discover, and briefly marked as such. */
  added: boolean
}) {
  const { hasGem, openPlace, findPlace, selectMode, selection, toggleSelection } = useTrip()
  const place = findPlace(item.id)
  const openable = Boolean(place)
  const selected = selection.includes(item.id)

  const activate = () => {
    if (selectMode) toggleSelection(item.id)
    else if (openable) openPlace(item.id)
  }

  const tappable = selectMode || openable

  return (
    <div
      data-reorder="row"
      className={`itin-row${tappable ? ' is-tappable' : ''}${selected ? ' is-selected' : ''}${
        lifted ? ' is-lifted' : ''
      }${added ? ' is-added' : ''}`}
      style={offset === 0 ? undefined : { transform: `translateY(${offset}px)` }}
      role={tappable ? 'button' : undefined}
      tabIndex={tappable ? 0 : undefined}
      aria-pressed={selectMode ? selected : undefined}
      onClick={tappable ? activate : undefined}
      onKeyDown={
        tappable
          ? (e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault()
                activate()
              }
            }
          : undefined
      }
    >
      {selectMode ? (
        <span className={`itin-check${selected ? ' is-on' : ''}`}>
          <Icon
            name={selected ? 'check_circle' : 'radio_button_unchecked'}
            size={20}
            fill={selected}
          />
        </span>
      ) : (
        /* The dots were always drawn here; now they grab. Select mode replaces
           them with the checkmark, so there is nothing to drag in that mode. */
        <span className="drag-handle" {...handleProps}>
          <Icon name="drag_indicator" size={24} className="drag-dots" />
        </span>
      )}

      {/* The itinerary item snapshots its photo when added, so prefer the live
          place — that's what carries real Google photography once it hydrates. */}
      <img className="itin-photo" src={place?.thumb ?? item.photo} alt="" />

      <div className="itin-text">
        <p className="itin-name">{item.name}</p>
        <Rating
          rating={item.rating}
          reviews={item.reviews}
          gem={hasGem(item.id)}
          stars="single"
          suffix={place ? formatMiles(detourFromRoute(place.coord)) : undefined}
        />
      </div>

      <button className="round-btn round-btn-soft" aria-label="Directions" onClick={(e) => e.stopPropagation()}>
        <Icon name="directions" size={18} fill />
      </button>
    </div>
  )
}

/**
 * A day's heading, and the way to reorder it. There is no handle drawn beside a
 * day, so the heading itself is the grab affordance.
 */
function DayHeading({
  day,
  handleProps,
}: {
  day: Day
  /** Absent in select mode, where there is nothing to drag. */
  handleProps?: Record<string, unknown>
}) {
  return (
    <div className={`day-heading${handleProps ? '' : ' is-static'}`} {...handleProps}>
      <span className="day-dot" style={{ background: day.colour }} />
      Day {day.index}
    </div>
  )
}

export function ItineraryTab() {
  const {
    itinerary,
    days,
    postTripId,
    selectMode,
    selection,
    enterSelect,
    exitSelect,
    groupSelectionIntoDay,
    removeItems,
    moveItem,
    moveDay,
    addedId,
    clearAdded,
  } = useTrip()
  const cardRef = useRef<HTMLDivElement>(null)

  // The highlight is timed from here rather than from the add, because the add
  // usually happens in Discover: four seconds of a list nobody is looking at
  // would leave nothing to see on arrival. Read through a ref so an unrelated
  // state change — a drag, a toast — doesn't restart the countdown.
  const clearAddedRef = useRef(clearAdded)
  clearAddedRef.current = clearAdded
  useEffect(() => {
    if (!addedId) return
    const timer = window.setTimeout(() => clearAddedRef.current(), 4000)
    return () => window.clearTimeout(timer)
  }, [addedId])

  // Grouped places lead, in day order; anything ungrouped follows underneath.
  const grouped = useMemo(
    () =>
      days.map((day) => ({
        day,
        items: day.placeIds
          .map((id) => itinerary.find((i) => i.id === id))
          .filter((i): i is ItineraryItem => Boolean(i)),
      })),
    [days, itinerary],
  )
  const ungrouped = useMemo(() => {
    const groupedIds = new Set(days.flatMap((d) => d.placeIds))
    return itinerary.filter((i) => !groupedIds.has(i.id))
  }, [days, itinerary])

  // Rows reorder across the whole list rather than within one day, so the drag
  // works against a flat view of them — which is the order they are drawn in.
  const rowCount = grouped.reduce((n, g) => n + g.items.length, 0)
  const rowDrag = useReorder(cardRef, '[data-reorder="row"]', moveItem)
  const dayDrag = useReorder(cardRef, '[data-reorder="day"]', moveDay)

  const removeSelected = useCallback(() => removeItems(selection), [removeItems, selection])

  return (
    <>
      <div className="sheet-title-row">
        <h2>{selectMode ? 'Select places' : 'Itinerary'}</h2>
        {selectMode ? (
          <button className="round-btn round-btn-dim" aria-label="Cancel" onClick={exitSelect}>
            <Icon name="close" size={20} />
          </button>
        ) : (
          <button className="pill pill-outline pill-sm" onClick={enterSelect}>
            Select
          </button>
        )}
      </div>

      <div
        ref={cardRef}
        className={`sheet-card${rowDrag.dragging || dayDrag.dragging ? ' is-dragging' : ''}`}
      >
        {grouped.map(({ day, items }, dayIndex) => {
          // Row positions are global, so each day continues where the last left off.
          const firstRow = grouped
            .slice(0, dayIndex)
            .reduce((n, g) => n + g.items.length, 0)
          const offset = dayDrag.offsetFor(dayIndex)

          return (
            <section
              key={day.id}
              data-reorder="day"
              className={`itin-section${dayDrag.liftedIndex === dayIndex ? ' is-lifted' : ''}`}
              style={offset === 0 ? undefined : { transform: `translateY(${offset}px)` }}
            >
              <DayHeading
                day={day}
                handleProps={selectMode ? undefined : dayDrag.handleProps(dayIndex)}
              />
              {items.map((item, i) => (
                <Fragment key={item.id}>
                  <Row
                    item={item}
                    handleProps={rowDrag.handleProps(firstRow + i)}
                    offset={rowDrag.offsetFor(firstRow + i)}
                    lifted={rowDrag.liftedIndex === firstRow + i}
                    added={item.id === addedId}
                  />
                  {item.id === postTripId && <PostTripPanel id={item.id} name={item.name} />}
                </Fragment>
              ))}
            </section>
          )
        })}

        <section className="itin-section">
          {ungrouped.map((item, i) => (
            <Fragment key={item.id}>
              <Row
                item={item}
                handleProps={rowDrag.handleProps(rowCount + i)}
                offset={rowDrag.offsetFor(rowCount + i)}
                lifted={rowDrag.liftedIndex === rowCount + i}
                added={item.id === addedId}
              />
              {item.id === postTripId && <PostTripPanel id={item.id} name={item.name} />}
            </Fragment>
          ))}
        </section>
      </div>

      {selectMode && selection.length > 0 && (
        <div className="sheet-cta">
          <button className="pill pill-primary" onClick={groupSelectionIntoDay}>
            Group to a day
          </button>
          <button
            className="round-btn round-btn-danger"
            aria-label={`Remove ${selection.length === 1 ? 'this place' : 'these places'}`}
            onClick={removeSelected}
          >
            <Icon name="delete" size={20} fill />
          </button>
        </div>
      )}
    </>
  )
}

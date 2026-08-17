import { useCallback, useMemo, useRef, useState } from 'react'
import { Icon } from '../components/Icon'
import { MetaLine } from '../components/MetaLine'
import { useTrip, type ItineraryItem } from '../state/tripContext'
import { dayColor } from '../styles/dayColors'
import { useReorder } from './useReorder'

/**
 * Select mode. It spans three places that are siblings rather than ancestors —
 * the sheet header, the list, and the floating action bar — so the state is
 * raised to whoever renders all three and handed back down as one object.
 */
export interface Selection {
  selecting: boolean
  ids: string[]
  start: () => void
  cancel: () => void
  toggle: (id: string) => void
  isSelected: (id: string) => boolean
  groupSelected: () => void
  removeSelected: () => void
}

export function useItinerarySelection(): Selection {
  const { groupIntoDay, removeItems } = useTrip()
  const [selecting, setSelecting] = useState(false)
  const [ids, setIds] = useState<string[]>([])

  const cancel = useCallback(() => {
    setSelecting(false)
    setIds([])
  }, [])

  return useMemo<Selection>(
    () => ({
      selecting,
      ids,
      start: () => setSelecting(true),
      cancel,
      toggle: (id) => setIds((prev) => (prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id])),
      isSelected: (id) => ids.includes(id),
      groupSelected: () => {
        groupIntoDay(ids)
        cancel()
      },
      removeSelected: () => {
        removeItems(ids)
        cancel()
      },
    }),
    [selecting, ids, cancel, groupIntoDay, removeItems],
  )
}

/** The sheet header's title row — `Itinerary` + `Select`, or the way out of it. */
export function ItineraryHeader({ selection }: { selection: Selection }) {
  const { selecting, start, cancel } = selection

  return (
    <div className="itin-head">
      <h1 className="itin-title">{selecting ? 'Select places' : 'Itinerary'}</h1>
      {selecting ? (
        <button className="itin-head-close" onClick={cancel} aria-label="Leave select mode">
          <Icon name="close" size={20} />
        </button>
      ) : (
        <button className="itin-head-select" onClick={start}>
          Select
        </button>
      )}
    </div>
  )
}

/**
 * The floating bar that replaces the tab pill while selecting: directions for
 * the whole selection, group them into a day, or drop them.
 */
export function SelectActionBar({ selection }: { selection: Selection }) {
  const { ids, groupSelected, removeSelected } = selection
  const empty = ids.length === 0

  return (
    <div className="select-bar">
      <button className="select-bar-icon" disabled={empty} aria-label="Directions for the selected stops">
        <Icon name="directions" size={26} fill />
      </button>
      <button className="select-bar-primary" onClick={groupSelected} disabled={empty}>
        Group to a day
      </button>
      <button
        className="select-bar-icon is-destructive"
        onClick={removeSelected}
        disabled={empty}
        aria-label="Remove the selected stops"
      >
        <Icon name="delete" size={26} fill />
      </button>
    </div>
  )
}

/**
 * One stop. Tapping the row opens its detail sheet, or checks it while
 * selecting — the design replaces the drag handle with the checkmark, so there
 * is nothing to drag in that mode either.
 */
function StopRow({
  item,
  selection,
  handleProps,
  offset,
  lifted,
}: {
  item: ItineraryItem
  selection: Selection
  handleProps: Record<string, unknown>
  offset: number
  lifted: boolean
}) {
  const { hasGem, openPlace, findPlace } = useTrip()
  const { selecting, toggle, isSelected } = selection
  const selected = selecting && isSelected(item.id)
  // Only rows backed by a real place can open a detail sheet.
  const openable = selecting || Boolean(findPlace(item.id))
  const activate = () => (selecting ? toggle(item.id) : openPlace(item.id))

  return (
    <div
      data-reorder="row"
      className={`itin-row${openable ? ' is-openable' : ''}${selected ? ' is-selected' : ''}${
        lifted ? ' is-lifted' : ''
      }`}
      style={offset === 0 ? undefined : { transform: `translateY(${offset}px)` }}
      role={openable ? 'button' : undefined}
      aria-pressed={selecting ? selected : undefined}
      tabIndex={openable ? 0 : undefined}
      onClick={openable ? activate : undefined}
      onKeyDown={
        openable
          ? (e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault()
                activate()
              }
            }
          : undefined
      }
    >
      {selecting ? (
        <span className={`select-mark${selected ? ' is-on' : ''}`}>
          <Icon name={selected ? 'check_circle' : 'radio_button_unchecked'} size={20} fill={selected} />
        </span>
      ) : (
        <span className="drag-handle" {...handleProps} aria-label={`Reorder ${item.name}`}>
          <Icon name="drag_indicator" size={18} />
        </span>
      )}

      <div className="itin-thumb">
        <img className="itin-photo" src={item.photo} alt="" />
      </div>

      <div className="itin-text">
        <p className="itin-name">{item.name}</p>
        <MetaLine place={item} gem={hasGem(item.id)} />
      </div>

      {/* Directions act on their own, so the button swallows the row tap. */}
      <button
        className="itin-directions"
        onClick={(e) => e.stopPropagation()}
        aria-label={`Directions to ${item.name}`}
      >
        <Icon name="directions" size={18} fill />
      </button>
    </div>
  )
}

export function ItineraryTab({ selection }: { selection: Selection }) {
  const { itinerary, moveItem, moveDay } = useTrip()
  const cardRef = useRef<HTMLDivElement>(null)

  // Rows reorder across the whole list, not within one day, so the drag works
  // against a flat view of them and maps positions back on the way out.
  const rows = useMemo(
    () => itinerary.flatMap((day) => day.items.map((item, index) => ({ item, dayId: day.id, index }))),
    [itinerary],
  )

  const commitRow = useCallback(
    (from: number, to: number) => {
      const a = rows[from]
      const b = rows[to]
      if (a && b) moveItem({ dayId: a.dayId, index: a.index }, { dayId: b.dayId, index: b.index })
    },
    [rows, moveItem],
  )

  const rowDrag = useReorder(cardRef, '[data-reorder="row"]', commitRow)
  // Only labelled days reorder; the ungrouped tail stays pinned to the bottom.
  const dayDrag = useReorder(cardRef, '[data-reorder="day"]', moveDay)

  let dayIndex = -1

  return (
    <div ref={cardRef} className={`itin-card${rowDrag.dragging || dayDrag.dragging ? ' is-dragging' : ''}`}>
      {itinerary.map((day) => {
        if (day.labelled) dayIndex += 1
        const number = dayIndex + 1
        // Row indices are global, so each day continues where the last left off.
        const firstRow = rows.findIndex((r) => r.dayId === day.id)

        return (
          <section
            key={day.id}
            data-reorder={day.labelled ? 'day' : undefined}
            className={`itin-day${day.labelled ? ' is-labelled' : ''}${
              day.labelled && dayDrag.liftedIndex === dayIndex ? ' is-lifted' : ''
            }`}
            style={
              day.labelled && dayDrag.offsetFor(dayIndex) !== 0
                ? { transform: `translateY(${dayDrag.offsetFor(dayIndex)}px)` }
                : undefined
            }
          >
            {day.labelled && (
              /* Reordering days is ours, not the design's — the heading is the
                 grab affordance, since there is no handle drawn for it. The
                 colour is the day's own, matching its leg of the route. */
              <h2
                className="day-label"
                style={{ color: dayColor(dayIndex) }}
                {...(selection.selecting ? {} : dayDrag.handleProps(dayIndex))}
              >
                <Icon name="drag_indicator" size={16} />
                Day {number}
              </h2>
            )}
            {day.items.map((item, i) => {
              const flat = firstRow + i
              return (
                <StopRow
                  key={item.id}
                  item={item}
                  selection={selection}
                  handleProps={rowDrag.handleProps(flat)}
                  offset={rowDrag.offsetFor(flat)}
                  lifted={rowDrag.liftedIndex === flat}
                />
              )
            })}
          </section>
        )
      })}
    </div>
  )
}

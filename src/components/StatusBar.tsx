/**
 * The phone's own 9:41 strip. Every full-screen view draws one, so it lives
 * here rather than being copied alongside each.
 */
export function StatusBar() {
  return (
    <div className="status-bar">
      <span className="status-time">9:41</span>
      <span className="status-levels">
        <img src="/assets/ic-cellular.svg" alt="" width={19.2} height={12.2} />
        <img src="/assets/ic-wifi.svg" alt="" width={17.1} height={12.3} />
        <img src="/assets/ic-battery.svg" alt="" width={27.3} height={13} />
      </span>
    </div>
  )
}

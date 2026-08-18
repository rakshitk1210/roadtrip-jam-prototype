/**
 * The iOS status strip from Figma 2060:18843. Every drawn screen mounts one,
 * so it lives here rather than being copied alongside each. You is a
 * screenshot and keeps the clock baked into `you-bg.jpg`.
 */
export function StatusBar() {
  return (
    <div className="status-bar">
      <span className="status-time">9:41</span>
      <span className="status-levels">
        <img src="/assets/ic-cellular.svg" alt="" width={18.1} height={11.5} />
        <img src="/assets/ic-wifi.svg" alt="" width={16.2} height={11.6} />
        <img src="/assets/ic-battery.svg" alt="" width={25.8} height={12.3} />
      </span>
    </div>
  )
}

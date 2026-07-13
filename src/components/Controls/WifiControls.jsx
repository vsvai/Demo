export default function WifiControls({ timer, onTimerChange, onAction, feedback }) {
  return (
    <div className="flex flex-wrap gap-2 items-center pb-3">
      <label className="flex flex-col gap-1 text-xs text-text-muted w-full">
        Timer (seconds)
        <input
          type="number"
          min="1"
          max="86400"
          value={timer}
          onChange={(e) => onTimerChange(e.target.value)}
          inputMode="numeric"
          className="w-24 px-3 py-2.5 text-sm font-mono border border-border rounded-lg bg-white min-h-11"
        />
      </label>
      <button onClick={() => onAction('camera')} className="px-4 py-2.5 text-sm font-semibold rounded-lg border border-wifi text-wifi hover:bg-wifi-light transition-colors min-h-11">
        Start camera
      </button>
      <button onClick={() => onAction('wifi')} className="px-4 py-2.5 text-sm font-semibold rounded-lg border border-wifi text-wifi hover:bg-wifi-light transition-colors min-h-11">
        Start Wi‑Fi + camera
      </button>
      {feedback && (
        <span className={`w-full text-xs px-3 py-2 rounded-md
          ${feedback.error ? 'bg-error-light text-error' : 'bg-accent-light text-accent-hover'}
        `}>
          {feedback.text}
        </span>
      )}
    </div>
  )
}

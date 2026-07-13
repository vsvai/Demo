export default function RobotControls({ onCommand, onStop, onOta, feedback }) {
  return (
    <div className="flex flex-wrap gap-2 items-center pb-3">
      <button onClick={onStop} className="px-4 py-2.5 text-sm font-semibold rounded-lg border border-error text-error hover:bg-error-light transition-colors min-h-11">
        Stop
      </button>
      <button onClick={() => onCommand('left')} className="px-4 py-2.5 text-sm font-semibold rounded-lg border border-wifi text-wifi hover:bg-wifi-light transition-colors min-h-11">
        ← Go Left
      </button>
      <button onClick={() => onCommand('right')} className="px-4 py-2.5 text-sm font-semibold rounded-lg border border-wifi text-wifi hover:bg-wifi-light transition-colors min-h-11">
        Go Right →
      </button>
      <button onClick={onOta} className="px-4 py-2.5 text-sm font-semibold rounded-lg border border-warning text-warning hover:bg-warning-light transition-colors min-h-11">
        OTA
      </button>

      {/* WASD Grid */}
      <div className="grid grid-cols-3 gap-1 w-52 mt-2">
        <div />
        <button onClick={() => onCommand('forward')} className="py-2 text-xs font-semibold rounded-lg border border-blue-500 text-blue-500 hover:bg-blue-50 transition-colors min-h-10">
          Forward (W)
        </button>
        <div />
        <button onClick={() => onCommand('left')} className="py-2 text-xs font-semibold rounded-lg border border-blue-500 text-blue-500 hover:bg-blue-50 transition-colors min-h-10">
          Left (A)
        </button>
        <button onClick={() => onCommand('backward')} className="py-2 text-xs font-semibold rounded-lg border border-blue-500 text-blue-500 hover:bg-blue-50 transition-colors min-h-10">
          Backward (S)
        </button>
        <button onClick={() => onCommand('right')} className="py-2 text-xs font-semibold rounded-lg border border-blue-500 text-blue-500 hover:bg-blue-50 transition-colors min-h-10">
          Right (D)
        </button>
      </div>

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

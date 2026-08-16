import { useEffect, useRef, useState } from 'react'
import logo from '../assets/sudoyantra-logo.png'
import { resolvePasscode, forgotPasscodeUrl } from '../passcode'

export default function PasscodeGate({ onUnlock }) {
  const [value, setValue] = useState('')
  const [error, setError] = useState(false)
  const inputRef = useRef(null)

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  const handleChange = (raw) => {
    const digits = String(raw).replace(/\D/g, '').slice(0, 4)
    setValue(digits)
    setError(false)
    if (digits.length === 4) {
      const result = resolvePasscode(digits)
      if (result) {
        setTimeout(() => onUnlock(result), 120)
      } else {
        setError(true)
        setTimeout(() => {
          setValue('')
          inputRef.current?.focus()
        }, 500)
      }
    }
  }

  const slots = value.padEnd(4, ' ').split('')

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-6 bg-bg px-4"
      onClick={() => inputRef.current?.focus()}
    >
      <div className="flex flex-col items-center gap-3">
        <img src={logo} alt="SudoYantra" className="h-16 w-16 object-contain" />
        <h1 className="text-2xl font-bold tracking-tight">SudoYantra Dashboard</h1>
        <p className="text-sm text-text-muted text-center max-w-sm">
          Enter your organization passcode to continue
        </p>
      </div>

      <div className="flex flex-col items-center gap-4 bg-panel border border-border rounded-xl px-8 py-7 shadow-sm">
        <div className="flex items-center gap-3" role="group" aria-label="Passcode">
          {slots.map((d, i) => (
            <div
              key={i}
              className={`flex h-14 w-11 items-center justify-center rounded-lg border text-xl font-semibold transition-colors ${
                error ? 'border-error bg-error-light text-error' : 'border-border bg-bg'
              }`}
            >
              {d === ' ' ? '\u00A0' : '•'}
            </div>
          ))}
        </div>

        <input
          ref={inputRef}
          value={value}
          onChange={(e) => handleChange(e.target.value)}
          inputMode="numeric"
          pattern="[0-9]*"
          autoComplete="one-time-code"
          className="h-0 w-0 opacity-0 absolute"
          aria-label="Enter 4-digit passcode"
        />

        {error && <p className="text-sm text-error font-medium">Incorrect passcode. Please try again.</p>}

        <p className="text-xs text-text-muted">Hint: 0000 opens the dashboard without robots</p>
      </div>

      <a
        href={forgotPasscodeUrl()}
        target="_blank"
        rel="noreferrer"
        className="flex items-center gap-2 text-sm font-medium text-accent hover:text-accent-hover underline underline-offset-2"
      >
        <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
          <path d="M12 2a10 10 0 0 0-8.5 15.3L2 22l4.8-1.5A10 10 0 1 0 12 2Zm5.2 13.6c-.3.8-1.5 1.5-2.4 1.5-.6 0-1.4-.3-4.1-1.7-3-1.6-4.5-4.5-4.6-4.7-.1-.3-.9-2.4-.1-3.6.5-.8 1.3-1 1.8-1 .3 0 .6 0 .8.1.2 0 .5-.1.8.6.2.7.8 2 .9 2.1.1.1.1.3 0 .5-.1.1-.1.3-.3.5-.1.2-.3.3-.4.5-.2.1-.3.3-.1.6.2.3.9 1.5 2 2.4 1.4 1.2 2.6 1.6 3 1.8.3.2.5.1.7-.1.2-.2.8-1 .1-.4l1.6-1.6.9 1.4v.1Z" />
        </svg>
        Forgot passcode? Message us on WhatsApp
      </a>
    </div>
  )
}

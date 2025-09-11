import { useEffect, useRef, type TextareaHTMLAttributes } from 'react'

type Props = TextareaHTMLAttributes<HTMLTextAreaElement> & {
  rows?: number
}

/**
 * AutoTextarea
 * - wächst mit dem Inhalt
 * - respektiert max-height via CSS
 * - lässt manuelles Vergrößern (resize: vertical) zu
 */
export default function AutoTextarea({ value, rows = 6, ...props }: Props) {
  const ref = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = el.scrollHeight + 'px'
  }, [value])

  return <textarea ref={ref} value={value} rows={rows} {...props} />
}

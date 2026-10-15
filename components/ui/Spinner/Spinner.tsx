import styles from './Spinner.module.css'

type SpinnerProps = {
  size?: 'sm' | 'md' | 'lg'
  label?: string
  className?: string
}

export default function Spinner({
  size = 'md',
  label,
  className,
}: SpinnerProps) {
  return (
    <span
      className={[styles.wrapper, className].filter(Boolean).join(' ')}
      role={label ? 'status' : undefined}
      aria-hidden={label ? undefined : true}
    >
      <span className={`${styles.spinner} ${styles[size]}`} />
      {label && <span className="sr-only">{label}</span>}
    </span>
  )
}

type Props = { message: string; blocked: boolean; onRetry: () => void }

export function StorageAlert({ message, blocked, onRetry }: Props) {
  return (
    <div role="alert" className="mb-5 rounded-xl border border-warn-line bg-warn-bg p-4 text-sm text-warn-fg">
      <p>{message}</p>
      <button
        type="button"
        className="mt-2 font-semibold underline"
        onClick={() => {
          if (!blocked || window.confirm('Replace the unreadable saved workspace with the projects currently shown? The previous stored data will be lost.')) onRetry()
        }}
      >{blocked ? 'Replace saved workspace' : 'Retry saving'}</button>
    </div>
  )
}

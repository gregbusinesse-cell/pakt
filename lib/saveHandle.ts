// Imperative handle for forcing the profile auto-save to flush immediately.
// The profile page registers its flush function on mount; the layout calls it
// when the user tries to navigate away while there are unsaved changes.

type FlushFn = () => Promise<void>

let handler: FlushFn | null = null

export const registerFlushHandler = (fn: FlushFn | null) => {
  handler = fn
}

export const flushPendingSave = async (): Promise<void> => {
  if (handler) {
    try {
      await handler()
    } catch (err) {
      console.error('[saveHandle] flush error', err)
    }
  }
}

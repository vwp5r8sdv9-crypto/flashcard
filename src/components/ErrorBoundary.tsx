import { Component } from 'react'
import type { ErrorInfo, ReactNode } from 'react'

interface Props {
  children: ReactNode
}

interface State {
  hasError: boolean
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(): State {
    return { hasError: true }
  }

  override componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('Uncaught render error:', error, info)
  }

  override render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-dvh flex-col items-center justify-center gap-5 px-6 text-center">
          <p className="text-muted-foreground">
            Something went wrong. Please refresh or go back to your decks.
          </p>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => {
                window.location.reload()
              }}
              className="rounded-2xl bg-muted px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-border"
            >
              Reload
            </button>
            <button
              type="button"
              onClick={() => {
                window.location.href = '/decks'
              }}
              className="rounded-2xl bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors"
            >
              Go to Decks
            </button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

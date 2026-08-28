import { Component, ErrorInfo, ReactNode } from 'react'

interface Props {
  children: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
  errorInfo: ErrorInfo | null
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
  }

  public static getDerivedStateFromError(error: Error): State {
    console.error('ErrorBoundary caught:', error)
    return { hasError: true, error, errorInfo: null }
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo)
    this.setState({ error, errorInfo })
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
          <div className="bg-white rounded-2xl shadow-lg p-8 max-w-sm w-full text-center">
            <div className="text-4xl mb-4">😢</div>
            <h1 className="text-xl font-bold text-gray-900 mb-2">页面加载失败</h1>
            <p className="text-gray-500 text-sm mb-2">
              {this.state.error?.message || '未知错误'}
            </p>
            <p className="text-xs text-gray-400 mb-4">
              请刷新页面或检查网络连接
            </p>
            <button
              onClick={() => window.location.reload()}
              className="bg-orange-500 text-white px-6 py-2.5 rounded-lg font-medium hover:bg-orange-600"
            >
              刷新页面
            </button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

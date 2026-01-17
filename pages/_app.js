import '../styles/globals.css'
import { Component as ReactComponent } from 'react'
import MpinReLoginModal from '../components/auth/MpinReLoginModal'
import useSessionExpiry from '../hooks/useSessionExpiry'

class ErrorBoundary extends ReactComponent {
  constructor(props){
    super(props)
    this.state = { hasError: false, error: null }
  }
  static getDerivedStateFromError(error){
    return { hasError: true, error }
  }
  componentDidCatch(error, info){
    if (typeof window !== 'undefined') {
      // Basic client-side logging
      // eslint-disable-next-line no-console
      console.error('App error:', error, info)
    }
  }
  render(){
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center">
          <div className="text-xl font-semibold mb-2">Something went wrong</div>
          <div className="text-sm text-gray-600 max-w-md break-all">{String(this.state.error || '')}</div>
          <button className="mt-4 px-4 py-2 rounded border" onClick={() => { this.setState({ hasError:false, error:null }); if (typeof window !== 'undefined') window.location.reload() }}>Reload</button>
        </div>
      )
    }
    return this.props.children
  }
}

function AppContent({ Component, pageProps }) {
  const { showMpinModal, handleMpinSuccess, handleModalClose } = useSessionExpiry()

  return (
    <>
      <Component {...pageProps} />
      <MpinReLoginModal 
        isOpen={showMpinModal} 
        onClose={handleModalClose}
        onSuccess={handleMpinSuccess}
      />
    </>
  )
}

export default function App(props) {
  return (
    <ErrorBoundary>
      <AppContent {...props} />
    </ErrorBoundary>
  )
}

import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { Provider } from 'react-redux'
import store, { persistor } from './redux/store'
import { ToastProvider } from './components/ui/toast'
import { Toaster } from './components/ui/toaster'
import { PersistGate } from 'redux-persist/integration/react'

createRoot(document.getElementById('root')).render(
  // <StrictMode>
  <Provider store={store}>
    <PersistGate loading={null} persistor={persistor}>
      {/* <div onContextMenu={(e) => e.preventDefault()}> */}
      {/* <ToastProvider>. */}
      <App />
      <Toaster />
      {/* </ToastProvider> */}
      {/* </div> */}
    </PersistGate>
  </Provider>
  // </StrictMode>,
)

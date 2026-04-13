import { BrowserRouter } from 'react-router-dom'
import ScrollToTop from './components/ScrollToTop'
import RoutesApp from './routes'

function App() {
  return (
    <BrowserRouter>
      <ScrollToTop />
      <RoutesApp />
    </BrowserRouter>
  )
}

export default App

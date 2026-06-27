import { AppProvider } from "./contexts/AppContext"
import AppRoutes from "./routes/AppRoutes"

function App() {
  return (
    <AppProvider>
      <AppRoutes />
    </AppProvider>
  )
}

export default App
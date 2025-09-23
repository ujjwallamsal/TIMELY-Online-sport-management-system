import AppRoutes from "./routes/index.jsx";
import { ToastProvider } from "./components/ui/ToastProvider";

export default function App() {
  return (
    <ToastProvider>
      <AppRoutes />
    </ToastProvider>
  );
}

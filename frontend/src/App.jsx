import { useState } from "react";
import Dashboard from "./pages/Dashboard";
import Login from "./pages/Login";

function App() {
  const [isAuth, setIsAuth] = useState(() => !!localStorage.getItem("token"));

  if (!isAuth) {
    return <Login onLogin={() => setIsAuth(true)} />;
  }

  return <Dashboard />;
}

export default App;

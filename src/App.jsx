import { useEffect } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { v4 as uuidv4 } from "uuid";
import Home from "./pages/Home/Home";
import Calculator from "./pages/Calculator/Calculator";
import "./App.css";

function App() {
  useEffect(() => {
    if (!localStorage.getItem("deviceId")) {
      localStorage.setItem("deviceId", uuidv4());
    }
  }, []);

  return (
    <BrowserRouter>
      <div className="app-container">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/calculator" element={<Calculator />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}
export default App;

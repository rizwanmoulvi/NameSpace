import React from "react";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import Home from "./pages/Home";
import Domain from "./pages/Domain";

const App = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/domain/:tld/:contractAddress" element={<Domain />} />
      </Routes>
    </Router>
  );
};

export default App;

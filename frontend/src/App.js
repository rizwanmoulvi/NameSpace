import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Home from './pages/Home';
import Organization from './pages/Organization';
import Domain from './pages/Domain';
import Members from './pages/Members';

const App = () => {
  return (
    <Router>
      <Routes>
        <Route path='/' element={<Home />} />
        <Route path='/organization' element={<Organization />} />
        <Route path='/member' element={<Members />} />
        <Route path='/domain/:tld/:contractAddress' element={<Domain />} />
      </Routes>
    </Router>
  );
};

export default App;

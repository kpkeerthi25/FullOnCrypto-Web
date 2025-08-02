import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './hooks/AuthContext';
import Navigation from './components/Navigation';
import Home from './pages/Home';
import Login from './pages/Login';
import SignUp from './pages/SignUp';
import Scanner from './pages/Scanner';
import Profile from './pages/Profile';
import OpenPayments from './pages/OpenPayments';
import PendingPayments from './pages/PendingPayments';
import './App.css';

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="App">
          <Navigation />
          <main style={{ padding: '2rem' }}>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<SignUp />} />
              <Route path="/scanner" element={<Scanner />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/open-payments" element={<OpenPayments />} />
              <Route path="/pending-payments" element={<PendingPayments />} />
            </Routes>
          </main>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;

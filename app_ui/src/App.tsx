import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import './App.css'
import Home from './pages/Home';
import Login from './pages/Login';
import PageNotFound from './pages/PageNotFound';
import NewListing from './pages/NewListing';
import Item from './pages/Item';
import { AppContextProvider } from './pages/AppContext';
import PrivateRoute from './pages/PrivateRoute';

function App() {
  return (
    <AppContextProvider>
      <Router>
        <Routes>
          <Route path="/" element={<Login />} />
          <Route path="/login" element={<Login />} />
          <Route path="/home" element={<PrivateRoute><Home /></PrivateRoute>} />
          <Route path="/new-listing" element={<PrivateRoute><NewListing /></PrivateRoute>} />
          <Route path="/item" element={<PrivateRoute><Item /></PrivateRoute>} />
          <Route path="*" element={<PageNotFound />} />
        </Routes>
      </Router>
    </AppContextProvider>
  );
}

export default App;
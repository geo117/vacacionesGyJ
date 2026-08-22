import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import Login from './views/Login';
import Home from './views/Home';
import Header from './components/Header';
import { SocketProvider } from './context/SocketProvider';
import 'bootstrap/dist/css/bootstrap.min.css';
import './index.css';

const AppContent = () => {
  const location = useLocation();
  const showHeader = location.pathname !== '/';

  return (
    <>
      {showHeader && <Header />}
      <div className={showHeader ? 'main-content' : ''}>
        <Routes>
          <Route path="/" element={<Login />} />
          <Route path="/home" element={<Home />} />
        </Routes>
      </div>
    </>
  );
};

function App() {
  return (
    <Router>
      <SocketProvider>
        <AppContent />
      </SocketProvider>
    </Router>
  );
}

export default App;

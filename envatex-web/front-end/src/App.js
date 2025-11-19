// App.js
// Main component of the Envatex application.

// 1. Import React.
// 2. Import the main CSS file './App.css'.
// 3. Import the ProductList component from './components/ProductList'.
// 4. Import a simple Navbar from 'react-bootstrap' to give the page a header.

import React, { useState, useCallback } from 'react';
import './App.css';

// Routing
import { Routes, Route, Link, useNavigate, useLocation } from 'react-router-dom';

// UI
import { Navbar, Container, Nav } from 'react-bootstrap';

// Pages (to be created)
import Landing from './pages/Landing';
import Home from './pages/Home';
import Admin from './pages/Admin';
import AdminLogin from './pages/AdminLogin';

// App.js
// Main component that sets up routing for the application.

function App() {
  // Global cart state
  const [quotationItems, setQuotationItems] = useState([]);
  const [isAuthenticated, setIsAuthenticated] = React.useState(!!localStorage.getItem('access_token'));
  const navigate = useNavigate();
  const location = useLocation();

  React.useEffect(() => {
    const onAuth = () => setIsAuthenticated(!!localStorage.getItem('access_token'));
    window.addEventListener('storage', onAuth);
    window.addEventListener('authChanged', onAuth);
    return () => {
      window.removeEventListener('storage', onAuth);
      window.removeEventListener('authChanged', onAuth);
    };
  }, []);

  const handleAddToCart = useCallback((product) => {
    setQuotationItems((prev) => {
      const existing = prev.find((it) => it.product.id === product.id);
      if (existing) {
        return prev.map((it) =>
          it.product.id === product.id ? { ...it, quantity: it.quantity + 1 } : it
        );
      }
      return [...prev, { product, quantity: 1 }];
    });
  }, []);

  const handleRemoveFromCart = useCallback((productId) => {
    setQuotationItems((prev) =>
      prev
        .map((it) => {
          if (it.product.id === productId) {
            if ((it.quantity ?? 1) > 1) return { ...it, quantity: it.quantity - 1 };
            return null;
          }
          return it;
        })
        .filter(Boolean)
    );
  }, []);

  // NUEVO: función para limpiar el carrito
  const handleClearCart = useCallback(() => {
    setQuotationItems([]);
  }, []);

  return (
      <div className="App">
        <Navbar className="custom-navbar" expand="lg" variant="dark">
          <Container>
            {/* Conditional navbar: public vs admin */}
              <Navbar.Brand as={Link} to="/" className="d-flex align-items-center">
                <img
                  src="/2.png"
                  alt="Envatex"
                  height="100"
                  className="d-inline-block align-top me-1"
                  style={{ filter: 'brightness(0) invert(1)' }}
                />
              </Navbar.Brand>
            <Navbar.Toggle aria-controls="main-navbar" />
            <Navbar.Collapse id="main-navbar">
              {!isAuthenticated && (
                <>
                  <Nav className="me-auto">
                    <Nav.Link as={Link} to="/">Home</Nav.Link>
                  </Nav>
                  <div className="d-flex align-items-center">
                    {location.pathname !== '/' && location.pathname !== '/cotizar' && (
                      <Link to="/cotizar">
                        <button className="btn btn-primary custom me-3" aria-label="Solicitar Cotización">Solicitar Cotización</button>
                      </Link>
                    )}
                    <Nav>
                      <Nav.Link as={Link} to="/admin/login" className="text-nowrap text-white-50"><i className="fas fa-user-shield me-2" alt="Panel Admin"></i></Nav.Link>
                    </Nav>
                  </div>
                </>
              )}

              {isAuthenticated && (
                <div className="ms-auto d-flex align-items-center">
                  {location.pathname !== '/admin' && (
                    <Link to="/admin" className="btn btn-outline-light me-2">
                      <i className="fas fa-columns me-2"></i>
                      Panel
                    </Link>
                  )}

                  <button
                    className="btn btn-outline-light"
                    onClick={() => {
                      localStorage.removeItem('access_token');
                      window.dispatchEvent(new Event('authChanged'));
                      navigate('/admin/login');
                    }}
                  >
                    Cerrar Sesión
                  </button>
                </div>
              )}
            </Navbar.Collapse>
          </Container>
        </Navbar>

        <main>
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route
              path="/cotizar"
              element={
                <Home
                  items={quotationItems}
                  onAddToCart={handleAddToCart}
                  onRemoveItem={handleRemoveFromCart}
                  onClearCart={handleClearCart}
                />
              }
            />
            <Route path="/admin" element={<Admin />} />
            <Route path="/admin/login" element={<AdminLogin />} />
          </Routes>
        </main>
      </div>
  );
}

export default App;


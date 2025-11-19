// App.js
// Main component of the Envatex application.

// 1. Import React.
// 2. Import the main CSS file './App.css'.
// 3. Import the ProductList component from './components/ProductList'.
// 4. Import a simple Navbar from 'react-bootstrap' to give the page a header.

import React, { useState, useCallback } from 'react';
import './App.css';

// Routing
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';

// UI
import { Navbar, Container, Nav } from 'react-bootstrap';

// Pages (to be created)
import Home from './pages/Home';
import Admin from './pages/Admin';
import AdminLogin from './pages/AdminLogin';

// App.js
// Main component that sets up routing for the application.

function App() {
  // Global cart state
  const [quotationItems, setQuotationItems] = useState([]);

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

  return (
    <BrowserRouter>
      <div className="App">
        <Navbar bg="light" expand="lg">
          <Container>
            <Navbar.Brand as={Link} to="/">Envatex</Navbar.Brand>
            <Nav className="me-auto">
              <Nav.Link as={Link} to="/">Home</Nav.Link>
              <Nav.Link as={Link} to="/admin">Admin</Nav.Link>
            </Nav>
          </Container>
        </Navbar>

        <main>
          <Container className="my-4">
            <Routes>
              <Route
                path="/"
                element={
                  <Home
                    items={quotationItems}
                    onAddToCart={handleAddToCart}
                    onRemoveItem={handleRemoveFromCart}
                  />
                }
              />
              <Route path="/admin" element={<Admin />} />
              <Route path="/admin/login" element={<AdminLogin />} />
            </Routes>
          </Container>
        </main>
      </div>
    </BrowserRouter>
  );
}

export default App;


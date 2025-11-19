import React, { useState, useEffect } from 'react';
import { Container, Tabs, Tab, Row, Col, Card, Alert } from 'react-bootstrap';
import AdminQuotations from '../components/admin/AdminQuotations';
import AdminProducts from '../components/admin/AdminProducts';

// Admin.jsx
// The administration panel to view submitted quotations.

function Admin() {
  const [token, setToken] = useState(localStorage.getItem('access_token') || null);
  const [loginError, setLoginError] = useState(null);

  useEffect(() => {
    const onAuth = () => setToken(localStorage.getItem('access_token') || null);
    window.addEventListener('authChanged', onAuth);
    window.addEventListener('storage', onAuth);
    return () => {
      window.removeEventListener('authChanged', onAuth);
      window.removeEventListener('storage', onAuth);
    };
  }, []);

  const handleLogout = () => {
    setToken(null);
    localStorage.removeItem('access_token');
    window.dispatchEvent(new Event('authChanged'));
  };

  if (!token) {
    return (
      <Row className="justify-content-center align-items-center" style={{ minHeight: '60vh' }}>
        <Col xs={12} md={6} lg={4}>
          <Card>
            <Card.Body>
              <Card.Title className="mb-3">Iniciar sesión (Administrador)</Card.Title>
              {loginError && <Alert variant="danger">{loginError}</Alert>}
              {/* Aquí iría el formulario de login */}
            </Card.Body>
          </Card>
        </Col>
      </Row>
    );
  }

  return (
    <Container className="my-4">
      <div className="mb-4">
        <div className="p-4 rounded-3" style={{ backgroundColor: 'var(--primary-navy)' }}>
          <h2 className="text-white fw-bold mb-1" style={{ letterSpacing: '0.5px' }}>
            <i className="fas fa-tools me-2"></i>
            Panel de Administración
          </h2>
        </div>
      </div>

      <Tabs defaultActiveKey="quotations" id="admin-tabs" className="mb-3">
        <Tab eventKey="quotations" title="Cotizaciones">
          <AdminQuotations />
        </Tab>
        <Tab eventKey="products" title="Productos">
          <AdminProducts />
        </Tab>
      </Tabs>
    </Container>
  );
}

export default Admin;

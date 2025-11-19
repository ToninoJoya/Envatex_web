import React, { useState } from 'react';
import axios from 'axios';
import { Container, Row, Col, Card, Form, Button, Alert } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';

function AdminLogin() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const API_BASE = process.env.REACT_APP_API_URL || 'https://didactic-space-fiesta-g4r6x4549q9xfpvq5-5000.app.github.dev';
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    try {
      const res = await axios.post(`${API_BASE}/api/auth/login`, { username, password });
      const token = res.data.access_token;
      localStorage.setItem('access_token', token);
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      // notify other parts of the app
      try { window.dispatchEvent(new Event('authChanged')); } catch (e) {}
      navigate('/admin');
    } catch (err) {
      setError(err.response?.data?.error || 'Error de autenticación');
    }
  };

  return (
    <Container className="d-flex align-items-center justify-content-center" style={{ minHeight: '80vh' }}>
      <Row className="w-100 justify-content-center">
        <Col md={5} lg={4}>
          <Card className="shadow-sm border-0 p-0">
            <div className="p-4 rounded-top" style={{ backgroundColor: 'var(--primary-navy)' }}>
              <h4 className="text-white fw-bold mb-1" style={{ letterSpacing: '0.5px' }}>
                <i className="fas fa-user-shield me-2"></i>
                Acceso Administrador
              </h4>
            </div>
            <Card.Body className="p-4">
              {error && <Alert variant="danger">{error}</Alert>}
              <Form onSubmit={handleSubmit}>
                <Form.Group className="mb-3" controlId="username">
                  <Form.Label className="fw-bold text-muted">Usuario</Form.Label>
                  <Form.Control
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="form-control-lg"
                    autoFocus
                  />
                </Form.Group>
                <Form.Group className="mb-3" controlId="password">
                  <Form.Label className="fw-bold text-muted">Contraseña</Form.Label>
                  <Form.Control
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="form-control-lg"
                  />
                </Form.Group>
                <Button
                  type="submit"
                  className="w-100"
                  style={{ backgroundColor: 'var(--secondary-blue)', border: 'none', fontWeight: 500 }}
                >
                  Entrar <i className="fas fa-sign-in-alt ms-2"></i>
                </Button>
              </Form>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
}

export default AdminLogin;

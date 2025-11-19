import React from 'react';
import { Container, Row, Col, Button, Card } from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom';

export default function Landing() {
  const navigate = useNavigate();
  const features = [
    {
      icon: <i className="fas fa-tshirt fa-2x" style={{ color: 'var(--secondary-blue)' }}></i>,
      title: 'Productos Personalizados',
      desc: 'Soluciones textiles adaptadas a las necesidades de tu empresa, con calidad garantizada.',
    },
    {
      icon: <i className="fas fa-shipping-fast fa-2x" style={{ color: 'var(--secondary-blue)' }}></i>,
      title: 'Envíos Rápidos',
      desc: 'Logística eficiente para que recibas tus productos en tiempo récord, en todo el país.',
    },
    {
      icon: <i className="fas fa-user-shield fa-2x" style={{ color: 'var(--secondary-blue)' }}></i>,
      title: 'Atención Especializada',
      desc: 'Nuestro equipo te acompaña en cada paso, desde la cotización hasta la entrega final.',
    },
  ];

  return (
    <>
      {/* HERO as Banner inside a Container */}
      <Container>
        <div className="p-5 rounded-3 text-white text-center" style={{ backgroundColor: 'var(--primary-navy)', marginTop: '2rem' }}>
          <img src="/2.png" alt="Logo Envatex" style={{ maxWidth: 160, marginBottom: 8, filter: 'brightness(0) invert(1)' }} />
          <h1 className="display-4 fw-bold mb-3">
            Soluciones Textiles Profesionales
          </h1>
          <p className="lead mb-4">
            Impulsa tu empresa con productos textiles de alta calidad, atención personalizada y entregas rápidas.
          </p>
          <Button
            size="lg"
            className="px-5 cta-primary"
            style={{ border: 'none' }}
            onClick={() => navigate('/cotizar')}
          >
            Solicitar Cotización
          </Button>
        </div>
      </Container>

      {/* FEATURES */}
      <Container className="my-5">
        <Row className="g-4">
          {features.map((f, idx) => (
            <Col key={idx} md={4}>
              <Card className="h-100 shadow-sm border-0 p-4 text-center">
                <div className="mb-3">{f.icon}</div>
                <h5 className="fw-bold mb-2" style={{ color: 'var(--secondary-blue)' }}>
                  {f.title}
                </h5>
                <p className="text-muted">{f.desc}</p>
              </Card>
            </Col>
          ))}
        </Row>
      </Container>
    </>
  );
}



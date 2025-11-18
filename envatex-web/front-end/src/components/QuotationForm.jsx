import React, { useState } from 'react';
import axios from 'axios';
import { Form, Button, Card, ListGroup, Alert } from 'react-bootstrap';

// QuotationForm.jsx
// A form for customers to enter their details and submit their quotation request.

function QuotationForm({ items = [] }) {
  // 6. Inside the component, use useState to manage the form data:
  const [customerName, setCustomerName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [submissionStatus, setSubmissionStatus] = useState(null); // null | 'loading' | 'success' | 'error'

  // 7. Define an async function 'handleSubmit'.
  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmissionStatus('loading');

    // Transform items prop into array of { product_id, quantity }
    const payloadItems = items.map((it) => {
      // Support both shapes: { product, quantity } or { product_id, quantity }
      const productId = it.product?.id ?? it.product_id ?? it.productId ?? null;
      return {
        product_id: productId,
        quantity: it.quantity ?? 1,
      };
    });

    const payload = {
      customer_name: customerName,
      customer_email: customerEmail,
      items: payloadItems,
    };

    try {
      // Use local backend address; change if deploying elsewhere
      const url = 'https://didactic-space-fiesta-g4r6x4549q9xfpvq5-5000.app.github.dev/api/quotations';
      await axios.post(url, payload);
      setSubmissionStatus('success');
      // Optionally clear form
      setCustomerName('');
      setCustomerEmail('');
    } catch (err) {
      setSubmissionStatus('error');
    }
  };

  return (
    <Card>
      <Card.Header>Solicitud de Cotización</Card.Header>
      <Card.Body>
        {items.length === 0 ? (
          <p>Añade productos a tu cotización para continuar.</p>
        ) : (
          <>
            <ListGroup className="mb-3">
              {items.map((it, idx) => {
                const name = it.product?.name ?? it.name ?? `Producto ${it.product_id ?? idx}`;
                const qty = it.quantity ?? 1;
                return (
                  <ListGroup.Item key={idx}>
                    {name} — Cantidad: {qty}
                  </ListGroup.Item>
                );
              })}
            </ListGroup>

            {submissionStatus === 'success' && (
              <Alert variant="success">Tu solicitud se envió correctamente.</Alert>
            )}
            {submissionStatus === 'error' && (
              <Alert variant="danger">Ocurrió un error al enviar la solicitud. Intenta nuevamente.</Alert>
            )}

            <Form onSubmit={handleSubmit}>
              <Form.Group className="mb-3" controlId="qfName">
                <Form.Label>Nombre</Form.Label>
                <Form.Control
                  type="text"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  required
                />
              </Form.Group>

              <Form.Group className="mb-3" controlId="qfEmail">
                <Form.Label>Correo electrónico</Form.Label>
                <Form.Control
                  type="email"
                  value={customerEmail}
                  onChange={(e) => setCustomerEmail(e.target.value)}
                  required
                />
              </Form.Group>

              <Button
                type="submit"
                disabled={submissionStatus === 'loading' || items.length === 0}
              >
                {submissionStatus === 'loading' ? 'Enviando...' : 'Enviar solicitud'}
              </Button>
            </Form>
          </>
        )}
      </Card.Body>
    </Card>
  );
}

export default QuotationForm;

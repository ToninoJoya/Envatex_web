import React, { useState } from 'react';
import axios from 'axios';
import { Card, Button, Form, Table, Alert } from 'react-bootstrap';
import Swal from 'sweetalert2';

function QuotationForm({ items = [], onRemoveItem, onClearCart }) {
  const [customerName, setCustomerName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [submissionStatus, setSubmissionStatus] = useState(null); // null | 'loading' | 'success' | 'error'
  const [errorMsg, setErrorMsg] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmissionStatus('loading');
    setErrorMsg(null);
    try {
      const API_BASE = process.env.REACT_APP_API_URL || 'https://didactic-space-fiesta-g4r6x4549q9xfpvq5-5000.app.github.dev/';
      const payloadItems = items.map((it) => ({
        product_id: it.product?.id ?? it.product_id ?? it.productId ?? null,
        quantity: it.quantity ?? 1,
      }));
      const payload = {
        customer_name: customerName,
        customer_email: customerEmail,
        items: payloadItems,
      };
      await axios.post(`${API_BASE}/api/quotations`, payload);
      setCustomerName('');
      setCustomerEmail('');
      if (typeof onClearCart === 'function') onClearCart();
      setSubmissionStatus('success');
      await Swal.fire({
        title: '¡Cotización Enviada!',
        text: 'Nos pondremos en contacto contigo pronto a ' + customerEmail,
        icon: 'success',
        confirmButtonColor: 'var(--secondary-blue)',
        confirmButtonText: 'Genial'
      });
      setSubmissionStatus(null);
    } catch (err) {
      setSubmissionStatus('error');
      setErrorMsg('No se pudo enviar la solicitud. Intenta más tarde.');
    } finally {
      setSubmissionStatus(null);
    }
  };

  return (
    <Card className="shadow-sm border-0">
      <div className="p-4 rounded-top" style={{ backgroundColor: 'var(--primary-navy)' }}>
        <h4 className="text-white mb-0">
          <i className="fas fa-file-invoice-dollar me-2"></i>
          Resumen de Cotización
        </h4>
      </div>
      <Card.Body>
        {errorMsg && (
          <Alert variant="danger">{errorMsg}</Alert>
        )}
        <Table responsive borderless className="mb-4">
          <tbody>
            {items.map((item, idx) => (
              <tr key={item.product.id ?? item.product_id ?? idx}>
                <td>{item.product?.name ?? item.name}</td>
                <td className="text-center">{item.quantity}</td>
                <td className="text-end">
                  <Button
                    variant="link"
                    size="sm"
                    className="text-danger"
                    onClick={() => onRemoveItem(item.product?.id ?? item.product_id)}
                  >
                    <i className="fas fa-trash-alt"></i>
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
        <Form onSubmit={handleSubmit}>
          <Form.Group className="mb-3">
            <Form.Label>Nombre</Form.Label>
            <Form.Control
              type="text"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              className="form-control-lg"
              required
            />
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Label>Email</Form.Label>
            <Form.Control
              type="email"
              value={customerEmail}
              onChange={(e) => setCustomerEmail(e.target.value)}
              className="form-control-lg"
              required
            />
          </Form.Group>
          <Button
            type="submit"
            size="lg"
            className="w-100"
            style={{ backgroundColor: 'var(--secondary-blue)', border: 'none', fontWeight: 500 }}
            disabled={submissionStatus === 'loading' || items.length === 0}
          >
            {submissionStatus === 'loading' ? 'Enviando...' : <>Enviar Solicitud <i className="fas fa-paper-plane ms-2"></i></>}
          </Button>
          {/* Aseguramos que el estado submissionStatus no interfiera después del SweetAlert */}
          {submissionStatus === 'success' && setSubmissionStatus(null)}
        </Form>
      </Card.Body>
    </Card>
  );
}

export default QuotationForm;

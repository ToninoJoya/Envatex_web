import React, { useState, useEffect, useCallback } from 'react';
import { Accordion, Spinner, Alert, ListGroup, Form, Button } from 'react-bootstrap';
import Swal from 'sweetalert2';
import axios from 'axios';

function AdminQuotations() {
  const [quotations, setQuotations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [responseTexts, setResponseTexts] = useState({});
  const [submitStatus, setSubmitStatus] = useState({});
  const API_BASE = process.env.REACT_APP_API_URL;

  const fetchQuotations = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('access_token');
      if (!token) {
        setError('No se encontró un token de autenticación.');
        setLoading(false);
        return;
      }
      const res = await axios.get(`${API_BASE}/api/quotations`, {
        headers: { Authorization: 'Bearer ' + token }
      });
      setQuotations(res.data || []);
    } catch (err) {
      setError('No se pudieron cargar las cotizaciones.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchQuotations();
  }, [fetchQuotations]);

  const handleDeleteQuotation = async (id) => {
    Swal.fire({
      title: '¿Estás seguro?',
      text: "No podrás revertir esta acción",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Sí, borrar',
      cancelButtonText: 'Cancelar'
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          const token = localStorage.getItem('access_token');
          await axios.delete(`${API_BASE}/api/quotations/${id}`, {
            headers: { Authorization: 'Bearer ' + token }
          });
          setQuotations(prev => prev.filter(q => q.id !== id));
          Swal.fire('Borrado!', 'La cotización ha sido eliminada.', 'success');
        } catch (err) {
          Swal.fire('Error', 'No se pudo eliminar la cotización.', 'error');
        }
      }
    });
  };

  const handleResponseChange = (id, text) => {
    setResponseTexts(prev => ({ ...prev, [id]: text }));
    setSubmitStatus(prev => ({ ...prev, [id]: null }));
  };

  const handleSendResponse = async (id) => {
    const text = (responseTexts[id] || '').trim();
    if (!text) {
      setSubmitStatus(prev => ({ ...prev, [id]: { error: 'La respuesta no puede estar vacía.' } }));
      return;
    }

    setSubmitStatus(prev => ({ ...prev, [id]: { loading: true } }));
    try {
      const token = localStorage.getItem('access_token');
      const res = await axios.patch(`${API_BASE}/api/quotations/${id}`, { admin_response: text }, {
        headers: { Authorization: 'Bearer ' + token }
      });
      const updated = res.data?.quotation;
      if (updated) {
        setQuotations(prev => prev.map(q => (q.id === updated.id ? updated : q)));
        setSubmitStatus(prev => ({ ...prev, [id]: { success: 'Respuesta enviada.' } }));
      }
    } catch (err) {
      setSubmitStatus(prev => ({ ...prev, [id]: { error: 'Error al enviar la respuesta.' } }));
    }
  };

  return (
    <>
      {loading && (
        <div className="py-4 d-flex justify-content-center">
          <Spinner animation="border" role="status">
            <span className="visually-hidden">Cargando...</span>
          </Spinner>
        </div>
      )}

      {error && <Alert variant="danger">{error}</Alert>}

      {!loading && (!quotations || quotations.length === 0) ? (
        <p>No hay cotizaciones para mostrar.</p>
      ) : (
        <Accordion defaultActiveKey="0">
          {quotations.map((quotation, idx) => (
            <Accordion.Item eventKey={String(quotation.id ?? idx)} key={quotation.id ?? idx}>
              <Accordion.Header>
                <div className="w-100 d-flex justify-content-between align-items-center">
                  <div className="d-flex align-items-center">
                    {quotation.admin_response || quotation.status === 'Responded' ? (
                      <i className="fa-solid fa-circle-check text-success me-2"></i>
                    ) : quotation.status === 'Pending' ? (
                      <i className="fa-solid fa-circle text-secondary me-2"></i>
                    ) : (
                      <i className="fa-solid fa-square-xmark text-danger me-2"></i>
                    )}
                    <span>{`Cotización #${quotation.id ?? idx} - ${quotation.customer_name ?? 'Sin nombre'}`}</span>
                  </div>

                  <div>
                    <Button
                      variant="link"
                      size="sm"
                      className="text-danger p-0 me-3"
                      title="Eliminar cotización"
                      aria-label={`Eliminar cotización ${quotation.id ?? idx}`}
                      onClick={e => { e.stopPropagation(); handleDeleteQuotation(quotation.id); }}
                    >
                      <i className="fas fa-trash-alt"></i>
                    </Button>
                  </div>
                </div>
              </Accordion.Header>
              <Accordion.Body>
                <p><strong>Email:</strong> {quotation.customer_email ?? '—'}</p>
                <p><strong>Teléfono:</strong> {quotation.customer_phone ?? '—'}</p>
                <p><strong>Estado:</strong> {quotation.status ?? '—'}</p>

                <h5>Items</h5>
                <ListGroup className="mb-3">
                  {(quotation.items || []).map((it, i) => (
                    <ListGroup.Item key={i} className="d-flex justify-content-between align-items-center">
                      <span>{it.product?.name ?? it.name ?? `Producto ${it.product_id ?? i}`}</span>
                      <span className="fw-bold">Cantidad: {it.quantity ?? 1}</span>
                    </ListGroup.Item>
                  ))}
                </ListGroup>

                <Form>
                  <Form.Group className="mb-2" controlId={`response-${quotation.id}`}>
                    <Form.Label>Respuesta del administrador</Form.Label>
                    <Form.Control
                      as="textarea"
                      rows={3}
                      value={responseTexts[quotation.id] || ''}
                      onChange={e => handleResponseChange(quotation.id, e.target.value)}
                    />
                  </Form.Group>
                  {submitStatus[quotation.id]?.error && <Alert variant="danger">{submitStatus[quotation.id].error}</Alert>}
                  {submitStatus[quotation.id]?.success && <Alert variant="success">{submitStatus[quotation.id].success}</Alert>}
                  <div className="d-flex justify-content-end">
                    <Button
                      variant="primary"
                      onClick={() => handleSendResponse(quotation.id)}
                      disabled={submitStatus[quotation.id]?.loading}
                    >
                      <i className="fas fa-paper-plane me-1"></i>
                      Enviar Respuesta
                    </Button>
                  </div>
                </Form>
              </Accordion.Body>
            </Accordion.Item>
          ))}
        </Accordion>
      )}
    </>
  );
}

export default AdminQuotations;
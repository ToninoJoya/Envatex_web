import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { Container, Spinner, Alert, Accordion, ListGroup, Form, Button, Row, Col, Card, Navbar, Tabs, Tab, Modal, Table } from 'react-bootstrap';

// Admin.jsx
// The administration panel to view submitted quotations.

function Admin() {
  const [quotations, setQuotations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('access_token') || null);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState(null);
  const [responseTexts, setResponseTexts] = useState({});
  const [submitStatus, setSubmitStatus] = useState({});
  // Products state for admin CRUD
  const [products, setProducts] = useState([]);
  const [prodLoading, setProdLoading] = useState(false);
  const [showProdModal, setShowProdModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [productForm, setProductForm] = useState({ name: '', image_url: '', description: '', sku: '' });
  const API_BASE = process.env.REACT_APP_API_URL || 'https://didactic-space-fiesta-g4r6x4549q9xfpvq5-5000.app.github.dev';

  // Configure axios default header when token changes
  useEffect(() => {
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      // ensure axios uses the correct base URL (Codespaces) for all requests
      axios.defaults.baseURL = API_BASE;
      localStorage.setItem('access_token', token);
      // clear login errors on successful token set
      setLoginError(null);
    } else {
      delete axios.defaults.headers.common['Authorization'];
      delete axios.defaults.baseURL;
      localStorage.removeItem('access_token');
      // clear dashboard errors when logged out
      setError(null);
      setQuotations([]);
    }
  }, [token]);

  const fetchQuotations = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await axios.get('/api/quotations');
      setQuotations(res.data || []);
    } catch (err) {
      // If unauthorized, force logout to show login view
      if (err.response?.status === 401) {
        setToken(null);
        setLoginError('Sesión expirada. Por favor, inicia sesión de nuevo.');
        return;
      }
      setError('No se pudieron cargar las cotizaciones.');
    } finally {
      setLoading(false);
    }
  }, [API_BASE]);

  // --- Products fetch moved above useEffect to avoid referencing before initialization ---
  const fetchProducts = useCallback(async () => {
    setProdLoading(true);
    try {
      const res = await axios.get(`${API_BASE}/api/products`);
      setProducts(res.data || []);
    } catch (err) {
      // if product listing is protected and token invalid, force logout
      if (err.response?.status === 401) {
        setToken(null);
        setLoginError('Sesión expirada. Por favor, inicia sesión de nuevo.');
        return;
      }
      console.error('Failed to fetch products', err);
    } finally {
      setProdLoading(false);
    }
  }, []);

  useEffect(() => {
    let mounted = true;
    if (!token) {
      // if no token, don't attempt fetch
      setLoading(false);
      // still load products list (public) even without token
      (async () => {
        await fetchProducts();
      })();
      return () => { mounted = false; };
    }

    // fetch when token becomes available
    (async () => {
      if (mounted) await fetchQuotations();
      if (mounted) await fetchProducts();
    })();

    return () => { mounted = false; };
  }, [token, fetchQuotations, fetchProducts]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoginError(null);
    try {
      const res = await axios.post(`${API_BASE}/api/auth/login`, { username, password });
      const newToken = res.data.access_token;
      // Apply axios defaults immediately so the next request includes the header
      axios.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
      axios.defaults.baseURL = API_BASE;
      setToken(newToken);
      setUsername('');
      setPassword('');
      await fetchQuotations();
    } catch (err) {
      setLoginError(err.response?.data?.error || 'Error de autenticación');
    }
  };

  const handleLogout = () => {
    setToken(null);
    setQuotations([]);
  };

  // Handlers for reply form inside each quotation
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
      const res = await axios.patch(`/api/quotations/${id}`, { admin_response: text });
      const updated = res.data?.quotation;
      if (updated) {
        setQuotations(prev => prev.map(q => (q.id === updated.id ? updated : q)));
        setSubmitStatus(prev => ({ ...prev, [id]: { success: 'Respuesta enviada.' } }));
      } else {
        setSubmitStatus(prev => ({ ...prev, [id]: { success: 'Respuesta enviada.' } }));
      }
    } catch (err) {
      if (err.response?.status === 401) {
        setToken(null);
        setLoginError('Sesión expirada. Por favor, inicia sesión de nuevo.');
        return;
      }
      setSubmitStatus(prev => ({ ...prev, [id]: { error: 'Error al enviar la respuesta.' } }));
    }
  };

  // --- Products CRUD handlers (fetchProducts already defined above) ---

  const handleSaveProduct = async () => {
    const payload = {
      name: productForm.name,
      image_url: productForm.image_url,
      description: productForm.description,
      sku: productForm.sku,
    };
    try {
      if (editingProduct && editingProduct.id) {
        const res = await axios.put(`/api/products/${editingProduct.id}`, payload);
        const updated = res.data?.product;
        if (updated) setProducts(prev => prev.map(p => (p.id === updated.id ? updated : p)));
      } else {
        const res = await axios.post('/api/products', payload);
        const created = res.data?.product;
        if (created) setProducts(prev => [created, ...prev]);
      }
      setShowProdModal(false);
      setEditingProduct(null);
      setProductForm({ name: '', image_url: '', description: '', sku: '' });
    } catch (err) {
      if (err.response?.status === 401) {
        setToken(null);
        setLoginError('Sesión expirada. Por favor, inicia sesión de nuevo.');
        return;
      }
      alert(err.response?.data?.error || 'Error al guardar el producto');
    }
  };

  const handleDeleteProduct = async (id) => {
    if (!window.confirm('¿Eliminar este producto? Esta acción no se puede deshacer.')) return;
    try {
      await axios.delete(`/api/products/${id}`);
      setProducts(prev => prev.filter(p => p.id !== id));
    } catch (err) {
      if (err.response?.status === 401) {
        setToken(null);
        setLoginError('Sesión expirada. Por favor, inicia sesión de nuevo.');
        return;
      }
      alert(err.response?.data?.error || 'Error al eliminar el producto');
    }
  };

  return (
    <Container className="my-4">
      {/* Conditional rendering: Login view */}
      {!token && (
        <Row className="justify-content-center align-items-center" style={{ minHeight: '60vh' }}>
          <Col xs={12} md={6} lg={4}>
            <Card>
              <Card.Body>
                <Card.Title className="mb-3">Iniciar sesión (Administrador)</Card.Title>
                {loginError && <Alert variant="danger">{loginError}</Alert>}
                <Form onSubmit={handleLogin}>
                  <Form.Group className="mb-2" controlId="username">
                    <Form.Label>Usuario</Form.Label>
                    <Form.Control value={username} onChange={e => setUsername(e.target.value)} />
                  </Form.Group>
                  <Form.Group className="mb-3" controlId="password">
                    <Form.Label>Contraseña</Form.Label>
                    <Form.Control type="password" value={password} onChange={e => setPassword(e.target.value)} />
                  </Form.Group>
                  <div className="d-flex justify-content-end">
                    <Button type="submit">Entrar</Button>
                  </div>
                </Form>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      )}

      {/* Dashboard view */}
      {token && (
        <>
          <Navbar bg="light" className="mb-3">
            <Container>
              <Navbar.Brand>Panel de Administración</Navbar.Brand>
              <div className="ms-auto">
                <Button variant="outline-danger" onClick={handleLogout}>Cerrar Sesión</Button>
              </div>
            </Container>
          </Navbar>

          <Tabs defaultActiveKey="quotations" id="admin-tabs" className="mb-3">
            <Tab eventKey="quotations" title="Cotizaciones">
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
                        {/* Icono de estado: check si admin_response existe, sino xmark */}
                        {quotation.admin_response && String(quotation.admin_response).trim() ? (
                          <i className="fa-solid fa-circle-check text-success me-2" aria-hidden="true"></i>
                        ) : (
                          <i className="fa-solid fa-square-xmark text-danger me-2" aria-hidden="true"></i>
                        )}
                        {`Cotización #${quotation.id ?? idx} - ${quotation.customer_name ?? 'Sin nombre'}`}
                      </Accordion.Header>
                      <Accordion.Body>
                        <p><strong>Email:</strong> {quotation.customer_email ?? '—'}</p>
                        <p><strong>Teléfono:</strong> {quotation.customer_phone ?? '—'}</p>
                        <p><strong>Estado:</strong> {quotation.status ?? '—'}</p>

                        <h5>Items</h5>
                        <ListGroup className="mb-3">
                          {(quotation.items || []).map((it, i) => {
                            const name = it.product?.name ?? it.name ?? `Producto ${it.product_id ?? i}`;
                            const qty = it.quantity ?? 1;
                            return (
                              <ListGroup.Item key={i}>
                                {name} — Cantidad: {qty}
                              </ListGroup.Item>
                            );
                          })}
                        </ListGroup>

                        <Form>
                          <Form.Group className="mb-2" controlId={`response-${quotation.id}`}>
                            <Form.Label>Respuesta del administrador</Form.Label>
                            <Form.Control as="textarea" rows={3} value={responseTexts[quotation.id] || ''} onChange={e => handleResponseChange(quotation.id, e.target.value)} />
                          </Form.Group>
                          {submitStatus[quotation.id]?.error && <Alert variant="danger">{submitStatus[quotation.id].error}</Alert>}
                          {submitStatus[quotation.id]?.success && <Alert variant="success">{submitStatus[quotation.id].success}</Alert>}
                          <div className="d-flex justify-content-end">
                            <Button variant="primary" onClick={() => handleSendResponse(quotation.id)} disabled={submitStatus[quotation.id]?.loading}>Enviar Respuesta</Button>
                          </div>
                        </Form>
                      </Accordion.Body>
                    </Accordion.Item>
                  ))}
                </Accordion>
              )}
            </Tab>

            <Tab eventKey="products" title="Productos">
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h5 className="m-0">Productos</h5>
                <div>
                  <Button onClick={() => { setEditingProduct(null); setProductForm({ name: '', image_url: '', description: '', sku: '' }); setShowProdModal(true); }}>
                    <i className="fa-solid fa-plus me-2" />Crear Producto
                  </Button>
                </div>
              </div>

              {prodLoading && (
                <div className="py-3 d-flex justify-content-center"><Spinner animation="border" /></div>
              )}

              {!prodLoading && (!products || products.length === 0) ? (
                <p>No hay productos registrados.</p>
              ) : (
                <Table striped bordered hover>
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Nombre</th>
                      <th>Imagen</th>
                      <th>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {products.map(p => (
                      <tr key={p.id}>
                        <td>{p.id}</td>
                        <td>{p.name}</td>
                        <td>{p.image_url ? <img src={p.image_url} alt={p.name} style={{ height: 40 }} /> : '—'}</td>
                        <td>
                          <Button variant="light" size="sm" className="me-2" onClick={() => { setEditingProduct(p); setProductForm({ name: p.name || '', image_url: p.image_url || '', description: p.description || '', sku: p.sku || '' }); setShowProdModal(true); }}>
                            <i className="fa-solid fa-pen-to-square" />
                          </Button>
                          <Button variant="danger" size="sm" onClick={() => handleDeleteProduct(p.id)}>
                            <i className="fa-solid fa-trash" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              )}

              {/* Product Modal */}
              <Modal show={showProdModal} onHide={() => setShowProdModal(false)}>
                <Modal.Header closeButton>
                  <Modal.Title>{editingProduct ? 'Editar Producto' : 'Crear Producto'}</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                  <Form>
                    <Form.Group className="mb-2">
                      <Form.Label>Nombre</Form.Label>
                      <Form.Control value={productForm.name} onChange={e => setProductForm(prev => ({ ...prev, name: e.target.value }))} />
                    </Form.Group>
                    <Form.Group className="mb-2">
                      <Form.Label>SKU</Form.Label>
                      <Form.Control value={productForm.sku} onChange={e => setProductForm(prev => ({ ...prev, sku: e.target.value }))} />
                    </Form.Group>
                    <Form.Group className="mb-2">
                      <Form.Label>Imagen (URL)</Form.Label>
                      <Form.Control value={productForm.image_url} onChange={e => setProductForm(prev => ({ ...prev, image_url: e.target.value }))} />
                    </Form.Group>
                    <Form.Group className="mb-2">
                      <Form.Label>Descripción</Form.Label>
                      <Form.Control as="textarea" rows={3} value={productForm.description} onChange={e => setProductForm(prev => ({ ...prev, description: e.target.value }))} />
                    </Form.Group>
                  </Form>
                </Modal.Body>
                <Modal.Footer>
                  <Button variant="secondary" onClick={() => setShowProdModal(false)}>Cancelar</Button>
                  <Button variant="primary" onClick={() => handleSaveProduct()}>{editingProduct ? 'Guardar cambios' : 'Crear'}</Button>
                </Modal.Footer>
              </Modal>
            </Tab>
          </Tabs>
        </>
      )}
    </Container>
  );
}

export default Admin;

// ProductList.jsx
// Component that displays all available products from the Envatex catalog.
//
// This component should:
// 1. Import React, useState, and useEffect from 'react'.
// 2. Import axios from 'axios'.
// 3. Import Bootstrap components: Container, Row, Col, Card, Button, Spinner from 'react-bootstrap'.
//
// 4. Create a functional component called ProductList.
// 5. Inside the component:
//    - Use useState to create a 'products' state variable, initialized as an empty array.
//    - Use useState to create a 'loading' state variable, initialized as true.
//    - Use useState to create an 'error' state variable, initialized as null.
//
// 6. Use useEffect to fetch products when the component mounts:
//    - The effect should be an async function.
//    - Use a try/catch block for error handling.
//    - Inside the try block:
//      - Make a GET request to 'http://127.0.0.1:5000/api/products' using axios.
//      - Update the 'products' state with the response data.
//    - Inside the catch block:
//      - Update the 'error' state with a user-friendly error message.
//    - In a 'finally' block:
//      - Set loading to false.
//
// 7. In the return statement (JSX):
//    - Use a main <Container> to wrap everything.
//    - Add a title like "Nuestro Catálogo de Productos".
//    - If 'loading' is true, display a Bootstrap <Spinner> animation.
//    - If 'error' is not null, display an alert with the error message.
//    - If not loading and no error, map over the 'products' array.
//    - For each product, render a <Col> inside a <Row>. The Col should be responsive (e.g., for medium screens and up, show 3 cards per row).
//    - Inside the <Col>, render a <Card>.
//    - The <Card.Body> should display:
//      - <Card.Title> with the product.name
//      - <Card.Subtitle> with the product.sku
//      - <Card.Text> with the product.description
//      - A <Button> with the text "Añadir a la cotización".
//
// 8. Export the component as default.

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Container, Row, Col, Card, Button, Spinner, Alert } from 'react-bootstrap';

function ProductList({ onAddToCart }) {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let mounted = true;

    const fetchProducts = async () => {
      try {
        const API_BASE = process.env.REACT_APP_API_URL || 'https://didactic-space-fiesta-g4r6x4549q9xfpvq5-5000.app.github.dev/';
        const res = await axios.get(`${API_BASE}/api/products`);
        if (mounted) setProducts(res.data || []);
      } catch (err) {
        if (mounted) setError('No se pudieron cargar los productos. Intenta más tarde.');
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetchProducts();
    return () => { mounted = false; };
  }, []);

  return (
    <Container className="my-4">
      {/* Encabezado elegante */}
      <div className="mb-4">
        <h2
          className="fw-bold"
          style={{
            color: 'var(--primary-navy)',
            letterSpacing: '0.5px',
            marginBottom: '0.5rem'
          }}
        >
          Nuestros Productos
        </h2>
        <p className="text-muted mb-2">
          Selecciona los ítems que necesitas y añádelos a tu cotización.
        </p>
        <div
          style={{
            borderBottom: '2px solid #e3e6ea',
            marginBottom: '1.5rem'
          }}
        />
      </div>

      {loading && (
        <div className="d-flex justify-content-center py-5">
          <Spinner animation="border" role="status">
            <span className="visually-hidden">Cargando...</span>
          </Spinner>
        </div>
      )}

      {error && (
        <Alert variant="danger">{error}</Alert>
      )}

      {!loading && !error && (
        <Row>
          {products.length === 0 && (
            <Col>
              <p>No hay productos disponibles.</p>
            </Col>
          )}

          {products.map((p) => (
            <Col key={p.id} xs={12} sm={6} md={4} className="mb-4">
              <Card className="h-100 shadow-sm border-0 product-card-hover">
                {p.image_url ? (
                  <div style={{ height: '200px', overflow: 'hidden' }}>
                    <Card.Img
                      variant="top"
                      src={p.image_url}
                      alt={p.name}
                      style={{ objectFit: 'cover', width: '100%', height: '100%' }}
                    />
                  </div>
                ) : (
                  <div className="bg-light d-flex align-items-center justify-content-center" style={{ height: '200px' }}>
                    <i className="fas fa-image fa-3x text-muted"></i>
                  </div>
                )}
                <Card.Body className="d-flex flex-column">
                  {/* Título del producto más sutil */}
                  <h6 className="fw-bold mb-2" style={{ color: 'var(--primary-navy)' }}>
                    {p.name}
                  </h6>
                  {p.sku && <Card.Subtitle className="mb-2 text-muted">SKU: {p.sku}</Card.Subtitle>}
                  {p.description && <Card.Text className="flex-grow-1">{p.description}</Card.Text>}
                  <div className="mt-3">
                    <Button
                      style={{ backgroundColor: 'var(--secondary-blue)', border: 'none', fontWeight: 500 }}
                      className="w-100"
                      onClick={() => onAddToCart && onAddToCart(p)}
                    >
                      Agregar <i className="fas fa-cart-plus ms-2"></i>
                    </Button>
                  </div>
                </Card.Body>
              </Card>
            </Col>
          ))}
        </Row>
      )}
    </Container>
  );
}

export default ProductList;

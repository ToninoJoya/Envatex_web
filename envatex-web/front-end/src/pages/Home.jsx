import React from 'react';
import { Container, Row, Col } from 'react-bootstrap';
import ProductList from '../components/ProductList';
import QuotationForm from '../components/QuotationForm';

// Home.jsx
// The main page for customers, showing products and the quotation form.

function Home({ items = [], onAddToCart, onRemoveItem, onClearCart }) {
  return (
    <Container className="my-4">
      <Row>
        <Col md={8}>
          <ProductList onAddToCart={onAddToCart} />
        </Col>
        <Col md={4}>
          <QuotationForm items={items} onRemoveItem={onRemoveItem} onClearCart={onClearCart} />
        </Col>
      </Row>
    </Container>
  );
}

export default Home;

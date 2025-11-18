// App.js
// Main component of the Envatex application.

// 1. Import React.
// 2. Import the main CSS file './App.css'.
// 3. Import the ProductList component from './components/ProductList'.
// 4. Import a simple Navbar from 'react-bootstrap' to give the page a header.

import React, { useState } from 'react';
import './App.css';
import ProductList from './components/ProductList';
import QuotationForm from './components/QuotationForm';
import { Navbar, Container, Row, Col } from 'react-bootstrap';

// App.js
// Main component that manages the state of the quotation cart.

function App() {
  // 6. Inside the component:
  //    - Use useState to create a 'quotationItems' state variable, initialized as an empty array. This will be our cart.
  const [quotationItems, setQuotationItems] = useState([]);

  // 7. Define a function 'handleAddToCart'.
  //    - It should accept a 'product' object as an argument.
  //    - Logic: Check if the product is already in 'quotationItems' (by its id).
  //      - If it is, increment the quantity of the existing item.
  //      - If it's not, add a new item to the array with the product details and quantity 1.
  //    - Use the functional form of setQuotationItems to update the state correctly based on the previous state.
  const handleAddToCart = (product) => {
    setQuotationItems((prev) => {
      const existing = prev.find((it) => it.product.id === product.id);
      if (existing) {
        return prev.map((it) =>
          it.product.id === product.id ? { ...it, quantity: it.quantity + 1 } : it
        );
      }
      return [...prev, { product, quantity: 1 }];
    });
  };

  return (
    <div className="App">
      <Navbar bg="light" expand="lg">
        <Container>
          <Navbar.Brand>Envatex</Navbar.Brand>
        </Container>
      </Navbar>

      <main>
        <Container className="my-4">
          <Row>
            <Col md={8}>
              <ProductList onAddToCart={handleAddToCart} />
            </Col>
            <Col md={4}>
              <QuotationForm items={quotationItems} />
            </Col>
          </Row>
        </Container>
      </main>
    </div>
  );
}

export default App;


import React, { useState, useEffect, useCallback } from 'react';
import { Table, Button, Spinner, Alert } from 'react-bootstrap';
import Swal from 'sweetalert2';
import axios from 'axios';
import ProductModal from './ProductModal';

function AdminProducts() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);

  const API_BASE = process.env.REACT_APP_API_URL;
  const fetchProducts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('access_token');
      if (!token) {
        setError('No se encontró un token de autenticación.');
        setLoading(false);
        return;
      }
      const res = await axios.get(`${API_BASE}/api/products`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setProducts(res.data || []);
    } catch (err) {
      setError('No se pudieron cargar los productos.');
    } finally {
      setLoading(false);
    }
  }, [API_BASE]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const handleDeleteProduct = async (id) => {
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
          await axios.delete(`${API_BASE}/api/products/${id}`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          setProducts(prev => prev.filter(p => p.id !== id));
          Swal.fire('Borrado!', 'El producto ha sido eliminado.', 'success');
        } catch (err) {
          Swal.fire('Error', 'No se pudo eliminar el producto.', 'error');
        }
      }
    });
  };

  const handleShowModal = (product = null) => {
    setEditingProduct(product);
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setEditingProduct(null);
    setShowModal(false);
  };

  const handleSaveProduct = async (productData) => {
    try {
      const token = localStorage.getItem('access_token');
      if (editingProduct) {
        const res = await axios.put(`${API_BASE}/api/products/${editingProduct.id}`, productData, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setProducts(prev => prev.map(p => (p.id === res.data.product.id ? res.data.product : p)));
      } else {
        const res = await axios.post(`${API_BASE}/api/products`, productData, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setProducts(prev => [res.data.product, ...prev]);
      }
      handleCloseModal();
    } catch (err) {
      Swal.fire('Error', 'No se pudo guardar el producto.', 'error');
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

      {!loading && (!products || products.length === 0) ? (
        <p>No hay productos para mostrar.</p>
      ) : (
        <Table striped bordered hover>
          <thead>
            <tr>
              <th>Nombre</th>
              <th>SKU</th>
              <th>Descripción</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {products.map(product => (
              <tr key={product.id}>
                <td>{product.name}</td>
                <td>{product.sku}</td>
                <td>{product.description}</td>
                <td>
                  <div className="d-flex gap-2">
                    <Button
                      variant="outline-secondary"
                      size="sm"
                      title="Editar"
                      onClick={() => handleShowModal(product)}
                      aria-label={`Editar ${product.name}`}
                    >
                      <i className="fas fa-pen me-1"></i>
                      <span className="d-none d-md-inline">Editar</span>
                    </Button>

                    <Button
                      variant="outline-danger"
                      size="sm"
                      title="Eliminar"
                      onClick={() => handleDeleteProduct(product.id)}
                      aria-label={`Eliminar ${product.name}`}
                    >
                      <i className="fas fa-trash-alt me-1"></i>
                      <span className="d-none d-md-inline">Eliminar</span>
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
      )}

      <div className="d-flex justify-content-end mt-3">
        <Button
          variant="primary"
          onClick={() => handleShowModal()}
          aria-label="Crear Producto"
        >
          <i className="fas fa-plus me-2"></i>
          Crear Producto
        </Button>
      </div>

      <ProductModal
        show={showModal}
        handleClose={handleCloseModal}
        handleSubmit={handleSaveProduct}
        productData={editingProduct}
      />
    </>
  );
}

export default AdminProducts;
import React, { useState, useEffect } from 'react';
import { Modal, Button, Form } from 'react-bootstrap';

function ProductModal({ show, handleClose, handleSubmit, productData }) {
  const [formData, setFormData] = useState({
    name: '',
    sku: '',
    description: '',
    image_url: ''
  });
  const [imageFile, setImageFile] = useState(null);

  useEffect(() => {
    if (productData) {
      setFormData(productData);
      setImageFile(null);
    } else {
      setFormData({ name: '', sku: '', description: '', image_url: '' });
      setImageFile(null);
    }
  }, [productData]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files && e.target.files[0];
    setImageFile(file || null);
  };

  const onSubmit = (e) => {
    e.preventDefault();

    const fd = new FormData();
    fd.append('name', formData.name || '');
    fd.append('sku', formData.sku || '');
    fd.append('description', formData.description || '');
    // Si se seleccionó un archivo, lo agregamos; si no, enviamos image_url si existe
    if (imageFile) {
      fd.append('image', imageFile);
    } else if (formData.image_url) {
      fd.append('image_url', formData.image_url);
    }

    handleSubmit(fd);
  };

  return (
    <Modal show={show} onHide={handleClose} centered>
      <Modal.Header closeButton>
        <Modal.Title>{productData ? 'Editar Producto' : 'Crear Producto'}</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Form onSubmit={onSubmit}>
          <Form.Group className="mb-3">
            <Form.Label>Nombre</Form.Label>
            <Form.Control
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
            />
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Label>SKU</Form.Label>
            <Form.Control
              type="text"
              name="sku"
              value={formData.sku}
              onChange={handleChange}
            />
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Label>Descripción</Form.Label>
            <Form.Control
              as="textarea"
              name="description"
              value={formData.description}
              onChange={handleChange}
            />
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Label>Imagen (subir desde tu PC)</Form.Label>
            <Form.Control
              type="file"
              name="image"
              accept="image/*"
              onChange={handleFileChange}
            />
            {formData.image_url && !imageFile && (
              <small className="text-muted">URL actual: {formData.image_url}</small>
            )}
          </Form.Group>
          <div className="d-flex justify-content-end">
            <Button variant="secondary" onClick={handleClose} className="me-2">
              Cancelar
            </Button>
            <Button variant="primary" type="submit">
              {productData ? 'Guardar Cambios' : 'Crear Producto'}
            </Button>
          </div>
        </Form>
      </Modal.Body>
    </Modal>
  );
}

export default ProductModal;
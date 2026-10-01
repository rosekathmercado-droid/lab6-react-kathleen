import { useEffect, useState } from 'react';
import axios from 'axios';
import './App.css';

const API_URL = 'https://mercado-kathleen-lavalust-api.onrender.com/api';

function App() {
  const [token, setToken] = useState(
    localStorage.getItem('access_token') || ''
  );

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const [products, setProducts] = useState([]);

  const [productName, setProductName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [quantity, setQuantity] = useState('');

  const [editingId, setEditingId] = useState(null);

  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const login = async (e) => {
    e.preventDefault();

    setMessage('');
    setError('');
    setLoading(true);

    try {
      const response = await axios.post(
        `${API_URL}/login`,
        {
          username: username.trim(),
          password: password
        }
      );

      console.log('LOGIN RAW:', response.data);
      console.log('LOGIN TYPE:', typeof response.data);

      let data = response.data;

      if (typeof data === 'string') {
        data = data
          .replace(/```php/gi, '')
          .replace(/```/g, '')
          .trim();

        console.log('AFTER CLEAN:', data);

        data = JSON.parse(data);
      }

      console.log('FINAL LOGIN DATA:', data);
      console.log('TOKENS:', data.tokens);

      const accessToken = data?.tokens?.access_token;

      if (!accessToken) {
        throw new Error('No access token found.');
      }

      localStorage.setItem('access_token', accessToken);

      setToken(accessToken);

      setUsername('');
      setPassword('');

      setError('');
      setMessage('Login successful.');

    } catch (err) {
      console.error('LOGIN ERROR:', err);

      if (err.response) {
        console.error('STATUS:', err.response.status);
        console.error('RESPONSE:', err.response.data);
      }

      setError(
        err.message || 'Login failed.'
      );
    } finally {
      setLoading(false);
    }
  };

  const getProducts = async () => {
    const savedToken = localStorage.getItem('access_token');

    if (!savedToken) {
      return;
    }

    try {
      const response = await axios.get(
        `${API_URL}/products`,
        {
          headers: {
            Authorization: `Bearer ${savedToken}`
          }
        }
      );

      let data = response.data;

      if (typeof data === 'string') {
        data = data
          .replace(/```php/gi, '')
          .replace(/```/g, '')
          .trim();

        data = JSON.parse(data);
      }

      setProducts(data?.data || []);

    } catch (err) {
      console.error('GET PRODUCTS ERROR:', err);

      if (err.response?.status === 401) {
        logout();
        return;
      }

      setError(
        err.response?.data?.error ||
        err.response?.data?.message ||
        'Failed to load products.'
      );
    }
  };

  useEffect(() => {
    if (token) {
      getProducts();
    }
  }, [token]);

  const saveProduct = async (e) => {
    e.preventDefault();

    setMessage('');
    setError('');

    if (
      !productName ||
      description === '' ||
      price === '' ||
      quantity === ''
    ) {
      setError('Please fill in all product fields.');
      return;
    }

    const savedToken = localStorage.getItem('access_token');

    if (!savedToken) {
      setError('You are not logged in.');
      return;
    }

    const productData = {
      product_name: productName,
      description: description,
      price: Number(price),
      quantity: Number(quantity)
    };

    try {
      if (editingId) {
        await axios.put(
          `${API_URL}/products/${editingId}`,
          productData,
          {
            headers: {
              Authorization: `Bearer ${savedToken}`,
              'Content-Type': 'application/json'
            }
          }
        );

        setMessage('Product updated successfully.');

      } else {
        await axios.post(
          `${API_URL}/products`,
          productData,
          {
            headers: {
              Authorization: `Bearer ${savedToken}`,
              'Content-Type': 'application/json'
            }
          }
        );

        setMessage('Product added successfully.');
      }

      clearForm();
      await getProducts();

    } catch (err) {
      console.error('SAVE PRODUCT ERROR:', err);

      if (err.response?.status === 401) {
        logout();
        return;
      }

      setError(
        err.response?.data?.error ||
        err.response?.data?.message ||
        'Failed to save product.'
      );
    }
  };

  const editProduct = (product) => {
    setEditingId(product.id);
    setProductName(product.product_name);
    setDescription(product.description);
    setPrice(product.price);
    setQuantity(product.quantity);

    setMessage('');
    setError('');

    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };

  const deleteProduct = async (id) => {
    const confirmDelete = window.confirm(
      'Are you sure you want to delete this product?'
    );

    if (!confirmDelete) {
      return;
    }

    const savedToken = localStorage.getItem('access_token');

    if (!savedToken) {
      setError('You are not logged in.');
      return;
    }

    setMessage('');
    setError('');

    try {
      await axios.delete(
        `${API_URL}/products/${id}`,
        {
          headers: {
            Authorization: `Bearer ${savedToken}`
          }
        }
      );

      setMessage('Product deleted successfully.');

      await getProducts();

    } catch (err) {
      console.error('DELETE PRODUCT ERROR:', err);

      if (err.response?.status === 401) {
        logout();
        return;
      }

      setError(
        err.response?.data?.error ||
        err.response?.data?.message ||
        'Failed to delete product.'
      );
    }
  };

  const clearForm = () => {
    setEditingId(null);
    setProductName('');
    setDescription('');
    setPrice('');
    setQuantity('');
  };

  const logout = () => {
    localStorage.removeItem('access_token');

    setToken('');
    setProducts([]);

    clearForm();

    setMessage('');
    setError('');
  };

  if (!token) {
    return (
      <div className="app">
        <div className="login-container">
          <div className="login-card">

            <h1>Product Management</h1>

            <p className="subtitle">
              React + LavaLust API
            </p>

            <form onSubmit={login}>

              <div className="form-group">
                <label>Username</label>

                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Enter username"
                  autoComplete="username"
                />
              </div>

              <div className="form-group">
                <label>Password</label>

                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter password"
                  autoComplete="current-password"
                />
              </div>

              {error && (
                <p className="error-message">
                  {error}
                </p>
              )}

              <button
                type="submit"
                className="primary-button"
                disabled={loading}
              >
                {loading ? 'Signing in...' : 'Sign In'}
              </button>

            </form>

          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="app">

      <header className="header">

        <div>
          <h1>Product Management</h1>
          <p>React + LavaLust API</p>
        </div>

        <button
          onClick={logout}
          className="logout-button"
        >
          Logout
        </button>

      </header>

      <main className="container">

        {message && (
          <div className="success-message">
            {message}
          </div>
        )}

        {error && (
          <div className="error-message">
            {error}
          </div>
        )}

        <section className="card">

          <h2>
            {editingId ? 'Edit Product' : 'Add Product'}
          </h2>

          <form onSubmit={saveProduct}>

            <div className="form-row">

              <div className="form-group">

                <label>Product Name</label>

                <input
                  type="text"
                  value={productName}
                  onChange={(e) => setProductName(e.target.value)}
                  placeholder="Enter product name"
                />

              </div>

              <div className="form-group">

                <label>Description</label>

                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Enter description"
                />

              </div>

            </div>

            <div className="form-row">

              <div className="form-group">

                <label>Price</label>

                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  placeholder="0.00"
                />

              </div>

              <div className="form-group">

                <label>Quantity</label>

                <input
                  type="number"
                  min="0"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  placeholder="0"
                />

              </div>

            </div>

            <div className="button-group">

              <button
                type="submit"
                className="primary-button"
              >
                {editingId ? 'Update Product' : 'Add Product'}
              </button>

              {editingId && (
                <button
                  type="button"
                  className="secondary-button"
                  onClick={clearForm}
                >
                  Cancel
                </button>
              )}

            </div>

          </form>

        </section>

        <section className="card">

          <div className="section-header">

            <h2>Product List</h2>

            <button
              onClick={getProducts}
              className="secondary-button"
            >
              Refresh
            </button>

          </div>

          {products.length === 0 ? (

            <p className="empty-message">
              No products found.
            </p>

          ) : (

            <div className="table-container">

              <table>

                <thead>

                  <tr>
                    <th>ID</th>
                    <th>Product Name</th>
                    <th>Description</th>
                    <th>Price</th>
                    <th>Quantity</th>
                    <th>Actions</th>
                  </tr>

                </thead>

                <tbody>

                  {products.map((product) => (

                    <tr key={product.id}>

                      <td>
                        {product.id}
                      </td>

                      <td>
                        {product.product_name}
                      </td>

                      <td>
                        {product.description}
                      </td>

                      <td>
                        ₱{Number(product.price).toFixed(2)}
                      </td>

                      <td>
                        {product.quantity}
                      </td>

                      <td>

                        <div className="action-buttons">

                          <button
                            className="edit-button"
                            onClick={() => editProduct(product)}
                          >
                            Edit
                          </button>

                          <button
                            className="delete-button"
                            onClick={() => deleteProduct(product.id)}
                          >
                            Delete
                          </button>

                        </div>

                      </td>

                    </tr>

                  ))}

                </tbody>

              </table>

            </div>

          )}

        </section>

      </main>

    </div>
  );
}

export default App;
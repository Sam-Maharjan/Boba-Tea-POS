import React, { useState, useEffect } from "react";
import "./InventoryScreen.css";

export default function MenuScreen({ onBack }) {
  const API_BASE = process.env.REACT_APP_BACKEND_URL;

  const [products, setProducts] = useState([]);
  const [selectedProductId, setSelectedProductId] = useState(null);
  const [recipe, setRecipe] = useState([]);
  const [showPriceDialog, setShowPriceDialog] = useState(false);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [newPrice, setNewPrice] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [notification, setNotification] = useState({ show: false, message: "", type: "" });

  // States for adding new product
  const [newProduct, setNewProduct] = useState({
    product_name: "",
    unit_price: "",
    vegan: false,
    category: ""
  });

  const [availableIngredients, setAvailableIngredients] = useState([]);
  const [selectedIngredients, setSelectedIngredients] = useState([]);

  useEffect(() => {
    fetchProducts();
    fetchIngredients();
  }, []);

  useEffect(() => {
    if (selectedProductId) {
      fetchRecipe(selectedProductId);
    }
  }, [selectedProductId]);

  const showNotification = (message, type = "success") => {
    setNotification({ show: true, message, type });
    setTimeout(() => {
      setNotification({ show: false, message: "", type: "" });
    }, 3000);
  };

  const fetchProducts = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await fetch(`${API_BASE}/api/fetchProducts`);
      if (!response.ok) throw new Error("Failed to fetch products");
      const data = await response.json();
      setProducts(data);

      if (data.length > 0 && !selectedProductId) {
        setSelectedProductId(data[0].product_id);
      }
    } catch (err) {
      setError(`Unable to fetch products. Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const fetchIngredients = async () => {
    try {
      const response = await fetch(`${API_BASE}/api/inventory`);
      if (!response.ok) throw new Error("Failed to fetch ingredients");
      const data = await response.json();
      setAvailableIngredients(data);
    } catch (err) {
      console.error("Ingredients error:", err);
    }
  };

  const fetchRecipe = async (productId) => {
    try {
      const response = await fetch(`${API_BASE}/api/products/${productId}/recipe`);
      if (!response.ok) throw new Error("Failed to fetch recipe");
      const data = await response.json();
      setRecipe(data);
    } catch (err) {
      setRecipe([]);
    }
  };

  const handleEditPrice = () => {
    if (!selectedProductId) {
      showNotification("Select an item to update price.", "error");
      return;
    }
    const product = products.find((p) => p.product_id === selectedProductId);
    setNewPrice(product?.unit_price || "");
    setShowPriceDialog(true);
  };

  const confirmPriceChange = async () => {
    const price = parseFloat(newPrice);
    if (isNaN(price) || price <= 0) {
      showNotification("Enter a valid positive number.", "error");
      return;
    }

    try {
      const response = await fetch(`${API_BASE}/api/products/${selectedProductId}/price`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ unit_price: price })
      });

      if (!response.ok) throw new Error("Failed to update price");

      showNotification("Price updated!", "success");
      setShowPriceDialog(false);
      fetchProducts();
    } catch (err) {
      showNotification(err.message, "error");
    }
  };

  const handleAddProduct = () => {
    setNewProduct({
      product_name: "",
      unit_price: "",
      vegan: false,
      category: ""
    });
    setSelectedIngredients([]);
    setShowAddDialog(true);
  };

  const addIngredientToRecipe = () => {
    setSelectedIngredients([...selectedIngredients, { ingredient_id: "", quantity: "" }]);
  };

  const updateIngredient = (index, field, value) => {
    const updated = [...selectedIngredients];
    updated[index][field] = value;
    setSelectedIngredients(updated);
  };

  const removeIngredient = (index) => {
    setSelectedIngredients(selectedIngredients.filter((_, i) => i !== index));
  };

  const confirmAddProduct = async () => {
    if (!newProduct.product_name.trim()) {
      showNotification("Product name required", "error");
      return;
    }

    const price = parseFloat(newProduct.unit_price);
    if (isNaN(price) || price <= 0) {
      showNotification("Enter a valid price", "error");
      return;
    }

    if (selectedIngredients.length === 0) {
      showNotification("Add at least one ingredient", "error");
      return;
    }

    for (let ing of selectedIngredients) {
      if (!ing.ingredient_id || !ing.quantity) {
        showNotification("Complete all ingredient fields", "error");
        return;
      }
    }

    setLoading(true);

    try {
      const response = await fetch(`${API_BASE}/api/products`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          product_name: newProduct.product_name,
          unit_price: price,
          vegan: newProduct.vegan,
          category: newProduct.category,
          recipe: selectedIngredients.map((i) => ({
            ingredient_id: parseInt(i.ingredient_id),
            quantity_per_unit: parseFloat(i.quantity)
          }))
        })
      });

      if (!response.ok) throw new Error("Failed to add product");

      const data = await response.json();

      showNotification("Product added!", "success");
      setShowAddDialog(false);
      fetchProducts();
      setSelectedProductId(data.product_id);
    } catch (err) {
      showNotification(err.message, "error");
    } finally {
      setLoading(false);
    }
  };

  const selectedProduct = products.find((p) => p.product_id === selectedProductId);

  return (
    <div className="manager-container">
      <h1 className="manager-title">Products & Recipes</h1>

      {error && <div className="error-message">{error}</div>}

      {notification.show && (
        <div className={`notification ${notification.type}`}>{notification.message}</div>
      )}

      <div style={{ display: "flex", gap: "20px", width: "90%", justifyContent: "center" }}>
        
        {/* Products Table */}
        <table className="inventory-table" style={{ flex: 1 }}>
          <thead>
            <tr>
              <th>ID</th>
              <th>Product</th>
              <th>Price ($)</th>
              <th>Vegan</th>
              <th>Category</th>
            </tr>
          </thead>
          <tbody>
            {products.map((p) => (
              <tr
                key={p.product_id}
                onClick={() => setSelectedProductId(p.product_id)}
                className={p.product_id === selectedProductId ? "selected" : ""}
              >
                <td>{p.product_id}</td>
                <td>{p.product_name}</td>
                <td>${parseFloat(p.unit_price).toFixed(2)}</td>
                <td>{p.vegan ? "Yes" : "No"}</td>
                <td>{p.category}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Recipe Table */}
        <table className="inventory-table" style={{ flex: 1 }}>
          <thead>
            <tr>
              <th>Ingredient ID</th>
              <th>Ingredient</th>
              <th>Qty per item</th>
            </tr>
          </thead>
          <tbody>
            {recipe.length === 0 ? (
              <tr>
                <td colSpan="3" style={{ textAlign: "center", color: "#999" }}>
                  {selectedProductId ? "No recipe found" : "Select a product"}
                </td>
              </tr>
            ) : (
              recipe.map((r) => (
                <tr key={r.ingredient_id}>
                  <td>{r.ingredient_id}</td>
                  <td>{r.ingredient_name}</td>
                  <td>{parseFloat(r.quantity_per_unit).toFixed(1)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Buttons */}
      <div className="button-grid" style={{ marginTop: "30px" }}>
        <button className="manager-btn" onClick={onBack} disabled={loading}>Back</button>
        <button className="manager-btn" onClick={fetchProducts} disabled={loading}>
          {loading ? "Loading..." : "Refresh"}
        </button>
        <button className="manager-btn" onClick={handleEditPrice} disabled={loading}>
          Change Price
        </button>
        <button className="manager-btn" onClick={handleAddProduct} disabled={loading}>
          Add Product
        </button>
      </div>

      {/* Price Dialog */}
      {showPriceDialog && (
        <div className="dialog-overlay">
          <div className="dialog-box">
            <h2>Price Update</h2>
            <p>
              Item: {selectedProduct?.product_name} (ID {selectedProductId})
            </p>
            <input
              type="number"
              step="0.01"
              min="0.01"
              value={newPrice}
              onChange={(e) => setNewPrice(e.target.value)}
            />
            <div className="dialog-buttons">
              <button onClick={confirmPriceChange}>OK</button>
              <button onClick={() => setShowPriceDialog(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* Add Product Dialog */}
      {showAddDialog && (
        <div className="dialog-overlay">
          <div className="dialog-box" style={{ minWidth: "500px" }}>
            <h2>Add New Product</h2>

            <label>
              Product Name:
              <input
                type="text"
                value={newProduct.product_name}
                onChange={(e) => setNewProduct({ ...newProduct, product_name: e.target.value })}
              />
            </label>

            <label>
              Price ($):
              <input
                type="number"
                step="0.01"
                min="0.01"
                value={newProduct.unit_price}
                onChange={(e) => setNewProduct({ ...newProduct, unit_price: e.target.value })}
              />
            </label>

            <label>
              Category:
              <input
                type="text"
                value={newProduct.category}
                onChange={(e) => setNewProduct({ ...newProduct, category: e.target.value })}
                placeholder="e.g., Milky Series, Ice-Blended, Fruity Beverage"
              />
            </label>

            <label style={{ display: "flex", alignItems: "center", marginTop: "10px" }}>
              <input
                type="checkbox"
                checked={newProduct.vegan}
                onChange={(e) => setNewProduct({ ...newProduct, vegan: e.target.checked })}
                style={{ width: "auto", marginRight: "10px" }}
              />
              Vegan
            </label>

            {/* Recipe Section */}
            <div style={{ marginTop: "20px" }}>
              <h3 style={{ marginBottom: "10px" }}>Recipe</h3>

              <button
                onClick={addIngredientToRecipe}
                style={{
                  padding: "6px 12px",
                  backgroundColor: "#2d6cdf",
                  color: "white",
                  borderRadius: "4px"
                }}
              >
                + Add Ingredient
              </button>

              {selectedIngredients.length === 0 ? (
                <p style={{ color: "#999", marginTop: "10px" }}>No ingredients added yet</p>
              ) : (
                <div style={{ marginTop: "10px", maxHeight: "200px", overflowY: "auto" }}>
                  {selectedIngredients.map((ing, idx) => (
                    <div key={idx} style={{ display: "flex", gap: "10px", marginBottom: "10px" }}>
                      <select
                        value={ing.ingredient_id}
                        onChange={(e) => updateIngredient(idx, "ingredient_id", e.target.value)}
                      >
                        <option value="">Select ingredient...</option>
                        {availableIngredients.map((i) => (
                          <option key={i.ingredient_id} value={i.ingredient_id}>
                            {i.ingredient_name}
                          </option>
                        ))}
                      </select>

                      <input
                        type="number"
                        step="0.1"
                        min="0.1"
                        value={ing.quantity}
                        onChange={(e) => updateIngredient(idx, "quantity", e.target.value)}
                        placeholder="Qty"
                      />

                      <button
                        onClick={() => removeIngredient(idx)}
                        style={{
                          backgroundColor: "#f44336",
                          color: "white",
                          borderRadius: "4px",
                          padding: "8px 12px"
                        }}
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="dialog-buttons" style={{ marginTop: "20px" }}>
              <button onClick={confirmAddProduct}>Add Product</button>
              <button onClick={() => setShowAddDialog(false)}>Cancel</button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}

import React, { useState, useEffect } from "react";
import "./InventoryScreen.css";

export default function InventoryScreen({ onBack }) {
  const API_BASE = process.env.REACT_APP_BACKEND_URL;

  const [inventory, setInventory] = useState([]);
  const [selectedRow, setSelectedRow] = useState(null);
  const [showRestockDialog, setShowRestockDialog] = useState(false);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [restockAmount, setRestockAmount] = useState("");

  const [newIngredientName, setNewIngredientName] = useState("");
  const [newIngredientQty, setNewIngredientQty] = useState("");
  const [newIsAddOn, setNewIsAddOn] = useState(false);
  const [newPricePerUnit, setNewPricePerUnit] = useState("");

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [notification, setNotification] = useState({ show: false, message: "", type: "" });

  useEffect(() => {
    fetchInventory();
  }, []);

  const showNotification = (message, type = "success") => {
    setNotification({ show: true, message, type });
    setTimeout(() => {
      setNotification({ show: false, message: "", type: "" });
    }, 3000);
  };

  const fetchInventory = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await fetch(`${API_BASE}/api/inventory`);
      if (!response.ok) {
        const errText = await response.text();
        throw new Error(`Failed to fetch inventory: ${response.status} - ${errText}`);
      }
      const data = await response.json();
      setInventory(data);
    } catch (err) {
      console.error("Fetch error:", err);
      setError(`Unable to connect to server: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleRestock = () => {
    if (selectedRow === null) {
      showNotification("Please select an item to restock.", "error");
      return;
    }
    setRestockAmount("");
    setShowRestockDialog(true);
  };

  const confirmRestock = async () => {
    const amount = parseFloat(restockAmount);
    if (isNaN(amount) || amount <= 0) {
      showNotification("Enter a valid positive number.", "error");
      return;
    }

    const item = inventory[selectedRow];
    setLoading(true);

    try {
      const response = await fetch(`${API_BASE}/api/inventory/${item.ingredient_id}/restock`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ delta: amount })
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || "Failed to restock");
      }

      showNotification(`Restocked ${item.ingredient_name} by ${amount}`, "success");
      setShowRestockDialog(false);
      fetchInventory();

    } catch (err) {
      showNotification(`Error: ${err.message}`, "error");
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = () => {
    setNewIngredientName("");
    setNewIngredientQty("");
    setNewIsAddOn(false);
    setNewPricePerUnit("");
    setShowAddDialog(true);
  };

  const confirmAdd = async () => {
    const name = newIngredientName.trim();
    const qty = parseFloat(newIngredientQty);
    const ppu = parseFloat(newPricePerUnit);

    if (!name) {
      showNotification("Ingredient name cannot be empty.", "error");
      return;
    }

    if (isNaN(qty) || qty < 0) {
      showNotification("Enter valid non-negative quantity.", "error");
      return;
    }

    if (isNaN(ppu) || ppu < 0) {
      showNotification("Enter valid non-negative price per unit.", "error");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`${API_BASE}/api/inventory`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ingredient_name: name,
          on_hand_quantity: qty,
          is_add_on: newIsAddOn,
          price_per_unit: ppu
        })
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || "Failed to add ingredient");
      }

      const newItem = await response.json();
      showNotification(`Added ${newItem.ingredient_name}`, "success");
      setShowAddDialog(false);
      fetchInventory();

    } catch (err) {
      showNotification(`Error: ${err.message}`, "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="manager-container">
      <h1 className="manager-title">Inventory</h1>

      {error && <div className="error-message">{error}</div>}

      {notification.show && (
        <div className={`notification ${notification.type}`}>
          {notification.message}
        </div>
      )}

      <table className="inventory-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>Name</th>
            <th>Qty</th>
            <th>Add-On</th>
            <th>Price/Unit ($)</th>
          </tr>
        </thead>
        <tbody>
          {inventory.map((item, index) => (
            <tr
              key={item.ingredient_id}
              className={selectedRow === index ? "selected" : ""}
              onClick={() => setSelectedRow(index)}
            >
              <td>{item.ingredient_id}</td>
              <td>{item.ingredient_name}</td>
              <td>{item.on_hand_quantity}</td>
              <td>{item.is_add_on ? "Yes" : "No"}</td>
              <td>{item.price_per_unit}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="button-grid" style={{ marginTop: "30px" }}>
        <button className="manager-btn" onClick={onBack} disabled={loading}>Back</button>
        <button className="manager-btn" onClick={fetchInventory} disabled={loading}>Refresh</button>
        <button className="manager-btn" onClick={handleAdd} disabled={loading}>Add</button>
        <button className="manager-btn" onClick={handleRestock} disabled={loading}>Restock</button>
      </div>

      {/* Restock Dialog */}
      {showRestockDialog && (
        <div className="dialog-overlay">
          <div className="dialog-box">
            <h2>Restock</h2>
            <p>
              Item: {inventory[selectedRow]?.ingredient_name} (ID {inventory[selectedRow]?.ingredient_id})
            </p>

            <label>
              Increase quantity:
              <input
                type="number"
                step="0.1"
                min="0.1"
                value={restockAmount}
                onChange={(e) => setRestockAmount(e.target.value)}
              />
            </label>

            <div className="dialog-buttons">
              <button onClick={confirmRestock}>OK</button>
              <button onClick={() => setShowRestockDialog(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* Add Ingredient Dialog */}
      {showAddDialog && (
        <div className="dialog-overlay">
          <div className="dialog-box">
            <h2>Add Ingredient</h2>

            <label>
              Ingredient Name:
              <input
                type="text"
                value={newIngredientName}
                onChange={(e) => setNewIngredientName(e.target.value)}
              />
            </label>

            <label>
              Starting Quantity:
              <input
                type="number"
                step="0.1"
                min="0"
                value={newIngredientQty}
                onChange={(e) => setNewIngredientQty(e.target.value)}
              />
            </label>

            <label>
              Add-On Item:
              <input
                type="checkbox"
                checked={newIsAddOn}
                onChange={(e) => setNewIsAddOn(e.target.checked)}
              />
            </label>

            <label>
              Price Per Unit ($):
              <input
                type="number"
                step="0.01"
                min="0"
                value={newPricePerUnit}
                onChange={(e) => setNewPricePerUnit(e.target.value)}
              />
            </label>

            <div className="dialog-buttons">
              <button onClick={confirmAdd}>OK</button>
              <button onClick={() => setShowAddDialog(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

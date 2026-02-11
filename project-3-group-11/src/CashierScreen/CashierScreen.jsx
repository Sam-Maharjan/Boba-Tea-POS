import React, { useEffect, useState } from 'react';
import './CashierScreen.css';

function CashierScreen() {
    const API_BASE = process.env.REACT_APP_BACKEND_URL;
    const [products, setProducts] = useState([]);
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [items, setItems] = useState([]);
    const [orderTotal, setOrderTotal] = useState(0);
    const [productCategories, setProductCategories] = useState([]);
    const [modificationsOpen, setModificationsOpen] = useState(false);
    const [availableModifications, setAvailableModifications] = useState([]);
    const [selectedModifications, setSelectedModifications] = useState([]);
    const [sugarLevel, setSugarLevel] = useState('100%');
    const [sizeLevel, setSizeLevel] = useState('normal');
    const [iceLevel, setIceLevel] = useState('regular');
    const [quantity, setQuantity] = useState(1);
    const [selectedCategory, setSelectedCategory] = useState('');

    const [orderData, setOrderData] = useState({
        total_amount: 0,
        employee_id: 4,
        items: []
    });

    const openModifications = (product) => {
        setSelectedProduct(product);
        setSelectedModifications([]);
        setQuantity(1);

        fetch(`${API_BASE}/api/modifications`)
            .then(response => {
                if (!response.ok) {
                    throw new Error('Network response was not ok');
                }
                return response.json();
            })
            .then(data => setAvailableModifications(data))
            .catch(error => console.error('Error fetching modifications:', error));

        setModificationsOpen(true);
    };

    const closeModifications = () => {
        setSelectedProduct(null);
        setAvailableModifications([]);
        setSelectedModifications([]);
        setSugarLevel('100%');
        setSizeLevel('normal');
        setIceLevel('regular');
        setQuantity(1);
        setModificationsOpen(false);
    };

    useEffect(()=>{ 
        fetch(`${API_BASE}/api/fetchProducts`)
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(data => setProducts(data))
        .catch(error => console.error('Error fetching products:', error));
    },[API_BASE]);

    useEffect(()=>{ 
        fetch(`${API_BASE}/api/product_categories`)
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(data => setProductCategories(data))
        .catch(error => console.error('Error fetching product categories:', error));
    },[API_BASE]);

    const addItem = () => {
        if (!selectedProduct) return;

        const newItem = {
            name: selectedProduct.product_name,
            price: selectedProduct.unit_price,
            modifications: selectedModifications,
            sugar_level: sugarLevel,
            size_level: sizeLevel,
            ice_level: iceLevel,
            quantity: quantity,
        };

        const modificationPrice = selectedModifications.reduce((sum, mod) => {
            return sum + (Number(mod.price_per_unit) || 0);
        }, 0);

        const itemPrice = Number(newItem.price) + modificationPrice;
        const totalPrice = (itemPrice * quantity);

        setOrderTotal(prev => (Number(prev) + totalPrice));

        setItems(prev => [...prev, newItem]);

        setOrderData(prev => ({
            ...prev,
            total_amount: (Number(prev.total_amount) + totalPrice).toFixed(2),
            items: [...prev.items, {
                product_id: selectedProduct.product_id,
                quantity: quantity,
                unit_price_at_sale: itemPrice.toFixed(2),
                modifications: selectedModifications,
                sugar_level: sugarLevel,
                size_level: sizeLevel,
                ice_level: iceLevel,
            }]
        }));
    };

    const toggleModification = (modification) => {
        const alreadySelected = selectedModifications.find(
            m => m.ingredient_id === modification.ingredient_id
        );
        
        if (alreadySelected) {
            setSelectedModifications(
                selectedModifications.filter(m => m.ingredient_id !== modification.ingredient_id)
            );
        } else {
            setSelectedModifications([...selectedModifications, modification]);
        }
    };

    const incrementItem = (index) => {
        const itemToIncrement = items[index];
        const modificationPrice = itemToIncrement.modifications.reduce((sum, mod) => {
            return sum + (Number(mod.price_per_unit) || 0);
        }, 0);
        const itemPrice = Number(itemToIncrement.price) + modificationPrice;
        const totalItemPrice = itemPrice;

        setOrderTotal(prev => (Number(prev) + totalItemPrice));

        const newItems = [...items];
        newItems[index].quantity += 1;
        setItems(newItems);

        setOrderData(prev => ({
            ...prev,
            total_amount: (Number(prev.total_amount) + totalItemPrice).toFixed(2),
            items: prev.items.map((item, i) => 
                i === index 
                ? { ...item, quantity: item.quantity + 1 } 
                : item
            )
        }));
    };

    const decrementItem = (index) => {
        const itemToDecrement = items[index];
        if (itemToDecrement.quantity <= 1) return;

        const modificationPrice = itemToDecrement.modifications.reduce((sum, mod) => {
            return sum + (Number(mod.price_per_unit) || 0);
        }, 0);
        const itemPrice = Number(itemToDecrement.price) + modificationPrice;
        const totalItemPrice = itemPrice;

        setOrderTotal(prev => (Number(prev) - totalItemPrice));

        const newItems = [...items];
        newItems[index].quantity -= 1;
        setItems(newItems);

        setOrderData(prev => ({
            ...prev,
            total_amount: (Number(prev.total_amount) - totalItemPrice).toFixed(2),
            items: prev.items.map((item, i) => 
                i === index 
                ? { ...item, quantity: item.quantity - 1 } 
                : item
            )
        }));
    }

    const removeItem = (index) => {
        const itemToRemove = items[index];
        const modificationPrice = itemToRemove.modifications.reduce((sum, mod) => {
            return sum + (Number(mod.price_per_unit) || 0);
        }, 0);
        const itemPrice = Number(itemToRemove.price) + modificationPrice;
        const totalItemPrice = itemPrice * itemToRemove.quantity;

        setOrderTotal(prev => (Number(prev) - totalItemPrice));

        setItems(prev => prev.filter((_, i) => i !== index));

        setOrderData(prev => ({
            ...prev,
            total_amount: (Number(prev.total_amount) - totalItemPrice).toFixed(2),
            items: prev.items.filter((_, i) => i !== index)
        }));
    };

    const clear = () =>{
        setItems([]);
        setOrderTotal(0);
        setOrderData({
            total_amount: 0,
            employee_id: 4,
            items: []
        });
    };

    const checkout = async (e) => {
        e.preventDefault();

        if(Number(orderData.total_amount) > 0){
            try {
                const response = await fetch(`${API_BASE}/api/postOrder`, {
                    method: "POST",
                    headers: {
                    "Content-Type": "application/json"
                    },
                    body: JSON.stringify(orderData)
                });

                if (!response.ok) {
                    throw new Error("Network response was not ok");
                }

                setItems([]);
                setOrderTotal(0);
                setOrderData({
                    total_amount: 0,
                    employee_id: 4,
                    items: []
                });
            } 

            catch (error) {
                console.error("Error posting order:", error);
            }
        }
    };

    const getProductCategoryId = (product) => {
        return product.category
    };

    const filteredProducts = selectedCategory
        ? products.filter(p => {
            const catId = getProductCategoryId(p);
            return catId !== null && String(catId) === String(selectedCategory);
        })
        : products;

    return (
    <div className="container">
        <div style={{ position: 'absolute', top: 12, left: 12, zIndex: 50 }}>
            <label className="category-filter-dropdown" style={{ marginRight: 8 }}>Category:</label>
            <select
                className="category-filter-dropdown"
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
            >
                <option value="">All</option>
                {productCategories.map(cat => (
                    <option key={cat} value={cat}>
                        {cat}
                    </option>
                ))}
            </select>
        </div>

        <div className="order" style={{ paddingTop: 48 }}>
            <ul className='orderButtons'>
            {filteredProducts.map(p => (
                <button 
                onClick={() => {
                    openModifications(p);
                }} 
                key={p.product_id} className='orderButton'>
                {p.product_name}
                </button>
            ))}</ul>

            {modificationsOpen && (
                <div className="modifications-overlay">
                <div className="modifications-content">
                    <h2>Modifications</h2>
                    
                    <div className="customizations-section">
                        <div className="customizations-grid">
                        <div className="customization-field">
                                <label>Quantity:</label>
                                <div className="quantity-selector">
                                    <button 
                                        className="quantity-btn"
                                        onClick={() => setQuantity(Math.max(1, quantity - 1))}
                                    >
                                        −
                                    </button>
                                    <span className="quantity-display">{quantity}</span>
                                    <button 
                                        className="quantity-btn"
                                        onClick={() => setQuantity(Math.min(100, quantity + 1))}
                                    >
                                        +
                                    </button>
                                </div>
                            </div>
                            <div className="customization-field">
                                <label htmlFor="sugar-select">Sugar Level:</label>
                                <select 
                                    id="sugar-select"
                                    value={sugarLevel}
                                    onChange={(e) => setSugarLevel(e.target.value)}
                                >
                                    <option value="200%">200%</option>
                                    <option value="150%">150%</option>
                                    <option value="100%">100%</option>
                                    <option value="80%">80%</option>
                                    <option value="50%">50%</option>
                                    <option value="30%">30%</option>
                                    <option value="0%">0%</option>
                                </select>
                            </div>
                            <div className="customization-field">
                                <label htmlFor="size-select">Size:</label>
                                <select 
                                    id="size-select"
                                    value={sizeLevel}
                                    onChange={(e) => setSizeLevel(e.target.value)}
                                >
                                    <option value="small">Small</option>
                                    <option value="normal">Normal</option>
                                    <option value="large">Large</option>
                                </select>
                            </div>
                            <div className="customization-field">
                                <label htmlFor="ice-select">Temperature:</label>
                                <select 
                                    id="ice-select"
                                    value={iceLevel}
                                    onChange={(e) => setIceLevel(e.target.value)}
                                >
                                    <option value="no_ice">No Ice</option>
                                    <option value="less">Less Ice</option>
                                    <option value="regular">Regular Ice</option>
                                    <option value="hot">Hot</option>
                                </select>
                            </div>
                        </div>
                    </div>
                    
                    <div className="modifications-sections">
                        <div className="modifications-column">
                            <h3>Add-ons</h3>
                            <div className="modifications-list">
                                {availableModifications.map(mod => {
                                    const isSelected = selectedModifications.some(
                                        m => m.ingredient_id === mod.ingredient_id
                                    );
                                    return (
                                        <div 
                                            key={mod.ingredient_id} 
                                            className={`modification-item ${isSelected ? 'selected' : ''}`}
                                            onClick={() => toggleModification(mod)}
                                            style={{ cursor: 'pointer' }}
                                        >
                                            <span>{mod.ingredient_name}</span>
                                            <span>${(mod.price_per_unit || 0).toFixed(2)}</span>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                    <div className='mod-button-container'>
                        <button className='mod-button' onClick={() => {addItem(); closeModifications(); }}>Add</button>
                        <button className='mod-button' onClick={closeModifications}>Cancel</button>
                    </div>
                </div>
            </div>
            )}
        </div>
        <div className="checkout">
        
        <div className='checkoutContainer'>
            <ul className="orderItems">
                {items.map((item, index) => {
                    const modificationPrice = item.modifications.reduce((sum, mod) => {
                        return sum + (Number(mod.price_per_unit) || 0);
                    }, 0);
                    const itemPrice = Number(item.price) + modificationPrice;
                    const totalItemPrice = (itemPrice * item.quantity).toFixed(2);

                    return (
                    <li key={index} className="orderItem">
                            <div className="itemHeader">
                                <span>{item.name}</span>
                                <span> ${totalItemPrice}</span>
                            </div>
                            <div className="itemCustomizations">
                                <span className="customization-tag">Sugar: {item.sugar_level}</span>
                                <span className="customization-tag">Size: {item.size_level}</span>
                                <span className="customization-tag">Ice: {item.ice_level}</span>
                            </div>
                            {item.modifications && item.modifications.length > 0 && (
                                <ul className="itemModifications">
                                    {item.modifications.map((mod, modIndex) => (
                                        <li key={modIndex} className="modification">
                                            + {mod.ingredient_name} ${(mod.price_per_unit || 0).toFixed(2)}
                                        </li>
                                    ))}
                                </ul>
                            )}
                        <div className='quantity-change-container'>
                            <button className='quantity-change-button' onClick={() => decrementItem(index)}>-</button>
                            <span>{item.quantity}</span>
                            <button className='quantity-change-button' onClick={() => incrementItem(index)}>+</button>
                            <button className='remove-item-button' onClick={() => removeItem(index)}>X</button>
                        </div>
                    </li>
                    );
                })}
            </ul>
        </div>

        <div>
            <p>${Number(orderTotal).toFixed(2)}</p>
            <button onClick={clear} className='orderButton'>Cancel</button>
            <button onClick={checkout} className='orderButton'>Checkout</button>
        </div>
        </div >
    </div>
);}

export default CashierScreen;

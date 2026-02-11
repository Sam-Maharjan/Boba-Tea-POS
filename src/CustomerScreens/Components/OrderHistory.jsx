import React from 'react';
import './OrderHistory.css';

export default function OrderHistory({ orders, onReorder, onClose }) {
    return (
        <div className="order-history-modal-overlay" onClick={onClose}>
            <div className="order-history-modal" onClick={(e) => e.stopPropagation()}>
                <div className="order-history-header">
                    <h3>Your Recent Orders</h3>
                    <button className="close-btn" onClick={onClose} aria-label="Close">
                        ✕
                    </button>
                </div>

                {(!orders || orders.length === 0) ? (
                    <div className="order-history-empty">
                        <p>No previous orders</p>
                    </div>
                ) : (
                    <div className="order-history-content">
                        {orders.map((order) => (
                            <div key={order.order_id} className="order-card">
                                <div className="order-header">
                                    <span className="order-id">Order #{order.order_id}</span>
                                    <span className="order-date">
                                        {new Date(order.order_date).toLocaleDateString()}
                                    </span>
                                </div>
                                <div className="order-items">
                                    {order.items.map((item, idx) => (
                                        <div key={idx} className="order-item-container">
                                            <div className="order-item">
                                                <span className="item-history-name">{item.product_name}</span>
                                                <span className="item-qty">x{item.quantity}</span>
                                                <button
                                                    className="reorder-item-btn"
                                                    onClick={() => onReorder(item)}
                                                    aria-label={`Re-order ${item.product_name}`}
                                                >
                                                    + Add
                                                </button>
                                            </div>
                                            {(item.size_level || item.sugar_level || item.ice_level) && (
                                                <div className="order-item-options">
                                                    {item.size_level && item.size_level !== 'normal' && (
                                                        <span className="item-option">Size: {item.size_level}</span>
                                                    )}
                                                    {item.sugar_level && item.sugar_level !== '100%' && (
                                                        <span className="item-option">Sugar: {item.sugar_level}</span>
                                                    )}
                                                    {item.ice_level && item.ice_level !== 'regular' && (
                                                        <span className="item-option">Temperature: {item.ice_level}</span>
                                                    )}
                                                </div>
                                            )}
                                            {item.modifications && item.modifications.length > 0 && (
                                                <div className="order-item-mods">
                                                    {item.modifications.map((mod, modIdx) => (
                                                        <span key={modIdx} className="item-mod">
                                                            + {mod.ingredient_name}
                                                        </span>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                                <div className="order-footer">
                                    <span className="order-total">
                                        Total: ${order.total_amount.toFixed(2)}
                                    </span>
                                    <button
                                        className="reorder-all-btn"
                                        onClick={() => order.items.forEach(item => onReorder(item))}
                                        aria-label={`Re-order all items from order #${order.order_id}`}
                                    >
                                        Re-order All
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
import React, { useState, useEffect } from 'react';
import { fetchProducts } from './services/menuService';
import MenuItem from './components/MenuItem';
import './MenuScreen.css';

const MenuScreen = () => {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const loadProducts = async () => {
            try {
                const data = await fetchProducts();
                setProducts(data);
            } catch (err) {
                setError('Failed to load menu items');
            } finally {
                setLoading(false);
            }
        };

        loadProducts();
    }, []);

    useEffect(() => {
        let scrollAmount = 1;

        const autoScroll = () => {
            const scrollHeight = document.documentElement.scrollHeight;
            const scrollPosition = window.scrollY; 

                window.scrollBy(0, scrollAmount); 

                if (scrollPosition + window.innerHeight >= scrollHeight) {
                    scrollAmount = -1; 
                }
                else if (scrollPosition <= 0) {
                    scrollAmount = 1; 
                }
        };

        const interval = setInterval(autoScroll, 20); 
        return () => clearInterval(interval);
    }, []);

    if (loading) return <div className="menu-loading">Loading menu...</div>;
    if (error) return <div className="menu-error">{error}</div>;

    return (
        <div className="menu-screen">
            <h1 className="menu-title">Menu</h1>
            <div className="menu-grid">
                {products.map(product => (
                    <MenuItem key={product.product_id} product={product} />
                ))}
            </div>
        </div>
    );
};

export default MenuScreen;
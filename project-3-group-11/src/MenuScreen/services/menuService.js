const API_BASE_URL = process.env.REACT_APP_BACKEND_URL || 'http://127.0.0.1:5000';

export const fetchProducts = async () => {
    try {
        const response = await fetch(`${API_BASE_URL}/api/fetchProducts`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        return data || [];
    } catch (error) {
        console.error('Error fetching products:', error);
        throw error;
    }
};

export const formatPrice = (price) => {
    return `$${parseFloat(price).toFixed(2)}`;
};
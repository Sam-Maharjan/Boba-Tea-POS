import React, { useEffect, useState } from "react";
import ItemTile from "./Components/ItemTile";
import ShopppingCartScreen from "./ShopppingCartScreen";
import TextSettings from "./Components/TextSettings";
import OrderHistory from "./Components/OrderHistory";
import { useUser } from "@clerk/clerk-react";
import "./CustomerScreen.css";

import FreshBrew11Black from "./assets/FreshBrew_11_black.webp";
import FreshBrew11Green from "./assets/FreshBrew_11_green.webp";
import Fruity14 from "./assets/Fruity_14.webp";
import Fruity15 from "./assets/Fruity_15.webp";
import Fruity18 from "./assets/Fruity_18+(1).webp";
import MilkSeries01 from "./assets/MilkSeries_01.webp";
import MilkSeries02 from "./assets/MilkSeries_02.webp";
import MilkSeries03 from "./assets/MilkSeries_03.webp";
import MilkSeries04 from "./assets/MilkSeries_04.webp";
import MilkSeries05 from "./assets/MilkSeries_05.webp";
import MilkSeries06 from "./assets/MilkSeries_06.webp";
import MilkSeries07 from "./assets/MilkSeries_07.webp";
import MilkSeries08 from "./assets/MilkSeries_08.webp";
import MilkSeries09 from "./assets/MilkSeries_09.webp";
import MilkSeries10 from "./assets/MilkSeries_10.webp";

export default function CustomerScreen() {
    const API_BASE =
        (process.env.REACT_APP_BACKEND_URL &&
            process.env.REACT_APP_BACKEND_URL.trim()) ||
        "";

    const API_WEATHER = process.env.REACT_APP_WEATHER_API;
    const { user } = useUser();
    const [products, setProducts] = useState([]);
    const [productCategories, setProductCategories] = useState([]);
    const [selectedCategory, setSelectedCategory] = useState("");

    const [cartItems, setCartItems] = useState({});
    const [showCart, setShowCart] = useState(false);
    const [cartTotal, setCartTotal] = useState(0);
    const [temp, setTemp] = useState(null);
    const [selectedLocation, setSelectedLocation] = useState("college-station");
    const [veganOnly, setVeganOnly] = useState(false);
    const [fontSize, setFontSize] = useState("16");
    const [fontFamily, setFontFamily] = useState("default");
    const [highContrast, setHighContrast] = useState(false);
    const [toasts, setToasts] = useState([]);
    const [badgePop, setBadgePop] = useState(false);

    const [showModal, setShowModal] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [availableModifications, setAvailableModifications] = useState([]);
    const [selectedModifications, setSelectedModifications] = useState([]);
    const [sugarLevel, setSugarLevel] = useState("100%");
    const [sizeLevel, setSizeLevel] = useState("normal");
    const [iceLevel, setIceLevel] = useState("regular");
    const [quantity, setQuantity] = useState(1);

    // Order history state
    const [orders, setOrders] = useState([]);
    const [ordersLoading, setOrdersLoading] = useState(false);
    const [showOrderHistory, setShowOrderHistory] = useState(false);

    // Image mapping for menu items - using emoji SVGs
    const createEmojiSvg = (emoji) => {
        return `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 200 200'%3E%3Crect fill='%23f8f8f8' width='200' height='200'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' font-size='100' fill='%23333'%3E${emoji}%3C/text%3E%3C/svg%3E`;
    };

    const productImages = {
        "classic pearl milk tea": MilkSeries01,
        "honey pearl milk tea": MilkSeries02,
        "coffee creama": MilkSeries03,
        "coffee milk tea w/ coffee jelly": MilkSeries04,
        "hokkaido pearl milk tea": MilkSeries05,
        "thai pearl milk tea": MilkSeries06,
        "taro pearl milk tea": MilkSeries07,
        "mango green milk tea": MilkSeries08,
        "golden retriever": FreshBrew11Green,
        "coconut pearl milk tea": MilkSeries09,
        "classic tea": FreshBrew11Black,
        "honey tea": Fruity14,
        "mango green tea": Fruity15,
        "passion chess": Fruity18,
        "berry lychee burst": Fruity14,
        "peach tea w/ honey jelly": Fruity15,
        "mango & passion fruit tea": Fruity18,
        "honey lemonade": Fruity14,
        "matcha pearl milk tea": MilkSeries01,
        "matcha fresh milk": MilkSeries02,
        "strawberry matcha fresh milk": MilkSeries03,
        "mango matcha fresh milk": MilkSeries04,
        "matcha ice blended": MilkSeries05,
        "oreo w/ pearl": MilkSeries06,
        "taro w/ pudding": MilkSeries07,
        "thai tea w/ pearl": MilkSeries08,
        "coffee w/ ice cream": MilkSeries09,
        "mango w/ ice cream": MilkSeries10,
        "strawberry w/ lychee jelly & ice cream": Fruity18,
        "peach tea w/ lychee jelly": Fruity15,
        "lava flow": Fruity14,
        "tiger boba": MilkSeries10,
        "strawberry coconut": Fruity15,
        "strawberry coconut ice blended": Fruity18,
        "halo halo": MilkSeries09,
        "halo halo ice blended": MilkSeries10,
        "wintermelon lemonade": Fruity14,
        "wintermelon lemonade ice blended": Fruity15,
        "wintermelon w/ fresh milk": MilkSeries03,
    };

    const locations = {
        "college-station": { lat: 30.621, lon: -96.3255, name: "College Station" },
        houston: { lat: 29.7604, lon: -95.3698, name: "Houston" },
        austin: { lat: 30.2672, lon: -97.7431, name: "Austin" },
    };

    const fetchWeather = (locationKey) => {
        if (!API_WEATHER) return;
        const location = locations[locationKey];
        fetch(
            `https://api.openweathermap.org/data/2.5/weather?lat=${location.lat}&lon=${location.lon}&units=imperial&appid=${API_WEATHER}`
        )
            .then((response) => {
                if (!response.ok)
                    throw new Error("Network response was not ok");
                return response.json();
            })
            .then((data) => setTemp(data && data.main ? data.main.temp : null))
            .catch(() => { });
    };

    const calculateCartTotal = (items) => {
        return Object.values(items).reduce((total, item) => {
            return total + item.quantity * item.unit_price;
        }, 0);
    };

    const getCartItemsArray = () => {
        return Object.values(cartItems);
    };

    const getTotalItemCount = () => {
        return Object.values(cartItems).reduce(
            (total, item) => total + item.quantity,
            0
        );
    };

    const addToast = (message) => {
        const id = Date.now();
        setToasts((prev) => [...prev, { id, message }]);

        // Remove toast after 3 seconds
        setTimeout(() => {
            setToasts((prev) => prev.filter((toast) => toast.id !== id));
        }, 3000);
    };

    const triggerBadgePop = () => {
        setBadgePop(true);
        setTimeout(() => setBadgePop(false), 400);
    };

    const getProductImage = (productName) => {
        const normalizedName = (productName || "").toLowerCase();
        return (
            productImages[normalizedName] ||
            "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 200 200'%3E%3Crect fill='%23f0f0f0' width='200' height='200'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' font-size='100' fill='%23333'%3E🧋%3C/text%3E%3C/svg%3E"
        );
    };

    const openModifications = (product) => {
        setSelectedProduct(product);
        setSelectedModifications([]);
        setSugarLevel("100%");
        setSizeLevel("normal");
        setIceLevel("regular");
        setQuantity(1);
        setShowModal(true);

        fetch(`${API_BASE}/api/modifications`)
            .then((res) => {
                if (!res.ok) {
                    throw new Error("Failed to fetch modifications");
                }
                return res.json();
            })
            .then((data) => {
                if (Array.isArray(data)) {
                    setAvailableModifications(data);
                } else {
                    setAvailableModifications([]);
                }
            })
            .catch(() => {
                setAvailableModifications([]);
            });
    };

    const closeModifications = () => {
        setShowModal(false);
        setSelectedProduct(null);
        setSelectedModifications([]);
        setQuantity(1);
    };

    const toggleModification = (modification) => {
        setSelectedModifications((prev) => {
            const exists = prev.find(
                (m) => m.ingredient_id === modification.ingredient_id
            );
            if (exists) {
                return prev.filter(
                    (m) => m.ingredient_id !== modification.ingredient_id
                );
            }
            return [...prev, modification];
        });
    };

    const changeQuantity = (delta) => {
        setQuantity((prev) => Math.max(1, prev + delta));
    };

    const getSelectedModsExtraPrice = () => {
        return selectedModifications.reduce((sum, mod) => {
            const price = Number(mod.price_per_unit ?? 0);
            if (Number.isNaN(price)) {
                return sum;
            }
            return sum + price;
        }, 0);
    };

    const handleAddToCartWithMods = () => {
        if (!selectedProduct) return;

        const name =
            selectedProduct.product_name ??
            selectedProduct.name ??
            "Sample Item";
        const basePrice = Number(
            selectedProduct.unit_price ?? selectedProduct.price ?? 9.99
        );
        const modsExtra = getSelectedModsExtraPrice();
        const unitPrice = basePrice + modsExtra;

        const productId =
            selectedProduct.product_id ??
            selectedProduct.id ??
            name.toLowerCase().replace(/\s+/g, "-");

        const lineId = `${productId}-${Date.now()}-${Math.random()
            .toString(36)
            .slice(2, 8)}`;

        const newItem = {
            product_id: productId,
            product_name: name,
            unit_price: unitPrice,
            quantity,
            sugar_level: sugarLevel,
            size_level: sizeLevel,
            ice_level: iceLevel,
            modifications: selectedModifications,
            base_unit_price: basePrice,
            mods_unit_price: modsExtra,
        };

        const updatedItems = {
            ...cartItems,
            [lineId]: newItem,
        };

        setCartItems(updatedItems);
        setCartTotal(calculateCartTotal(updatedItems));
        addToast(`Added ${quantity}x ${name} to cart!`);
        triggerBadgePop();
        closeModifications();
    };

    useEffect(() => {
        document.documentElement.style.fontSize = `${fontSize}px`;
    }, [fontSize]);

    useEffect(() => {
        const fontMap = {
            default: "system-ui, sans-serif",
            arial: "Arial, sans-serif",
            verdana: "Verdana, sans-serif",
            georgia: "Georgia, serif",
            comic: "'Comic Sans MS', cursive, sans-serif",
            dyslexic: "'OpenDyslexic', sans-serif",
        };
        document.body.style.fontFamily = fontMap[fontFamily] || fontMap.default;
    }, [fontFamily]);

    useEffect(() => {
        const initGoogleTranslate = () => {
            if (window.google && window.google.translate) {
                new window.google.translate.TranslateElement(
                    { pageLanguage: "en" },
                    "google_translate_element"
                );
            }
        };

        if (!window.googleTranslateScriptAdded) {
            window.googleTranslateScriptAdded = true;
            const script = document.createElement("script");
            script.type = "text/javascript";
            script.src =
                "https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit";
            script.async = true;
            document.body.appendChild(script);
            window.googleTranslateElementInit = initGoogleTranslate;
        } else {
            initGoogleTranslate();
        }
    }, []);

    useEffect(() => {
        fetch(`${API_BASE}/api/fetchProducts`)
            .then((response) => {
                if (!response.ok)
                    throw new Error("Network response was not ok");
                return response.json();
            })
            .then((data) => setProducts(Array.isArray(data) ? data : []))
            .catch(() => setProducts([]));

        fetchWeather(selectedLocation);
    }, [API_BASE, selectedLocation]);

    useEffect(() => {
        fetch(`${API_BASE}/api/product_categories`)
            .then((response) => {
                if (!response.ok) {
                    throw new Error("Network response was not ok");
                }
                return response.json();
            })
            .then((data) => setProductCategories(data))
            .catch((error) =>
                console.error("Error fetching product categories:", error)
            );
    }, [API_BASE]);

    // Fetch user orders when user is logged in or when returning from cart
    useEffect(() => {
        const fetchOrders = async () => {
            if (!user?.id) return;
            // Only fetch when not showing cart (i.e., on main screen)
            if (showCart) return;

            setOrdersLoading(true);
            try {
                const response = await fetch(`${API_BASE}/api/getUserOrders`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ clerk_user_id: user.id }),
                });

                if (response.ok) {
                    const data = await response.json();
                    setOrders(data.orders || []);
                }
            } catch (err) {
                console.error("Failed to fetch orders:", err);
            } finally {
                setOrdersLoading(false);
            }
        };

        fetchOrders();
    }, [user?.id, API_BASE, showCart]);

    // Handle re-ordering an item from order history
    const handleReorderItem = (item) => {
        const name = item.product_name || "Item";
        const price = Number(item.unit_price_at_sale || item.unit_price || 0);
        const productId = item.product_id || name.toLowerCase().replace(/\s+/g, "-");
        const qty = item.quantity || 1;

        const lineId = `${productId}-${Date.now()}-${Math.random()
            .toString(36)
            .slice(2, 8)}`;

        const newItem = {
            product_id: productId,
            product_name: name,
            unit_price: price,
            quantity: qty,
            sugar_level: item.sugar_level,
            size_level: item.size_level,
            ice_level: item.ice_level,
            modifications: item.modifications || [],
            base_unit_price: price,
            mods_unit_price: 0,
        };

        setCartItems(prev => {
            const updatedItems = {
                ...prev,
                [lineId]: newItem
            };

            setCartTotal(calculateCartTotal(updatedItems));

            return updatedItems;
        });

        addToast(`Added ${qty}x ${name} to cart!`);
        triggerBadgePop();
    };

    const getProductCategoryId = (product) => {
        return product.category;
    };

    const filteredProducts =
        selectedCategory && selectedCategory !== ""
            ? products.filter((p) => {
                const catId = getProductCategoryId(p);
                return (
                    catId !== null &&
                    String(catId) === String(selectedCategory)
                );
            })
            : products;

    return showCart ? (
        <ShopppingCartScreen
            cartItems={cartItems}
            cartTotal={cartTotal}
            onBackButtonClick={() => setShowCart(false)}
            onUpdateCart={(updatedItems) => {
                setCartItems(updatedItems);
                setCartTotal(calculateCartTotal(updatedItems));
            }}
            fontSize={fontSize}
            fontFamily={fontFamily}
            onFontSizeChange={setFontSize}
            onFontFamilyChange={setFontFamily}
            highContrast={highContrast}
            onToggleHighContrast={() => setHighContrast(!highContrast)}
        />
    ) : (
        <div className={highContrast ? "high-contrast" : ""}>
            <div className="header" role="banner">
                <div className="weather-section">
                    <label className="category-filter" for="location-select">Location:</label>
                    <select
                        id="location-select"
                        className="category-selector"
                        value={selectedLocation}
                        onChange={(e) => setSelectedLocation(e.target.value)}
                    >
                        <option value="college-station">College Station</option>
                        <option value="houston">Houston</option>
                        <option value="austin">Austin</option>
                    </select>
                    {temp !== null ? (
                        <h1>{Math.round(temp)}°F</h1>
                    ) : (
                        <h1>Loading weather...</h1>
                    )}
                </div>

                <div
                    className="category-filter-section"
                    style={{ marginLeft: 12 }}
                >
                    <label className="category-filter" for="product-category">Category:</label>
                    <select
                        className="category-selector"
                        value={selectedCategory}
                        id="product-category"
                        onChange={(e) => setSelectedCategory(e.target.value)}
                    >
                        <option value="">All</option>
                        {productCategories.map((cat) => (
                            <option>{cat}</option>
                        ))}
                    </select>
                </div>
                <button className="vegan-toggle"
                    onClick={() => {
                        setVeganOnly(!veganOnly);
                    }}
                >
                    <span style={{ color: veganOnly ? "green" : "red" }}>
                        {veganOnly ? "✓ " : "X "}
                    </span>
                    Vegan Only
                </button>

                <div id="google_translate_element"></div>


                <TextSettings
                    fontSize={fontSize}
                    fontFamily={fontFamily}
                    onFontSizeChange={setFontSize}
                    onFontFamilyChange={setFontFamily}
                />
                <button
                    className="contrast-toggle"
                    onClick={() => setHighContrast(!highContrast)}
                    aria-pressed={highContrast}
                    aria-label="Toggle high contrast mode"
                >
                    {highContrast ? "Default Mode" : "High Contrast"}
                </button>
                {user && (
                    <button
                        className="recent-orders-btn"
                        onClick={() => setShowOrderHistory(true)}
                        disabled={ordersLoading}
                        aria-label="View recent orders"
                    >
                        {ordersLoading ? "Loading..." : "Recent Orders"}
                    </button>
                )}
                <h1>${cartTotal.toFixed(2)}</h1>
                <div className="cart-button-container">
                    <button
                        className="cart-button"
                        aria-label="Open shopping cart"
                        onClick={() => {
                            setShowCart(true);
                        }}
                    ></button>
                    {getTotalItemCount() > 0 && (
                        <span className={`cart-badge ${badgePop ? "pop" : ""}`}>
                            {getTotalItemCount()}
                        </span>
                    )}
                </div>
            </div>

            {/* Toast notifications container */}
            <div className="toast-container">
                {toasts.map((toast) => (
                    <div key={toast.id} className="toast">
                        <span className="toast-icon">🛒</span>
                        <span className="toast-message">{toast.message}</span>
                    </div>
                ))}
            </div>

            <div className="product-grid" role="main">
                {filteredProducts.map((product) => {
                    const name =
                        product.product_name ?? product.name ?? "Sample Item";
                    const price = Number(
                        product.unit_price ?? product.price ?? 9.99
                    );
                    const id = product.product_id ?? product.id ?? name;
                    const vegan = product.vegan ?? false;
                    if (veganOnly && !vegan) {
                        return null;
                    }
                    return (
                        <ItemTile
                            key={id}
                            itemName={name}
                            itemPrice={price}
                            vegetarian={vegan}
                            itemImage={getProductImage(name)}
                            onClick={() => openModifications(product)}
                            aria-label={`Add ${name} to cart`}
                        />
                    );
                })}
            </div>

            {showModal && selectedProduct && (
                <div className="modal-overlay">
                    <div className="modal">
                        <h2>
                            {selectedProduct.product_name ??
                                selectedProduct.name ??
                                "Customize Item"}
                        </h2>

                        <div className="modal-section">
                            <label htmlFor="size-select">Size</label>
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

                        <div className="modal-section">
                            <label htmlFor="sugar-select">Sugar</label>
                            <select
                                id="sugar-select"
                                value={sugarLevel}
                                onChange={(e) => setSugarLevel(e.target.value)}
                            >
                                <option value="0%">0%</option>
                                <option value="30%">30%</option>
                                <option value="50%">50%</option>
                                <option value="80%">80%</option>
                                <option value="100%">100%</option>
                                <option value="150%">150%</option>
                                <option value="200%">200%</option>
                            </select>
                        </div>

                        <div className="modal-section">
                            <label htmlFor="ice-select">Temperature</label>
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

                        <div className="modal-section">
                            <p>Add-ons</p>
                            <div className="modifications-list">
                                {availableModifications.map((mod) => {
                                    const selected =
                                        !!selectedModifications.find(
                                            (m) =>
                                                m.ingredient_id ===
                                                mod.ingredient_id
                                        );
                                    const modPrice = Number(
                                        mod.price_per_unit ?? 0
                                    );
                                    return (
                                        <button
                                            key={mod.ingredient_id}
                                            type="button"
                                            className={
                                                selected
                                                    ? "mod-chip selected"
                                                    : "mod-chip"
                                            }
                                            onClick={() =>
                                                toggleModification(mod)
                                            }
                                        >
                                            {mod.ingredient_name ??
                                                mod.name ??
                                                "Add-on"}
                                            {modPrice > 0
                                                ? ` (+$${modPrice.toFixed(2)})`
                                                : ""}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        <div className="modal-section quantity-section">
                            <button
                                type="button"
                                onClick={() => changeQuantity(-1)}
                            >
                                -
                            </button>
                            <span>{quantity}</span>
                            <button
                                type="button"
                                onClick={() => changeQuantity(1)}
                            >
                                +
                            </button>
                        </div>

                        <div className="modal-actions">
                            <button type="button" onClick={closeModifications}>
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={handleAddToCartWithMods}
                            >
                                Add to Cart
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {showOrderHistory && (
                <OrderHistory
                    orders={orders}
                    onReorder={handleReorderItem}
                    onClose={() => setShowOrderHistory(false)}
                />
            )}
        </div>
    );
}

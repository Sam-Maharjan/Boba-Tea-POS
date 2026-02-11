import React, { useState } from "react";
import ShoppingCartTile from "./Components/ShoppingCartTile";
import TextSettings from "./Components/TextSettings";
import { useUser } from "@clerk/clerk-react";
import "./ShoppingCartScreen.css";

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


const SUCCESS_MESSAGE_DURATION = 3000;

export default function ShopppingCartScreen({
    cartItems,
    cartTotal,
    onBackButtonClick,
    onUpdateCart,
    fontSize = "16",
    fontFamily = "default",
    onFontSizeChange,
    onFontFamilyChange,
    highContrast,
    onToggleHighContrast,
}) {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(false);
    const { user } = useUser();

    const API_BASE =
        process.env.REACT_APP_BACKEND_URL || "http://127.0.0.1:5000";

    const cartItemsArray = Object.entries(cartItems).map(([lineId, item]) => ({
        ...item,
        lineId,
    }));

    const createEmojiSvg = (emoji) => {
        return `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 200 200'%3E%3Crect fill='%23f8f8f8' width='200' height='200'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' font-size='100' fill='%23333'%3E${emoji}%3C/text%3E%3C/svg%3E`;
    };

    /* UPDATED — now using picture files instead of emojis */
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

    const getProductImage = (productName) => {
        const normalizedName = productName.toLowerCase();
        return (
            productImages[normalizedName] ||
            "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 200 200'%3E%3Crect fill='%23f0f0f0' width='200' height='200'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' font-size='100' fill='%23333'%3E🧋%3C/text%3E%3C/svg%3E"
        );
    };


    const handleQuantityChange = (lineId, newQuantity) => {
        const updatedItems = { ...cartItems };

        if (newQuantity <= 0) {
            delete updatedItems[lineId];
        } else {
            if (!updatedItems[lineId]) {
                return;
            }
            updatedItems[lineId] = {
                ...updatedItems[lineId],
                quantity: newQuantity,
            };
        }

        onUpdateCart(updatedItems);
    };

    const handleModificationRequested = (
        lineId,
        ingredientId,
        modificationType
    ) => {
        if (!["ADD", "REMOVE", "LESS", "EXTRA"].includes(modificationType)) {
            console.error("Invalid modificationType:", modificationType);
            return;
        }

        const updatedItems = { ...cartItems };
        const item = updatedItems[lineId];
        if (!item) {
            return;
        }
        let newMods = [...(item.modifications || [])];
        const modIndex = newMods.findIndex(
            (mod) => mod.ingredient_id === ingredientId
        );
        if (modIndex !== -1) {
            let newMod = { ...newMods[modIndex] };
            newMod.modification_type = modificationType;
            newMods[modIndex] = newMod;
        } else {
            newMods.push({
                ingredient_id: ingredientId,
                modification_type: modificationType,
            });
        }
        updatedItems[lineId] = {
            ...updatedItems[lineId],
            modifications: newMods,
        };

        onUpdateCart(updatedItems);
    };

    const handleCheckout = async () => {
        if (cartItemsArray.length === 0) {
            setError("Your cart is empty");
            return;
        }

        if (!user?.id) {
            setError("You must be signed in to place an order");
            return;
        }

        setIsLoading(true);
        setError(null);

        const orderData = {
            total_amount: cartTotal,
            clerk_user_id: user.id,
            user_email:
                user.primaryEmailAddress?.emailAddress ||
                user.emailAddresses?.[0]?.emailAddress,
            user_name:
                user.fullName ||
                `${user.firstName || ""} ${user.lastName || ""}`.trim(),
            items: cartItemsArray.map((item) => ({
                product_id: item.product_id,
                quantity: item.quantity,
                unit_price_at_sale: item.unit_price,
                sugar_level: item.sugar_level,
                ice_level: item.ice_level,
                size_level: item.size_level,
                modifications: item.modifications || [],
            })),
        };

        try {
            const response = await fetch(`${API_BASE}/api/postOrder`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(orderData),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || "Failed to place order");
            }

            await response.json();
            setSuccess(true);

            onUpdateCart({});

            setTimeout(() => {
                setSuccess(false);
                onBackButtonClick();
            }, SUCCESS_MESSAGE_DURATION);
        } catch (err) {
            console.error("Checkout error:", err);
            setError(err.message || "Failed to place order");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className={highContrast ? "high-contrast" : ""}>
            <div className="header" role="banner">
                <button
                    className="back-button"
                    onClick={onBackButtonClick}
                    aria-label="Back to order menu"
                    disabled={isLoading}
                ></button>
                <h1>Your Shopping Cart</h1>
                <TextSettings
                    fontSize={fontSize}
                    fontFamily={fontFamily}
                    onFontSizeChange={onFontSizeChange}
                    onFontFamilyChange={onFontFamilyChange}
                />
                <button
                    className="contrast-toggle"
                    onClick={onToggleHighContrast}
                    aria-pressed={highContrast}
                    aria-label="Toggle high contrast mode"
                >
                    {highContrast ? "Default Mode" : "High Contrast"}
                </button>
            </div>

            {error && (
                <div className="error-message" role="alert">
                    {error}
                </div>
            )}

            {success && (
                <div className="success-message" role="alert">
                    Order placed successfully! Redirecting...
                </div>
            )}

            <div className="cart-items-container" role="main">
                {cartItemsArray.length === 0 ? (
                    <p>Your cart is empty.</p>
                ) : (
                    cartItemsArray.map((item) => {
                        const mods = item.modifications || [];
                        return (
                            <div className="cart-item-row" key={item.lineId}>
                                <ShoppingCartTile
                                    id={item.lineId}
                                    image={getProductImage(item.product_name)}
                                    name={item.product_name}
                                    price={item.unit_price}
                                    quantity={item.quantity}
                                    onQuantityChange={(newQuantity) =>
                                        handleQuantityChange(
                                            item.lineId,
                                            newQuantity
                                        )
                                    }
                                    onModificationRequested={(mod_data) =>
                                        handleModificationRequested(
                                            item.lineId,
                                            mod_data.ingredient_id,
                                            mod_data.modification_type
                                        )
                                    }
                                />

                                {(item.size_level ||
                                    item.sugar_level ||
                                    item.ice_level) && (
                                        <div className="cart-item-options">
                                            {item.size_level && (
                                                <span className="cart-option">
                                                    Size: {item.size_level}
                                                </span>
                                            )}
                                            {item.sugar_level && (
                                                <span className="cart-option">
                                                    Sugar: {item.sugar_level}
                                                </span>
                                            )}
                                            {item.ice_level && (
                                                <span className="cart-option">
                                                    Temperature: {item.ice_level}
                                                </span>
                                            )}
                                        </div>
                                    )}
                                {mods.length > 0 && (
                                    <div className="cart-item-addons">
                                        <span className="addons-label">
                                            Add-ons:
                                        </span>
                                        <ul className="addons-list">
                                            {mods.map((mod) => {
                                                const label =
                                                    mod.ingredient_name ??
                                                    mod.name ??
                                                    "Add-on";
                                                const price = Number(
                                                    mod.price_per_unit ?? 0
                                                );
                                                return (
                                                    <li
                                                        key={
                                                            mod.ingredient_id ??
                                                            label
                                                        }
                                                        className="addon-item"
                                                    >
                                                        {label}
                                                        {price > 0
                                                            ? ` (+$${price.toFixed(
                                                                2
                                                            )})`
                                                            : ""}
                                                    </li>
                                                );
                                            })}
                                        </ul>
                                    </div>
                                )}
                            </div>
                        );
                    })
                )}
            </div>

            {cartItemsArray.length > 0 && (
                <div className="cart-summary">
                    <h2>Total: ${cartTotal.toFixed(2)}</h2>
                </div>
            )}

            <button
                className="checkout-button"
                onClick={handleCheckout}
                aria-label="Checkout"
                disabled={isLoading || cartItemsArray.length === 0}
            >
                {isLoading ? "Processing..." : "Checkout"}
            </button>
        </div>
    );
}
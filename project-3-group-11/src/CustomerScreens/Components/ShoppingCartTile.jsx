import React, { useState } from "react";
import "./ShoppingCartTile.css";
import ModRow from "./ModRow";

// Mod options: ADD REMOVE LESS EXTRA
const API_BASE =
    (process.env.REACT_APP_BACKEND_URL &&
        process.env.REACT_APP_BACKEND_URL.trim()) ||
    "";

/**
 * returns a list of objects in the format:
 * {
    "ingredient_id": 1,
    "ingredient_name": "Dough",
    "possible_modification": "REMOVE" // ADD if not in recipe, REMOVE if in recipe
  }
 */
async function getMods(productId) {
    try {
        const response = await fetch(
            `${API_BASE}/api/modifications`
        );

        if (!response.ok) return [];

        const data = await response.json();

        const new_data = data.map((mod) => ({
            ...mod,
            originally_in_recipe: mod.possible_modification === "REMOVE",
            should_display: mod.possible_modification === "REMOVE",
            modification_type: "NONE",
        }));

        return new_data;
    } catch (error) {
        console.error("Error fetching modifications:", error);
        return [];
    }
}

export default function ShoppingCartTile({
    image,
    name,
    id,
    price,
    quantity,
    onQuantityChange,
    onModificationRequested, // callback function that accepts {ingredient_id, modification_type}
}) {
    // Whether the user is currently selecting modifications
    const [selectingModifications, setSelectingModifications] = useState(false);
    // Whether the modifications are currently being loaded
    const [loadingMods, setLoadingMods] = useState(true);
    // The ingredients currently being shown as mod options
    const [modifications, setModifications] = useState([]);
    // has the customize button been clicked at least once
    const [startedMods, setStartedMods] = useState(false);

    const generic_callback = (ingredient_id, modification_type) => {
        let new_mods = [...modifications];
        let mod_index = new_mods.findIndex(
            (m) => m.ingredient_id === ingredient_id
        );
        // create deep copy of mod object to avoid state mutation issues
        let new_mod = { ...new_mods[mod_index] };
        new_mod.modification_type = modification_type;
        console.log(
            `Updated to ${modification_type} for ingredient ${ingredient_id}`
        );
        new_mods[mod_index] = new_mod;
        setModifications(new_mods);

        onModificationRequested({
            ingredient_id,
            modification_type,
        });
    };

    return (
        <div
            className={
                selectingModifications
                    ? "shopping-cart-tile-expanded"
                    : "shopping-cart-tile"
            }
        >
            <div className="cart-tile-row-one">
                <img src={image} alt={name} className="cart-item-image" />
                <div className="cart-item-details">
                    <h3 className="cart-item-name">{name}</h3>
                    <p className="cart-item-price">
                        Price: ${price.toFixed(2)}
                    </p>
                    <div className="quantity-controls">
                        <button
                            className="quantity-btn"
                            onClick={() =>
                                onQuantityChange &&
                                onQuantityChange(quantity - 1)
                            }
                            aria-label="Decrease quantity"
                        >
                            -
                        </button>
                        <span className="quantity-display">
                            Qty: {quantity}
                        </span>
                        <button
                            className="quantity-btn"
                            onClick={() =>
                                onQuantityChange &&
                                onQuantityChange(quantity + 1)
                            }
                            aria-label="Increase quantity"
                        >
                            +
                        </button>
                    </div>
                    <p className="cart-item-subtotal">
                        Subtotal: ${(price * quantity).toFixed(2)}
                    </p>
                </div>
            </div>
        </div>
    );
}

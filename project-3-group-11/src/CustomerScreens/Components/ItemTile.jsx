import React, { useState } from "react";
import "./ItemTile.css";

export default function ItemTile({
    itemName,
    itemPrice,
    itemImage,
    onClick,
    vegetarian = false,
}) {
    const [isClicked, setIsClicked] = useState(false);

    const handleClick = () => {
        setIsClicked(true);
        onClick();

        setTimeout(() => {
            setIsClicked(false);
        }, 500);
    };

    const handleKeyDown = (e) => {
        if (e.key === "Enter" || e.key === " ") {
            handleClick();
        }
    };

    console.log("Rendering ItemTile:", { itemName, itemPrice, itemImage });

    return (
        <div
            className={`item-tile ${isClicked ? "clicked" : ""}`}
            tabIndex={0}
            role="button"
            onClick={handleClick}
            onKeyDown={handleKeyDown}
        >
            <img src={itemImage} alt={itemName} className="item-image" />
            <div className="itemDetailsContainer">
                <h1 className="item-name">{itemName}</h1>
                <p className="item-price">${itemPrice.toFixed(2)}</p>
            </div>
            <div className="allergen-info">
                {vegetarian && (
                    <span className="allergen-badge" aria-label="vegetarian">
                        🥦
                    </span>
                )}
            </div>
        </div>
    );
}

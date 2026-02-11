import React, { useState } from "react";
import "./TextSettings.css";

export default function TextSettings({
    fontSize = "normal",
    fontFamily = "default",
    onFontSizeChange,
    onFontFamilyChange,
}) {
    const [isOpen, setIsOpen] = useState(false);

    const fontFamilyMap = {
        default: "Default Font",
        verdana: "Verdana",
        georgia: "Georgia",
        comic: "Comic Sans",
        dyslexic: "Open Dyslexic",
    };

    const handleFontFamilyChange = (e) => {
        const newFamily = e.target.value;
        onFontFamilyChange(newFamily);
    };

    return (
        <div className="text-size-font-selector">
            <button
                className="selector-toggle"
                onClick={() => setIsOpen(!isOpen)}
                aria-label="Toggle text and font settings"
                aria-expanded={isOpen}
            >
                Text Settings
            </button>

            {isOpen && (
                <div className="selector-dropdown">
                    <div className="selector-section">
                        <label className="selector-label">Font Size</label>
                        <div className="font-size-controls">
                            <input
                                id="font-size-slider"
                                type="range"
                                min="14"
                                max="22"
                                step="1"
                                value={fontSize}
                                onChange={(e) => {
                                    const pixelValue = e.target.value;
                                    onFontSizeChange(pixelValue);
                                }}
                                className="font-size-slider"
                            />
                            <span className="font-size-label">
                                {fontSize}px
                            </span>
                        </div>
                    </div>

                    <div className="selector-section">
                        <label className="selector-label">Font Family</label>
                        <select
                            id="font-family-select"
                            value={fontFamily}
                            onChange={handleFontFamilyChange}
                            className="font-family-select"
                        >
                            {Object.entries(fontFamilyMap).map(([key, label]) => (
                                <option key={key} value={key}>
                                    {label}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>
            )}
        </div>
    );
}

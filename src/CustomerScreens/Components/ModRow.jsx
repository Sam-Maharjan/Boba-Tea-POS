import React from "react";

/**
 * current_state must be one of "ADD", "REMOVE", "LESS", "EXTRA", or "NONE",
 * defaults to "NONE"
 */
export default function ModRow({
    ingredient_id,
    ingredient_name,
    add_enabled,
    remove_enabled,
    less_enabled = true,
    extra_enabled = true,
    on_add = () => {},
    on_remove = () => {},
    on_less = () => {},
    on_extra = () => {},
    current_state = "NONE",
}) {
    if (
        ["ADD", "REMOVE", "LESS", "EXTRA", "NONE"].indexOf(current_state) === -1
    ) {
        console.error("Invalid current_state for ModRow:", current_state);
        current_state = "NONE";
    }
    return (
        <div className="mod-row">
            <span className="mod-ingredient-name">{ingredient_name}</span>
            <div className="mod-buttons-container">
                <button
                    className={current_state === "ADD" ? "mod-button selected" : "mod-button"}
                    disabled={!add_enabled}
                    onClick={() => on_add(ingredient_id)}
                >
                    ADD
                </button>
                <button
                    className={current_state === "REMOVE" ? "mod-button selected" : "mod-button"}
                    disabled={!remove_enabled}
                    onClick={() => on_remove(ingredient_id)}
                >
                    REMOVE
                </button>
                <button
                    className={current_state === "LESS" ? "mod-button selected" : "mod-button"}
                    disabled={!less_enabled}
                    onClick={() => on_less(ingredient_id)}
                >
                    LESS
                </button>
                <button
                    className={current_state === "EXTRA" ? "mod-button selected" : "mod-button"}
                    disabled={!extra_enabled}
                    onClick={() => on_extra(ingredient_id)}
                >
                    EXTRA
                </button>
            </div>
        </div>
    );
}

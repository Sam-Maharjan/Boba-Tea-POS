import React, { useState } from "react";
import "./ManagerScreen.css";
import EmployeeScreen from "./EmployeeScreen";
import InventoryScreen from "./InventoryScreen";
import MenuScreen from "./MenuScreen";
import TrendScreen from "./TrendScreen";

function ManagerScreen() {
  const [currentView, setCurrentView] = useState("main");

  if (currentView === "employees")
    return <EmployeeScreen onBack={() => setCurrentView("main")} />;
  if (currentView === "inventory")
    return <InventoryScreen onBack={() => setCurrentView("main")} />;
  if (currentView === "menu")
    return <MenuScreen onBack={() => setCurrentView("main")} />;
  if (currentView === "trends")
    return <TrendScreen onBack={() => setCurrentView("main")} />;

  return (
    <div className="manager-container">
      <h1 className="manager-title">Manager Dashboard</h1>

      <div className="button-grid">
        <button
          className="manager-btn"
          onClick={() => setCurrentView("menu")}
        >
          Manage Menu Items & Prices
        </button>

        <button
          className="manager-btn"
          onClick={() => setCurrentView("inventory")}
        >
          Manage Inventory
        </button>

        <button
          className="manager-btn"
          onClick={() => setCurrentView("employees")}
        >
          Manage Employees
        </button>

        <button
          className="manager-btn"
          onClick={() => setCurrentView("trends")}
        >
          View / Create Reports
        </button>
      </div>
    </div>
  );
}

export default ManagerScreen;

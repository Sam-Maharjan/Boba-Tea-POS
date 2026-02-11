import React, { useState, useEffect } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import "./InventoryScreen.css";

export default function TrendScreen({ onBack }) {
  const API_BASE = process.env.REACT_APP_BACKEND_URL;

  const [sales, setSales] = useState([]);
  const [startDate, setStartDate] = useState(
    new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split("T")[0]
  );
  const [endDate, setEndDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [notification, setNotification] = useState({ show: false, message: "", type: "" });

  const [showXReport, setShowXReport] = useState(false);
  const [showZReport, setShowZReport] = useState(false);
  const [showUsageChart, setShowUsageChart] = useState(false);
  const [xReportData, setXReportData] = useState([]);
  const [zReportData, setZReportData] = useState(null);
  const [usageData, setUsageData] = useState([]);
  const [zReportGenerated, setZReportGenerated] = useState(false);

  useEffect(() => {
    fetchSales();
  }, []);

  const showNotification = (message, type = "success") => {
    setNotification({ show: true, message, type });
    setTimeout(() => {
      setNotification({ show: false, message: "", type: "" });
    }, 3000);
  };

  const fetchSales = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await fetch(
        `${API_BASE}/api/reports/sales?start_date=${startDate}&end_date=${endDate}`
      );
      if (!response.ok) throw new Error("Failed to fetch sales data");
      const data = await response.json();
      setSales(data);
    } catch (err) {
      console.error("Fetch error:", err);
      setError(`Unable to fetch sales data. Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleXReport = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE}/api/reports/x-report`);
      if (!response.ok) throw new Error("Failed to fetch X Report");
      const data = await response.json();
      setXReportData(data);
      setShowXReport(true);
    } catch (err) {
      showNotification("Error generating X Report: " + err.message, "error");
    } finally {
      setLoading(false);
    }
  };

  const handleZReport = async () => {
    const today = new Date().toDateString();
    const lastGenerated = localStorage.getItem("lastZReportDate");

    if (lastGenerated === today) {
      showNotification("Z Report has already been generated today.", "error");
      return;
    }

    const confirmed = window.confirm(
      "A Z report can only be generated once per day. This report cannot be updated once created.\n\nAre you sure you want to proceed?"
    );

    if (!confirmed) return;

    setLoading(true);
    try {
      const response = await fetch(`${API_BASE}/api/reports/z-report`);
      if (!response.ok) throw new Error("Failed to fetch Z Report");
      const data = await response.json();
      setZReportData(data);
      setShowZReport(true);
      localStorage.setItem("lastZReportDate", today);
      setZReportGenerated(true);
    } catch (err) {
      showNotification("Error generating Z Report: " + err.message, "error");
    } finally {
      setLoading(false);
    }
  };

  const handleUsageChart = async () => {
    if (new Date(startDate) > new Date(endDate)) {
      showNotification("Start date must be before or equal to end date.", "error");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(
        `${API_BASE}/api/reports/usage-chart?start_date=${startDate}&end_date=${endDate}`
      );
      if (!response.ok) throw new Error("Failed to fetch usage chart");
      const data = await response.json();
      setUsageData(data);
      setShowUsageChart(true);
    } catch (err) {
      showNotification("Error generating usage chart: " + err.message, "error");
    } finally {
      setLoading(false);
    }
  };

  const formatHour = (isoString) => {
    const date = new Date(isoString);
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
  };

  const calculateTotalUsage = () => {
    return usageData.reduce((sum, item) => sum + parseFloat(item.total_used || 0), 0);
  };

  const calculateTotalOrders = () => {
    return usageData.reduce((sum, item) => sum + parseInt(item.orders_count || 0), 0);
  };

  // Custom label component for rotated text
  const CustomAxisTick = ({ x, y, payload }) => {
    return (
      <g transform={`translate(${x},${y})`}>
        <text
          x={0}
          y={0}
          dy={16}
          textAnchor="end"
          fill="#666"
          transform="rotate(-45)"
          fontSize={12}
        >
          {payload.value}
        </text>
      </g>
    );
  };

  return (
    <div className="manager-container">
      <h1 className="manager-title">Sales Report</h1>

      {error && <div className="error-message">{error}</div>}

      {notification.show && (
        <div className={`notification ${notification.type}`}>
          {notification.message}
        </div>
      )}

      <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "20px", flexWrap: "wrap" }}>
        <label style={{ fontWeight: "600" }}>From:</label>
        <input
          type="date"
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
          className="date-input"
        />
        <label style={{ fontWeight: "600" }}>To:</label>
        <input
          type="date"
          value={endDate}
          onChange={(e) => setEndDate(e.target.value)}
          className="date-input"
        />
        <button className="manager-btn" onClick={fetchSales} disabled={loading}>
          Refresh
        </button>
        <button className="manager-btn" onClick={handleXReport} disabled={loading}>
          X Report
        </button>
        <button className="manager-btn" onClick={handleZReport} disabled={loading}>
          Z Report
        </button>
        <button className="manager-btn" onClick={handleUsageChart} disabled={loading}>
          Usage Chart
        </button>
        <button className="manager-btn" onClick={onBack} disabled={loading}>
          Back
        </button>
      </div>

      <table className="inventory-table">
        <thead>
          <tr>
            <th>Product ID</th>
            <th>Product</th>
            <th>Qty Sold</th>
            <th>Revenue ($)</th>
          </tr>
        </thead>
        <tbody>
          {sales.length === 0 ? (
            <tr>
              <td colSpan="4" style={{ textAlign: "center", color: "#999" }}>
                {loading ? "Loading..." : "No sales data for selected period"}
              </td>
            </tr>
          ) : (
            sales.map((s) => (
              <tr key={s.product_id}>
                <td>{s.product_id}</td>
                <td>{s.product_name}</td>
                <td>{s.qty}</td>
                <td>${parseFloat(s.revenue).toFixed(2)}</td>
              </tr>
            ))
          )}
        </tbody>
      </table>

      {/* Sales Bar Chart */}
      {sales.length > 0 && (
        <div className="chart-container">
          <h2 className="chart-title">Revenue by Product</h2>
          <ResponsiveContainer width="100%" height={500}>
            <BarChart data={sales} margin={{ top: 20, right: 30, left: 20, bottom: 120 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="product_name" 
                tick={<CustomAxisTick />}
                height={140}
                interval={0}
              />
              <YAxis label={{ value: 'Revenue ($)', angle: -90, position: 'insideLeft' }} />
              <Tooltip formatter={(value) => `$${parseFloat(value).toFixed(2)}`} />
              <Legend wrapperStyle={{ paddingTop: '20px' }} />
              <Bar dataKey="revenue" fill="#2d6cdf" name="Revenue ($)" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* X Report Dialog */}
      {showXReport && (
        <div className="dialog-overlay">
          <div className="dialog-box" style={{ minWidth: "800px", maxWidth: "90%" }}>
            <h2>X Report: Sales by Hour (Today)</h2>
            
            {xReportData.length > 0 && (
              <div style={{ width: "100%", marginBottom: "30px" }}>
                <ResponsiveContainer width="100%" height={350}>
                  <BarChart data={xReportData} margin={{ top: 20, right: 30, left: 20, bottom: 30 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="hour" 
                      tickFormatter={formatHour}
                      label={{ value: 'Time', position: 'insideBottom', offset: -10 }}
                      tick={{ fontSize: 12 }}
                    />
                    <YAxis label={{ value: 'Sales ($)', angle: -90, position: 'insideLeft' }} />
                    <Tooltip 
                      labelFormatter={formatHour}
                      formatter={(value) => `$${parseFloat(value).toFixed(2)}`}
                    />
                    <Legend wrapperStyle={{ paddingTop: '10px' }} />
                    <Bar dataKey="sales" fill="#2d6cdf" name="Sales ($)" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
            
            <div style={{ maxHeight: "300px", overflowY: "auto" }}>
              <table className="inventory-table" style={{ width: "100%" }}>
                <thead>
                  <tr>
                    <th>Hour</th>
                    <th>Sales ($)</th>
                  </tr>
                </thead>
                <tbody>
                  {xReportData.length === 0 ? (
                    <tr>
                      <td colSpan="2" style={{ textAlign: "center", color: "#999" }}>
                        No sales data for today
                      </td>
                    </tr>
                  ) : (
                    xReportData.map((item, idx) => (
                      <tr key={idx}>
                        <td>{formatHour(item.hour)}</td>
                        <td>${parseFloat(item.sales).toFixed(2)}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            <div className="dialog-buttons">
              <button onClick={() => setShowXReport(false)}>Close</button>
            </div>
          </div>
        </div>
      )}

      {/* Z Report Dialog */}
      {showZReport && zReportData && (
        <div className="dialog-overlay">
          <div className="dialog-box" style={{ minWidth: "800px", maxWidth: "90%" }}>
            <h2>Z Report: Daily Summary</h2>
            <p style={{ fontSize: "18px", fontWeight: "bold", color: "#2d6cdf" }}>
              Total Revenue Today: ${zReportData.total_revenue.toFixed(2)}
            </p>
            
            {zReportData.items.length > 0 && (
              <div style={{ width: "100%", marginBottom: "30px" }}>
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart data={zReportData.items} margin={{ top: 20, right: 30, left: 20, bottom: 140 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="product_name" 
                      tick={<CustomAxisTick />}
                      height={160}
                      interval={0}
                    />
                    <YAxis label={{ value: 'Quantity Sold', angle: -90, position: 'insideLeft' }} />
                    <Tooltip />
                    <Legend wrapperStyle={{ paddingTop: '20px' }} />
                    <Bar dataKey="qty_sold" fill="#2d6cdf" name="Quantity Sold" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
            
            <div style={{ maxHeight: "300px", overflowY: "auto" }}>
              <table className="inventory-table" style={{ width: "100%" }}>
                <thead>
                  <tr>
                    <th>Product ID</th>
                    <th>Product Name</th>
                    <th>Quantity Sold</th>
                  </tr>
                </thead>
                <tbody>
                  {zReportData.items.length === 0 ? (
                    <tr>
                      <td colSpan="3" style={{ textAlign: "center", color: "#999" }}>
                        No sales today
                      </td>
                    </tr>
                  ) : (
                    zReportData.items.map((item) => (
                      <tr key={item.product_id}>
                        <td>{item.product_id}</td>
                        <td>{item.product_name}</td>
                        <td>{item.qty_sold}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            <div className="dialog-buttons">
              <button onClick={() => setShowZReport(false)}>Close</button>
            </div>
          </div>
        </div>
      )}

      {/* Usage Chart Dialog */}
      {showUsageChart && (
        <div className="dialog-overlay">
          <div className="dialog-box" style={{ minWidth: "1100px", maxWidth: "95%", maxHeight: "95vh" }}>
            <h2>Product Usage Chart</h2>
            <p style={{ fontStyle: "italic", color: "#555" }}>
              {startDate} to {endDate}
            </p>
            <p style={{ fontWeight: "600", color: "#2d6cdf" }}>
              Total ingredient usage across {calculateTotalOrders()} orders
            </p>
            
            {usageData.length > 0 && (
              <div style={{ width: "100%", marginBottom: "30px" }}>
                <ResponsiveContainer width="100%" height={550}>
                  <BarChart data={usageData} margin={{ top: 20, right: 40, left: 70, bottom: 200 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="ingredient_name" 
                      angle={-45}
                      textAnchor="end"
                      height={220}
                      interval={0}
                      tick={{ fontSize: 11 }}
                    />
                    <YAxis 
                      label={{ value: 'Amount Used', angle: -90, position: 'insideLeft' }}
                      tick={{ fontSize: 12 }}
                    />
                    <Tooltip formatter={(value) => parseFloat(value).toFixed(1)} />
                    <Legend wrapperStyle={{ paddingTop: '10px' }} />
                    <Bar dataKey="total_used" fill="#2d6cdf" name="Total Used" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
            
            <div style={{ maxHeight: "400px", overflowY: "auto" }}>
              <table className="inventory-table" style={{ width: "100%" }}>
                <thead>
                  <tr>
                    <th>Ingredient ID</th>
                    <th>Ingredient Name</th>
                    <th>Total Used</th>
                    <th>Current Stock</th>
                    <th>Orders</th>
                  </tr>
                </thead>
                <tbody>
                  {usageData.map((item) => (
                    <tr key={item.ingredient_id}>
                      <td>{item.ingredient_id}</td>
                      <td>{item.ingredient_name}</td>
                      <td>{parseFloat(item.total_used).toFixed(1)}</td>
                      <td>{parseFloat(item.current_stock).toFixed(1)}</td>
                      <td>{item.orders_count}</td>
                    </tr>
                  ))}
                  <tr style={{ fontWeight: "bold", backgroundColor: "#e3e9ff" }}>
                    <td></td>
                    <td>TOTAL USAGE</td>
                    <td>{calculateTotalUsage().toFixed(1)}</td>
                    <td></td>
                    <td>{calculateTotalOrders()}</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div className="dialog-buttons">
              <button onClick={() => setShowUsageChart(false)}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
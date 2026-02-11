import React, { useEffect, useState } from "react";
import "./EmployeeScreen.css";

export default function EmployeeScreen({ onBack }) {
  const API_BASE = process.env.REACT_APP_BACKEND_URL;

  const [employees, setEmployees] = useState([]);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [name, setName] = useState("");
  const [role, setRole] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [notification, setNotification] = useState({
    show: false,
    message: "",
    type: "",
  });

  useEffect(() => {
    fetchEmployees();
  }, []);

  const showNotification = (message, type = "success") => {
    setNotification({ show: true, message, type });
    setTimeout(() => {
      setNotification({ show: false, message: "", type: "" });
    }, 3000);
  };

  const fetchEmployees = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await fetch(`${API_BASE}/api/employees`);
      if (!response.ok) throw new Error("Failed to fetch employees");
      const data = await response.json();
      setEmployees(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(`Unable to fetch employees. Error: ${err.message}`);
      setEmployees([]);
    } finally {
      setLoading(false);
    }
  };

  const clearForm = () => {
    setSelectedEmployee(null);
    setName("");
    setRole("");
    setEmail("");
  };

  const handleSelectEmployee = (emp) => {
    setSelectedEmployee(emp);
    setName(emp.name);
    setRole(emp.role);
    setEmail(emp.email);
  };

  const handleHire = async () => {
    if (!name.trim() || !role) {
      showNotification("Please enter both name and role.", "error");
      return;
    }
    if (!email) {
      showNotification("Please enter a valid email.", "error");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`${API_BASE}/api/employees`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), role, email}),
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || "Failed to hire employee");
      }

      const newEmployee = await response.json();
      showNotification(`Hired ${newEmployee.name} as ${newEmployee.role}`);
      clearForm();
      fetchEmployees();
    } catch (err) {
      showNotification("Error: " + err.message, "error");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async () => {
    if (!selectedEmployee) {
      showNotification("Please select an employee to update.", "error");
      return;
    }

    if (!name.trim() || !role) {
      showNotification("Please enter both name and role.", "error");
      return;
    }
    if (!email) {
      showNotification("Please enter a valid email.", "error");
      return;
    }
    setLoading(true);

    try {
      const response = await fetch(
        `${API_BASE}/api/employees/${selectedEmployee.employee_id}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: name.trim(), role , email}),
        }
      );

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || "Failed to update employee");
      }

      showNotification(`Updated ${name}'s information`);
      clearForm();
      fetchEmployees();
    } catch (err) {
      showNotification("Error: " + err.message, "error");
    } finally {
      setLoading(false);
    }
  };

  const handleFire = async () => {
    if (!selectedEmployee) {
      showNotification("Please select an employee to fire.", "error");
      return;
    }

    const confirmed = window.confirm(
      `Are you sure you want to fire ${selectedEmployee.name}?`
    );
    if (!confirmed) return;

    setLoading(true);

    try {
      const response = await fetch(
        `${API_BASE}/api/employees/${selectedEmployee.employee_id}`,
        {
          method: "DELETE",
        }
      );

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || "Failed to fire employee");
      }

      showNotification(`Fired ${selectedEmployee.name}`);
      clearForm();
      fetchEmployees();
    } catch (err) {
      showNotification("Error: " + err.message, "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="employee-container">
      <h1>Employees</h1>

      {error && <div className="error-banner">{error}</div>}

      {notification.show && (
        <div className={`notification ${notification.type}`}>
          {notification.message}
        </div>
      )}

      <table className="employee-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>Name</th>
            <th>Role</th>
            <th>Email</th>
          </tr>
        </thead>
        <tbody>
          {employees.length === 0 ? (
            <tr>
              <td colSpan="3" style={{ textAlign: "center", color: "#999" }}>
                {loading ? "Loading..." : "No employees found"}
              </td>
            </tr>
          ) : (
            employees.map((emp) => (
              <tr
                key={emp.employee_id}
                className={
                  selectedEmployee?.employee_id === emp.employee_id
                    ? "selected"
                    : ""
                }
                onClick={() => handleSelectEmployee(emp)}
              >
                <td>{emp.employee_id}</td>
                <td>{emp.name}</td>
                <td>{emp.role}</td>
                <td>{emp.email}</td>
              </tr>
            ))
          )}
        </tbody>
      </table>

      <div className="form-grid">
        <div>
          <label>Name:</label>
          <input
            type="text"
            placeholder="Employee name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>

        <div>
          <label>Role:</label>
          <select value={role} onChange={(e) => setRole(e.target.value)}>
            <option value="">Select role</option>
            <option value="Cashier">Cashier</option>
            <option value="Manager">Manager</option>
          </select>
        </div>

        <div>
          <label>Email:</label>
          <input
            type="text"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
      </div>

      <div className="btn-row">
        <button onClick={onBack} disabled={loading}>Back</button>
        <button onClick={fetchEmployees} disabled={loading}>Refresh</button>
        <button onClick={handleHire} disabled={loading || !name.trim() || !role}>Hire</button>
        <button onClick={handleUpdate} disabled={loading || !selectedEmployee}>Update</button>
        <button onClick={handleFire} disabled={loading || !selectedEmployee}>Fire</button>
      </div>
    </div>
  );
}

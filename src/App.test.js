import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import './App.css';
import CashierScreen from './CashierScreen/CashierScreen';
import ManagerScreen from './ManagerScreens/ManagerScreen';
import CustomerScreen from './CustomerScreens/CustomerScreen';

test('renders learn react link', () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/cashier" replace />} />
        <Route path="/cashier" element={<CashierScreen />} />
        <Route path="/manager" element={<ManagerScreen />} />
        <Route path="/customer" element={<CustomerScreen />} />
      </Routes>
    </BrowserRouter>
  );
});

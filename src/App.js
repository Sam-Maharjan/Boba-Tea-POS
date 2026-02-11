import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import './App.css';
import LandingPage from './LandingPage';
import CashierScreen from './CashierScreen/CashierScreen';
import ManagerScreen from './ManagerScreens/ManagerScreen';
import CustomerScreen from './CustomerScreens/CustomerScreen';
import MenuScreen from './MenuScreen/MenuScreen';
import ProtectedRoute from './ProtectedRoute';

export default function App() {
    return (
        <BrowserRouter>
            <Routes>
                <Route path="/" element={<LandingPage />} />

                <Route path="/cashier" element={<CashierScreen />} />
                <Route path="/manager" element={<ManagerScreen />} />
                <Route
                    path="/customer"
                    element={
                            <CustomerScreen />
                    }
                />
                <Route path="/menu" element={<MenuScreen />} />

                <Route path="*" element={<Navigate to="/" />} />
            </Routes>
        </BrowserRouter>
    );
}

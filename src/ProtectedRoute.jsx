import { useUser } from '@clerk/clerk-react';
import { Navigate } from 'react-router-dom';

export default function ProtectedRoute({ children }) {
    const { isSignedIn, isLoaded } = useUser();

    if (!isLoaded) {
        return (
            <div style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                height: '100vh',
                fontSize: '24px'
            }}>
                Loading...
            </div>
        );
    }

    if (!isSignedIn) {
        return <Navigate to="/" replace />;
    }

    return children;
}

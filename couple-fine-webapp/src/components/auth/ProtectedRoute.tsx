import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Loader2, Heart } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireCouple?: boolean;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requireCouple = false
}) => {
  const { user, isLoading } = useAuth();
  const location = useLocation();

  // Show loading spinner while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-50 to-coral-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-to-br from-primary-400 to-coral-400 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
            <Heart className="w-8 h-8 text-white" />
          </div>
          <Loader2 className="w-8 h-8 text-primary-500 animate-spin mx-auto mb-2" />
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Redirect to couple setup if couple is required but user doesn't have one
  if (requireCouple && !user.couple_id) {
    return <Navigate to="/couple-setup" replace />;
  }

  return <>{children}</>;
};

// Higher-order component for routes that require couple setup
export const RequireCouple: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <ProtectedRoute requireCouple>
      {children}
    </ProtectedRoute>
  );
};
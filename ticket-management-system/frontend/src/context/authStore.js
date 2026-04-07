import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,

      setAuth: (user, token) => {
        localStorage.setItem('token', token);
        set({
          user,
          token,
          isAuthenticated: true
        });
      },

      logout: () => {
        localStorage.removeItem('token');
        set({
          user: null,
          token: null,
          isAuthenticated: false
        });
      },

      updateUser: (userData) => {
        set((state) => ({
          user: { ...state.user, ...userData }
        }));
      },

      // Check if user has specific role
      hasRole: (roles) => {
        const { user } = get();
        if (!user) return false;
        return Array.isArray(roles) ? roles.includes(user.role) : user.role === roles;
      },

      // Check if user is admin
      isAdmin: () => get().hasRole('admin'),

      // Check if user is agent or admin
      isAgent: () => get().hasRole(['agent', 'admin'])
    }),
    {
      name: 'auth-storage'
    }
  )
);

export default useAuthStore;

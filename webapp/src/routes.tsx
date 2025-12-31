import { createRootRoute, createRoute, createRouter, redirect, Outlet } from '@tanstack/react-router';
import { HomePage } from './pages/HomePage';
import { LoginPage } from './pages/LoginPage';

// Root route
const rootRoute = createRootRoute({
  component: () => {
    return (
      <div className="min-h-screen bg-gray-50">
        <header className="bg-white shadow-sm">
          <div className="max-w-7xl mx-auto px-4 py-4">
            <h1 className="text-2xl font-bold">FB Group Aggregator</h1>
          </div>
        </header>
        <main>
          <Outlet />
        </main>
      </div>
    );
  },
});

// Login route
const loginRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/login',
  component: LoginPage,
});

// Home route - protected
const homeRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  beforeLoad: () => {
    const apiKey = localStorage.getItem('apiKey');
    if (!apiKey) {
      throw redirect({ to: '/login' });
    }
  },
  component: HomePage,
});

// Create router
const routeTree = rootRoute.addChildren([homeRoute, loginRoute]);

export const router = createRouter({ routeTree });

// Register router for type safety
declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}

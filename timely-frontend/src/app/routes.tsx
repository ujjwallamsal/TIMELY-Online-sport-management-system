import React from 'react';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { AuthProvider } from '../auth/AuthProvider';
import { ToastProvider } from '../contexts/ToastContext';
import { Protected } from '../auth/Protected';
import { Login } from '../auth/Login';
import { Register } from '../auth/Register';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import OfflineIndicator from '../components/OfflineIndicator';

// Lazy load feature components
const Home = React.lazy(() => import('../features/home/Home'));
const Events = React.lazy(() => import('../features/events/List'));
const EventDetail = React.lazy(() => import('../features/events/Detail'));
const EventCreate = React.lazy(() => import('../features/events/Create.tsx'));
const EventEdit = React.lazy(() => import('../features/events/Edit'));
const Venues = React.lazy(() => import('../features/venues/List'));
const VenueDetail = React.lazy(() => import('../features/venues/Detail'));
const Registrations = React.lazy(() => import('../features/registrations/List'));
const RegistrationCreate = React.lazy(() => import('../features/registrations/Create'));
const Fixtures = React.lazy(() => import('../features/fixtures/List'));
const FixtureGenerate = React.lazy(() => import('../features/fixtures/Generate'));
const Results = React.lazy(() => import('../features/results/List'));
const ResultEnter = React.lazy(() => import('../features/results/Enter'));
const ResultsEntry = React.lazy(() => import('../features/results/ResultsEntry'));
const Leaderboard = React.lazy(() => import('../features/results/Leaderboard'));
const NewsDetail = React.lazy(() => import('../features/news/Detail'));
const NewsList = React.lazy(() => import('../features/news/NewsList'));
const GalleryUpload = React.lazy(() => import('../features/gallery/Upload'));
const GalleryView = React.lazy(() => import('../features/gallery/Gallery'));
const Tickets = React.lazy(() => import('../features/ticketing/Events'));
const TicketCheckout = React.lazy(() => import('../features/ticketing/Checkout'));
const MyTickets = React.lazy(() => import('../features/ticketing/MyTickets'));
const Checkout = React.lazy(() => import('../features/tickets/Checkout'));
const MyTicketsNew = React.lazy(() => import('../features/tickets/MyTickets'));
const Notifications = React.lazy(() => import('../features/notifications/Notifications'));
const Dashboard = React.lazy(() => import('../features/dashboard/User'));
const UpgradeCenter = React.lazy(() => import('../features/upgrade/UpgradeCenter'));
const Profile = React.lazy(() => import('../features/profile/Profile'));
// Organizer/Coach/Athlete admin-like pages are disabled; use Django Admin for back-office

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      retry: 1,
    },
  },
});

// Layout wrapper
const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <SimpleErrorBoundary>
      <div className="min-h-screen flex flex-col">
        <OfflineIndicator />
        <Navbar />
        <main className="flex-1">
          <React.Suspense fallback={<Loading />}>
            {children}
          </React.Suspense>
        </main>
        <Footer />
      </div>
    </SimpleErrorBoundary>
  );
};

// Loading component
const Loading: React.FC = () => (
  <div className="min-h-screen flex items-center justify-center">
    <div className="spinner"></div>
  </div>
);

// Error boundary component
const SimpleErrorBoundary: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return <>{children}</>;
};

// Create the router
const router = createBrowserRouter([
  {
    path: '/',
    element: (
      <Layout>
        <React.Suspense fallback={<Loading />}>
          <Home />
        </React.Suspense>
      </Layout>
    ),
    errorElement: <SimpleErrorBoundary><div /></SimpleErrorBoundary>,
  },
  {
    path: '/upgrade',
    element: (
      <Protected>
        <Layout>
          <React.Suspense fallback={<Loading />}>
            <UpgradeCenter />
          </React.Suspense>
        </Layout>
      </Protected>
    ),
  },
  {
    path: '/login',
    element: (
      <React.Suspense fallback={<Loading />}>
        <Login />
      </React.Suspense>
    ),
  },
  {
    path: '/register',
    element: (
      <React.Suspense fallback={<Loading />}>
        <Register />
      </React.Suspense>
    ),
  },
  {
    path: '/events',
    element: (
      <Layout>
        <React.Suspense fallback={<Loading />}>
          <Events />
        </React.Suspense>
      </Layout>
    ),
  },
  {
    path: '/events/:id',
    element: (
      <Layout>
        <React.Suspense fallback={<Loading />}>
          <EventDetail />
        </React.Suspense>
      </Layout>
    ),
  },
  {
    path: '/events/create',
    element: (
      <Protected requiredRole={['ORGANIZER', 'ADMIN']}>
        <Layout>
          <React.Suspense fallback={<Loading />}>
            <EventCreate />
          </React.Suspense>
        </Layout>
      </Protected>
    ),
  },
  {
    path: '/events/:id/edit',
    element: (
      <Protected requiredRole={['ORGANIZER', 'ADMIN']}>
        <Layout>
          <React.Suspense fallback={<Loading />}>
            <EventEdit />
          </React.Suspense>
        </Layout>
      </Protected>
    ),
  },
  {
    path: '/venues',
    element: (
      <Layout>
        <React.Suspense fallback={<Loading />}>
          <Venues />
        </React.Suspense>
      </Layout>
    ),
  },
  {
    path: '/venues/:id',
    element: (
      <Layout>
        <React.Suspense fallback={<Loading />}>
          <VenueDetail />
        </React.Suspense>
      </Layout>
    ),
  },
  {
    path: '/registrations',
    element: (
      <Protected>
        <Layout>
          <React.Suspense fallback={<Loading />}>
            <Registrations />
          </React.Suspense>
        </Layout>
      </Protected>
    ),
  },
  {
    path: '/registrations/create',
    element: (
      <Protected>
        <Layout>
          <React.Suspense fallback={<Loading />}>
            <RegistrationCreate />
          </React.Suspense>
        </Layout>
      </Protected>
    ),
  },
  {
    path: '/fixtures',
    element: (
      <Protected requiredRole={['ORGANIZER', 'ADMIN']}>
        <Layout>
          <React.Suspense fallback={<Loading />}>
            <Fixtures />
          </React.Suspense>
        </Layout>
      </Protected>
    ),
  },
  {
    path: '/fixtures/generate',
    element: (
      <Protected requiredRole={['ORGANIZER', 'ADMIN']}>
        <Layout>
          <React.Suspense fallback={<Loading />}>
            <FixtureGenerate />
          </React.Suspense>
        </Layout>
      </Protected>
    ),
  },
  {
    path: '/results',
    element: (
      <Layout>
        <React.Suspense fallback={<Loading />}>
          <Results />
        </React.Suspense>
      </Layout>
    ),
  },
  {
    path: '/results/enter',
    element: (
      <Protected requiredRole={["COACH","ORGANIZER","ADMIN"]}>
        <Layout>
          <React.Suspense fallback={<Loading />}>
            <ResultEnter />
          </React.Suspense>
        </Layout>
      </Protected>
    ),
  },
  {
    path: '/events/:eventId/results',
    element: (
      <Protected requiredRole={["COACH","ORGANIZER","ADMIN"]}>
        <Layout>
          <React.Suspense fallback={<Loading />}>
            <ResultsEntry />
          </React.Suspense>
        </Layout>
      </Protected>
    ),
  },
  {
    path: '/events/:eventId/leaderboard',
    element: (
      <Layout>
        <React.Suspense fallback={<Loading />}>
          <Leaderboard />
        </React.Suspense>
      </Layout>
    ),
  },
  {
    path: '/news',
    element: (
      <Layout>
        <React.Suspense fallback={<Loading />}>
          <NewsList />
        </React.Suspense>
      </Layout>
    ),
  },
  {
    path: '/news/:id',
    element: (
      <Layout>
        <React.Suspense fallback={<Loading />}>
          <NewsDetail />
        </React.Suspense>
      </Layout>
    ),
  },
  {
    path: '/gallery',
    element: (
      <Layout>
        <React.Suspense fallback={<Loading />}>
          <GalleryView />
        </React.Suspense>
      </Layout>
    ),
  },
  {
    path: '/gallery/upload',
    element: (
      <Protected requiredRole={["ORGANIZER","ADMIN"]}>
        <Layout>
          <React.Suspense fallback={<Loading />}>
            <GalleryUpload />
          </React.Suspense>
        </Layout>
      </Protected>
    ),
  },
  {
    path: '/tickets',
    element: (
      <Layout>
        <React.Suspense fallback={<Loading />}>
          <Tickets />
        </React.Suspense>
      </Layout>
    ),
  },
  {
    path: '/events/:eventId/checkout',
    element: (
      <Protected>
        <Layout>
          <React.Suspense fallback={<Loading />}>
            <Checkout />
          </React.Suspense>
        </Layout>
      </Protected>
    ),
  },
  {
    path: '/tickets/me',
    element: (
      <Protected>
        <Layout>
          <React.Suspense fallback={<Loading />}>
            <MyTicketsNew />
          </React.Suspense>
        </Layout>
      </Protected>
    ),
  },
  {
    path: '/tickets/checkout',
    element: (
      <Protected>
        <Layout>
          <React.Suspense fallback={<Loading />}>
            <TicketCheckout />
          </React.Suspense>
        </Layout>
      </Protected>
    ),
  },
  {
    path: '/tickets/my-tickets',
    element: (
      <Protected>
        <Layout>
          <React.Suspense fallback={<Loading />}>
            <MyTickets />
          </React.Suspense>
        </Layout>
      </Protected>
    ),
  },
  {
    path: '/dashboard',
    element: (
      <Protected>
        <Layout>
          <React.Suspense fallback={<Loading />}>
            <Dashboard />
          </React.Suspense>
        </Layout>
      </Protected>
    ),
  },
  {
    path: '/profile',
    element: (
      <Protected>
        <Layout>
          <React.Suspense fallback={<Loading />}>
            <Profile />
          </React.Suspense>
        </Layout>
      </Protected>
    ),
  },
  // Admin routes removed - superusers use Django Admin at http://127.0.0.1:8000/admin
  {
    // Admin-like dashboards removed; use Django Admin instead
  },
  {
    path: '/notifications',
    element: (
      <Protected>
        <Layout>
          <React.Suspense fallback={<Loading />}>
            <Notifications />
          </React.Suspense>
        </Layout>
      </Protected>
    ),
  },
  {
    path: '/403',
    element: (
      <Layout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-6xl font-bold text-gray-900 mb-4">403</h1>
            <h2 className="text-2xl font-semibold text-gray-700 mb-4">
              Access Forbidden
            </h2>
            <p className="text-gray-600 mb-8">
              You don't have permission to access this page.
            </p>
            <a href="/dashboard" className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors">
              Go to Dashboard
            </a>
          </div>
        </div>
      </Layout>
    ),
  },
  {
    path: '/unauthorized',
    element: (
      <Layout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Unauthorized</h1>
            <p className="text-gray-600 mb-4">You don't have permission to access this page.</p>
            <a href="/" className="btn btn-primary">
              Go Home
            </a>
          </div>
        </div>
      </Layout>
    ),
  },
]);

// Main App component
const App: React.FC = () => {
  return (
    <SimpleErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <ToastProvider>
          <AuthProvider>
            <RouterProvider router={router} />
            <ReactQueryDevtools initialIsOpen={false} />
          </AuthProvider>
        </ToastProvider>
      </QueryClientProvider>
    </SimpleErrorBoundary>
  );
};

export default App;

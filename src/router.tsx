import { createBrowserRouter } from 'react-router-dom';
import { ProtectedRoute } from '@/auth/ProtectedRoute';
import { ErrorPage } from '@/components/ErrorPage';
import { RootLayout } from '@/components/RootLayout';
import { AboutPage } from '@/features/about/AboutPage';
import { LoginPage } from '@/features/account/LoginPage';
import { EntityDetailPage } from '@/features/entity-detail/EntityDetailPage';
import { AdminHomePage } from '@/features/evidence-admin/AdminHomePage';
import { MapPage } from '@/features/public-map/MapPage';

/**
 * React Router v7 data router.
 *
 * Public routes use backend-issued slugs (`bld-…` / `rm-…` / `sns-…`) so visitor
 * detail URLs are stable and shareable. Operator routes live under `/admin/*` behind
 * `ProtectedRoute` — the auth boundary is scaffolded now; real auth wiring is Phase 4.
 */
export const router = createBrowserRouter([
  {
    element: <RootLayout />,
    errorElement: <ErrorPage />,
    children: [
      // --- Visitor (Public.Api) ---
      { index: true, element: <MapPage /> },
      { path: 'buildings/:slug', element: <EntityDetailPage kind="building" /> },
      { path: 'rooms/:slug', element: <EntityDetailPage kind="room" /> },
      { path: 'sensors/:slug', element: <EntityDetailPage kind="sensor" /> },

      // --- Informational ---
      { path: 'about', element: <AboutPage /> },

      // --- Account (Auth.Api) ---
      { path: 'login', element: <LoginPage /> },

      // --- Operator (Evidence.Api), guarded ---
      {
        path: 'admin',
        element: (
          <ProtectedRoute>
            <AdminHomePage />
          </ProtectedRoute>
        ),
      },
    ],
  },
]);

import { createBrowserRouter } from 'react-router-dom';
import { ProtectedRoute } from '@/auth/ProtectedRoute';
import { ErrorPage } from '@/components/ErrorPage';
import { RootLayout } from '@/components/RootLayout';
import { AboutPage } from '@/features/about/AboutPage';
import { LoginPage } from '@/features/account/LoginPage';
import { RegisterPage } from '@/features/account/RegisterPage';
import { AccountSettingsPage } from '@/features/account/AccountSettingsPage';
import { ConfirmEmailPage } from '@/features/account/ConfirmEmailPage';
import { EntityDetailPage } from '@/features/entity-detail/EntityDetailPage';
import { AdminHomePage } from '@/features/evidence-admin/AdminHomePage';
import { BuildingNewPage } from '@/features/evidence-admin/BuildingNewPage';
import { BuildingDetailPage } from '@/features/evidence-admin/BuildingDetailPage';
import { RoomNewPage } from '@/features/evidence-admin/RoomNewPage';
import { RoomDetailPage } from '@/features/evidence-admin/RoomDetailPage';
import { SensorNewPage } from '@/features/evidence-admin/SensorNewPage';
import { SensorDetailPage } from '@/features/evidence-admin/SensorDetailPage';
import { MapPage } from '@/features/public-map/MapPage';

/**
 * React Router v7 data router.
 *
 * Public routes use backend-issued slugs (`bld-…` / `rm-…` / `sns-…`) so visitor
 * detail URLs are stable and shareable. Operator routes live under `/admin/*` behind
 * `ProtectedRoute` — Phase 4 wires the real auth boundary and the account screens.
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

      // --- Account (Auth.Api), anonymous ---
      { path: 'login', element: <LoginPage /> },
      { path: 'register', element: <RegisterPage /> },
      // Email-confirmation landings (links arrive from emails with token query params).
      { path: 'confirm-email', element: <ConfirmEmailPage kind="confirm-email" /> },
      { path: 'confirm-email-change', element: <ConfirmEmailPage kind="confirm-email-change" /> },

      // --- Operator (Evidence.Api + account settings), guarded ---
      {
        path: 'admin',
        element: <ProtectedRoute />,
        children: [
          { index: true, element: <AdminHomePage /> },
          { path: 'account', element: <AccountSettingsPage /> },

          // Evidence admin (F05–F09). IDs (server UUIDs) drive the nested operator URLs; the
          // public slug-based detail routes live on the visitor side (Public.Api).
          { path: 'buildings/new', element: <BuildingNewPage /> },
          { path: 'buildings/:buildingId', element: <BuildingDetailPage /> },
          { path: 'buildings/:buildingId/rooms/new', element: <RoomNewPage /> },
          { path: 'buildings/:buildingId/rooms/:roomId', element: <RoomDetailPage /> },
          {
            path: 'buildings/:buildingId/rooms/:roomId/sensors/new',
            element: <SensorNewPage />,
          },
          {
            path: 'buildings/:buildingId/rooms/:roomId/sensors/:sensorId',
            element: <SensorDetailPage />,
          },
        ],
      },
    ],
  },
]);

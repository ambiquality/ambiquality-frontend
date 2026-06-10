import { createBrowserRouter } from 'react-router-dom';
import { ProtectedRoute } from '@/auth/ProtectedRoute';
import { ErrorPage } from '@/components/ErrorPage';
import { RootLayout } from '@/components/RootLayout';
import { AboutPage } from '@/features/about/AboutPage';
import { ArchivePage } from '@/features/archive/ArchivePage';
import { CataloguePage } from '@/features/catalogue/CataloguePage';
import { PrivacyPolicyPage } from '@/features/legal/PrivacyPolicyPage';
import { LoginPage } from '@/features/account/LoginPage';
import { RegisterPage } from '@/features/account/RegisterPage';
import { AccountSettingsPage } from '@/features/account/AccountSettingsPage';
import { ConfirmEmailPage } from '@/features/account/ConfirmEmailPage';
import { BrowsePage } from '@/features/catalog-browse/BrowsePage';
import { EntityDetailPage } from '@/features/entity-detail/EntityDetailPage';
import { BuildingsListPage } from '@/features/evidence-admin/BuildingsListPage';
import { BuildingNewPage } from '@/features/evidence-admin/BuildingNewPage';
import { BuildingDetailPage } from '@/features/evidence-admin/BuildingDetailPage';
import { BuildingEditPage } from '@/features/evidence-admin/BuildingEditPage';
import { BuildingHistoryPage } from '@/features/evidence-admin/BuildingHistoryPage';
import { RoomNewPage } from '@/features/evidence-admin/RoomNewPage';
import { RoomDetailPage } from '@/features/evidence-admin/RoomDetailPage';
import { RoomEditPage } from '@/features/evidence-admin/RoomEditPage';
import { RoomHistoryPage } from '@/features/evidence-admin/RoomHistoryPage';
import { SensorNewPage } from '@/features/evidence-admin/SensorNewPage';
import { SensorDetailPage } from '@/features/evidence-admin/SensorDetailPage';
import { SensorEditPage } from '@/features/evidence-admin/SensorEditPage';
import { SensorHistoryPage } from '@/features/evidence-admin/SensorHistoryPage';
import { MapPage } from '@/features/public-map/MapPage';

/**
 * React Router v7 data router.
 *
 * Public detail routes use the backend-issued GUID — the persistent identifier the
 * Public.Api catalog and its linked-data IRIs resolve — so visitor detail URLs are
 * stable and shareable. Operator routes live under `/operator/*` behind
 * `ProtectedRoute` — Phase 4 wires the real auth boundary and the account screens.
 */
export const router = createBrowserRouter([
  {
    element: <RootLayout />,
    errorElement: <ErrorPage />,
    children: [
      // --- Visitor (Public.Api) ---
      { index: true, element: <MapPage /> },
      { path: 'browse', element: <BrowsePage /> },
      { path: 'buildings/:id', element: <EntityDetailPage kind="building" /> },
      { path: 'rooms/:id', element: <EntityDetailPage kind="room" /> },
      { path: 'sensors/:id', element: <EntityDetailPage kind="sensor" /> },

      // --- Open data (Public.Api) ---
      { path: 'catalog', element: <CataloguePage /> },
      { path: 'archive', element: <ArchivePage /> },

      // --- Informational ---
      { path: 'about', element: <AboutPage /> },
      { path: 'privacy', element: <PrivacyPolicyPage /> },

      // --- Account (Auth.Api), anonymous ---
      { path: 'login', element: <LoginPage /> },
      { path: 'register', element: <RegisterPage /> },
      // Email-confirmation landings (links arrive from emails with token query params).
      { path: 'confirm-email', element: <ConfirmEmailPage kind="confirm-email" /> },
      { path: 'confirm-email-change', element: <ConfirmEmailPage kind="confirm-email-change" /> },

      // --- Operator (Evidence.Api + account settings), guarded ---
      {
        path: 'operator',
        element: <ProtectedRoute />,
        children: [
          { index: true, element: <BuildingsListPage /> },
          { path: 'account', element: <AccountSettingsPage /> },

          // Evidence admin (F05–F09). IDs (server UUIDs) drive the nested operator URLs; the
          // public slug-based detail routes live on the visitor side (Public.Api). Each entity
          // splits into a read-only detail (card + nested list), an `edit` sub-route (temporal
          // attribute forms), and a `history` sub-route (asOf projection).
          { path: 'buildings/new', element: <BuildingNewPage /> },
          { path: 'buildings/:buildingId', element: <BuildingDetailPage /> },
          { path: 'buildings/:buildingId/edit', element: <BuildingEditPage /> },
          { path: 'buildings/:buildingId/history', element: <BuildingHistoryPage /> },
          { path: 'buildings/:buildingId/rooms/new', element: <RoomNewPage /> },
          { path: 'buildings/:buildingId/rooms/:roomId', element: <RoomDetailPage /> },
          { path: 'buildings/:buildingId/rooms/:roomId/edit', element: <RoomEditPage /> },
          { path: 'buildings/:buildingId/rooms/:roomId/history', element: <RoomHistoryPage /> },
          {
            path: 'buildings/:buildingId/rooms/:roomId/sensors/new',
            element: <SensorNewPage />,
          },
          {
            path: 'buildings/:buildingId/rooms/:roomId/sensors/:sensorId',
            element: <SensorDetailPage />,
          },
          {
            path: 'buildings/:buildingId/rooms/:roomId/sensors/:sensorId/edit',
            element: <SensorEditPage />,
          },
          {
            path: 'buildings/:buildingId/rooms/:roomId/sensors/:sensorId/history',
            element: <SensorHistoryPage />,
          },
        ],
      },
    ],
  },
]);

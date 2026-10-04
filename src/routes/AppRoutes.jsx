import { Routes, Route, Navigate } from 'react-router-dom';
import PublicLayout from '../layouts/PublicLayout';
import AdminLayout from '../layouts/AdminLayout';
import Home from '../pages/public/Home';
import Collection from '../pages/public/Collection';
import MentionsLegales from '../pages/public/MentionsLegales';
import Confidentialite from '../pages/public/Confidentialite';
import Conditions from '../pages/public/Conditions';
import ResidenceDetails from '../pages/public/ResidenceDetails';
import Auth from '../pages/public/Auth';
import Dashboard from '../pages/client/Dashboard';
import AdminDashboard from '../pages/admin/Dashboard';
import ResidencesManagement from '../pages/admin/ResidencesManagement';
import CreateResidence from '../pages/admin/CreateResidence';
import EditResidence from '../pages/admin/EditResidence';
import AmenitiesManagement from '../pages/admin/AmenitiesManagement';
import SubscribersManagement from '../pages/admin/SubscribersManagement';

import BookingDetails from '../pages/admin/BookingDetails';
import ClientsManagement from '../pages/admin/ClientsManagement';
import Settings from '../pages/admin/Settings';
import RequireAdmin from './RequireAdmin';
import BookingsManagement from '../pages/admin/BookingsManagement';
import CustomRequestsManagement from '../pages/admin/CustomRequestsManagement';
import CorporateRequestsManagement from '../pages/admin/CorporateRequestsManagement';

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<PublicLayout />}>
        <Route index element={<Home />} />
        <Route path="collection" element={<Collection />} />
        <Route path="collection/:id" element={<ResidenceDetails />} />
        <Route path="mentions-legales" element={<MentionsLegales />} />
        <Route path="confidentialite" element={<Confidentialite />} />
        <Route path="conditions" element={<Conditions />} />
        <Route path="client" element={<Dashboard />} />
      </Route>
      <Route path="/connexion" element={<Auth />} />
      <Route path="/auth" element={<Auth />} />
      <Route path="/admin" element={
        <RequireAdmin>
          <AdminLayout />
        </RequireAdmin>
      }>
        <Route index element={<AdminDashboard />} />
        <Route path="residences" element={<ResidencesManagement />} />
        <Route path="residences/create" element={<CreateResidence />} />
        <Route path="residences/:id/edit" element={<EditResidence />} />
        <Route path="amenities" element={<AmenitiesManagement />} />
        <Route path="subscribers" element={<SubscribersManagement />} />

        <Route path="bookings" element={<BookingsManagement />} />
        <Route path="bookings/:id" element={<BookingDetails />} />
        <Route path="custom-requests" element={<CustomRequestsManagement />} />
        <Route path="corporate-requests" element={<CorporateRequestsManagement />} />
        <Route path="clients" element={<ClientsManagement />} />
        <Route path="settings" element={<Settings />} />
        <Route path="*" element={<Navigate to="/admin" replace />} />
      </Route>
    </Routes>
  );
}

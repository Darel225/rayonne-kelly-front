import { Outlet } from 'react-router-dom';

export default function ClientLayout() {
  return (
    <div className="min-h-screen">
      <div>ClientLayout</div>
      <Outlet />
    </div>
  );
}

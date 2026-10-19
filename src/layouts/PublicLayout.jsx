import { Outlet } from 'react-router-dom';
import Navbar from '../components/public/Navbar';
import Footer from '../components/public/Footer';
import BrandIntro from '../components/public/BrandIntro';

export default function PublicLayout() {
  return (
    <div className="min-h-screen flex flex-col bg-ivory font-sans text-ink">
      <BrandIntro />
      <Navbar />
      <main className="flex-grow">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}


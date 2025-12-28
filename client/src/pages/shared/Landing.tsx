import { Link } from "react-router-dom";
import {
  FiLogIn,
  FiUserPlus,
  FiEye,
  FiShield,
  FiActivity,
} from "react-icons/fi";
import ModernBackground from "../../components/backgrounds/ModernBackground";

export default function Landing() {
  const brandName: string =
    (import.meta as any)?.env?.VITE_APP_NAME || "Güven Akışı";

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-slate-900">
      {/* Innovative Background */}
      <ModernBackground />

      {/* Top Navigation / Header Area */}
      <div className="absolute top-0 left-0 w-full p-6 z-50 flex items-center justify-between">
        {/* Brand Logo */}
        <div className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-blue-500/10 border border-blue-400/20 backdrop-blur-md">
          <FiActivity className="text-blue-400" />
          <span className="tracking-wide text-white text-md font-medium uppercase">
            {brandName}
          </span>
        </div>

        {/* CTA Buttons */}
        <div className="flex items-center gap-4">
          <Link
            to="/login"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-white/5 text-blue-100 hover:bg-white/10 hover:text-white transition-all backdrop-blur-md border border-white/10 font-medium text-sm"
          >
            <FiLogIn />
            <span>Giriş Yap</span>
          </Link>
          <Link
            to="/register"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-white text-blue-800 hover:bg-gray-200 transition-all shadow-lg shadow-blue-900/50 font-medium text-sm"
          >
            <FiUserPlus />
            <span>Kayıt Ol</span>
          </Link>
        </div>
      </div>

      {/* Content */}
      <div className="relative z-10 flex min-h-screen items-center justify-center">
        <div className="container mx-auto px-6">
          <div className="max-w-4xl mx-auto text-center">
            {/* Hero Title */}
            <h1 className="text-5xl md:text-7xl font-bold text-transparent bg-clip-text bg-linear-to-r from-white via-blue-100 to-blue-200 mb-6 tracking-tight leading-tight drop-shadow-lg">
              Şeffaflık ve Güvenle <br />
              <span className="text-blue-400 inline-block">
                İşbirliği Yapın
              </span>
            </h1>

            {/* Description */}
            <p className="text-lg md:text-xl text-blue-100/80 mb-10 max-w-2xl mx-auto leading-relaxed">
              Müşteriler ve serbest çalışanlar için sade, hızlı ve şeffaf proje
              deneyimi. İlan verin, teklifleri değerlendirin, süreçleri net ve
              güvenli şekilde yönetin.
            </p>

            {/* Features Grid */}
            <div className="flex flex-wrap justify-center gap-6 mb-12 text-blue-200">
              <div className="flex items-center gap-3 px-6 py-3 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm transition-all">
                <FiEye className="text-xl text-blue-400" />
                <span className="font-medium">Şeffaf Süreç</span>
              </div>
              <div className="flex items-center gap-3 px-6 py-3 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm transition-all">
                <FiShield className="text-xl text-blue-400" />
                <span className="font-medium">Güvenli Ödemeler</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
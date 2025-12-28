import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
// authService module not found; replace with your actual auth implementation
// import { login } from '../services/authService';
import { Input, Button, Loader } from "../../components";
import ModernBackground from "../../components/backgrounds/ModernBackground";

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);

    try {
      // E-posta ve şifre ile giriş yap
      // authService module not found; replace with your actual auth implementation
      // const loginPromise = login(email, password);
      const loginPromise = fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      }).then(async (res) => {
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          return { success: false, message: data.message || "Giriş başarısız" };
        }
        return data;
      });
      const timeoutPromise = new Promise((resolve) =>
        setTimeout(resolve, 5000)
      );

      const [res] = await Promise.all([loginPromise, timeoutPromise]);

      if (!res.success || !res.token) {
        setError(res.message || "Giriş bilgileri geçersiz");
      } else {
        localStorage.setItem("token", res.token);
        if (res.user) {
          try {
            localStorage.setItem("user", JSON.stringify(res.user));
          } catch {
            void 0;
          }
        }
        setSuccess("Giriş başarılı");

        // Kullanıcı tipine göre yönlendirme
        if (res.user && res.user.user_type) {
          const userType = res.user.user_type.toLowerCase();
          if (userType === "client") {
            setTimeout(() => navigate("/client"), 1000);
          } else if (userType === "freelancer") {
            setTimeout(() => navigate("/freelancer"), 1000);
          } else if (userType === "admin") {
            setTimeout(() => navigate("/admin"), 1000);
          } else {
            setTimeout(() => navigate("/home"), 1000);
          }
        } else {
          setTimeout(() => navigate("/home"), 1000);
        }
      }
    } catch (err) {
      console.error("Giriş hatası:", err);
      setError("Giriş yapılırken bir hata oluştu, lütfen tekrar deneyin");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex bg-slate-900 h-screen relative overflow-hidden">
      <ModernBackground />

      <div className="flex mx-auto relative z-10 w-full max-w-7xl">
        {/* Karşılama bölümü */}
        <div className="hidden md:flex md:w-1/2 p-12 flex-col justify-center text-white">
          <h1 className="text-3xl font-bold mb-2">HOŞ GELDİNİZ</h1>
          <h2 className="text-xl font-semibold mb-6">SİSTEM BAŞLIĞI</h2>
          <p className="text-blue-100 mb-6">
            Sistemimize hoş geldiniz. Giriş yapmak için bilgilerinizi giriniz.
          </p>
          <p className="text-blue-100 mb-6">
            Hesabınız yoksa, hemen yeni bir hesap oluşturabilirsiniz.
          </p>
        </div>

        {/* Form bölümü */}
        <div className="w-full max-w-[450px] min-h-[500px] h-auto my-auto bg-gray-100 border border-white/50 rounded-2xl shadow-2xl md:w-1/2 p-8 flex flex-col justify-center relative overflow-hidden">
          {/* Gradient glow effect - Adjusted for new background */}
          <div className="absolute top-0 left-0 w-full h-full bg-white/10 pointer-events-none"></div>

          {loading ? (
            <Loader text="Giriş yapılıyor..." />
          ) : (
            <div className="relative z-10 w-full">
              <h2 className="text-3xl font-bold text-center text-slate-900 mb-2 tracking-tight">
                Giriş Yap
              </h2>
              <p className="text-center text-slate-600 mb-8 font-medium">
                Hesabınıza erişmek için bilgilerinizi girin
              </p>

              {error && (
                <div className="p-3 mb-4 bg-red-100 border border-red-300 text-red-800 rounded-lg text-sm font-medium">
                  {error}
                </div>
              )}
              {success && (
                <div className="p-3 mb-4 bg-green-100 border border-green-300 text-green-800 rounded-lg text-sm font-medium">
                  {success}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4 w-full">
                <Input
                  id="email"
                  type="email"
                  label="E-posta Adresi"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="bg-white/70 border-slate-300 text-slate-900 placeholder-slate-500 focus:bg-white focus:border-blue-600 transition-all font-medium"
                  labelClassName="text-slate-800 font-semibold"
                />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  label="Şifre"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="bg-white/70 border-slate-300 text-slate-900 placeholder-slate-500 focus:bg-white focus:border-blue-600 transition-all font-medium"
                  labelClassName="text-slate-800 font-semibold"
                  rightElement={
                    <button
                      type="button"
                      className="text-xs font-bold text-blue-700 hover:text-blue-900 transition-colors"
                      onClick={() => setShowPassword((v) => !v)}
                    >
                      {showPassword ? "GİZLE" : "GÖSTER"}
                    </button>
                  }
                />

                <div className="flex items-center justify-between mt-4">
                  <label className="flex items-center space-x-2 cursor-pointer group">
                    <input
                      type="checkbox"
                      className="rounded border-slate-400 text-blue-700 focus:ring-blue-700/30 w-4 h-4"
                    />
                    <span className="text-sm font-medium text-slate-700 group-hover:text-slate-900 transition-colors">
                      Beni hatırla
                    </span>
                  </label>
                  <a
                    href="#"
                    className="text-sm font-bold text-blue-800 hover:text-blue-900 hover:underline transition-all"
                  >
                    Şifremi Unuttum?
                  </a>
                </div>

                <Button
                  type="submit"
                  variant="primary"
                  fullWidth
                  className="mt-8 shadow-lg shadow-blue-900/20 py-3 font-bold bg-blue-700 hover:bg-blue-800 text-white border-transparent"
                >
                  Giriş Yap
                </Button>

                <p className="text-center mt-6 text-slate-700 font-medium text-sm">
                  Hesabınız yok mu?{" "}
                  <Link
                    to="/register"
                    className="text-blue-800 font-bold hover:text-blue-900 hover:underline transition-all"
                  >
                    Kayıt Olun
                  </Link>
                </p>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

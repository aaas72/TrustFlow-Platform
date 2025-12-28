import { useState } from "react";
import { useNavigate } from "react-router-dom";
// import { register } from "../services/authService"; // temporarily commented out – fix path or create service
import { Input, Button, FormGroup, Loader } from "../../components";
import ModernBackground from "../../components/backgrounds/ModernBackground";

export default function Register() {
  const navigate = useNavigate();

  // Kullanıcı verileri
  const [fullName, setFullName] = useState("");
  const [userType, setUserType] = useState<"client" | "freelancer" | "">("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // Görünüm kontrolü
  const [step, setStep] = useState(1); // ← Mevcut aşama
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // 1. aşamada veri doğrulaması
  const validateStep1 = () => {
    if (!fullName.trim()) {
      setError("Ad Soyad alanı boş bırakılamaz");
      return false;
    }
    return true;
  };

  // 2. aşamada veri doğrulaması
  const validateStep2 = () => {
    if (!userType) {
      setError("Lütfen bir hesap türü seçin");
      return false;
    }
    return true;
  };

  // 3. aşamada veri doğrulaması
  const validateStep3 = () => {
    if (!email) {
      setError("E-posta adresi boş bırakılamaz");
      return false;
    }
    if (!password) {
      setError("Şifre boş bırakılamaz");
      return false;
    }
    if (password !== confirmPassword) {
      setError("Şifreler eşleşmiyor");
      return false;
    }
    return true;
  };

  // Sonraki aşamaya geçiş
  const nextStep = () => {
    setError(null);

    if (step === 1) {
      if (validateStep1()) {
        setStep(2);
      }
    } else if (step === 2) {
      if (validateStep2()) {
        setStep(3);
      }
    }
  };

  // Önceki aşamaya dönüş
  const prevStep = () => {
    setError(null);
    if (step > 1) {
      setStep(step - 1);
    }
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    // Son aşamada veri doğrulaması
    if (!validateStep3()) {
      return;
    }

    setLoading(true);

    try {
      // Hesap türü ile kayıt verilerini gönder
      const registerPromise = fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          full_name: fullName,
          email,
          password,
          user_type: userType,
        }),
      }).then((res) => res.json());
      const timeoutPromise = new Promise((resolve) =>
        setTimeout(resolve, 5000)
      );
      const [res] = await Promise.all([registerPromise, timeoutPromise]);
      if (!res.success) {
        setError(res.message || "Kayıt sırasında bir hata oluştu");
      } else {
        setSuccess("Kayıt başarılı! Giriş sayfasına yönlendiriliyorsunuz");
        setTimeout(() => navigate("/login"), 2000);
      }
    } catch (err) {
      console.error("Kayıt hatası:", err);
      setError("Kayıt sırasında bir hata oluştu, lütfen tekrar deneyin");
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
          <h1 className="text-3xl font-bold mb-2">BİZE KATILIN</h1>
          <h2 className="text-xl font-semibold mb-6">HESABINIZI OLUŞTURUN</h2>
          <p className="text-blue-100 mb-6">
            Sistemimize kayıt olarak tüm hizmetlerimizden faydalanabilirsiniz.
          </p>
          <p className="text-blue-100 mb-6">
            Kayıt işlemi sadece birkaç dakikanızı alacaktır.
          </p>
        </div>

        {/* Form bölümü */}
        <div className="w-full max-w-[450px] min-h-[500px] h-auto my-auto bg-gray-100 border border-white/50 rounded-2xl shadow-2xl md:w-1/2 p-8 flex flex-col justify-center relative overflow-hidden">
          {/* Gradient glow effect - Adjusted for new background */}
          <div className="absolute top-0 left-0 w-full h-full bg-white/10 pointer-events-none"></div>

          {loading ? (
            <Loader text="Kayıt yapılıyor..." />
          ) : (
            <div className="relative z-10 w-full">
              <h2 className="text-3xl font-bold text-center text-slate-900 mb-4 tracking-tight">
                Kayıt Ol
              </h2>

              {/* İlerleme göstergesi */}
              <div className="flex items-center justify-center mb-8 relative px-2">
                <div className="flex items-center justify-between w-full relative">
                  {/* Kesik çizgiler */}
                  <div className="absolute top-3 left-4 right-4 h-0.5 border-t-2 border-dashed border-slate-400 z-0"></div>

                  {/* Daireler ve metinler */}
                  {[1, 2, 3].map((s) => (
                    <div
                      key={s}
                      className="flex flex-col items-center relative z-10"
                    >
                      {/* Daire */}
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all duration-300 ${
                          step === s
                            ? "border-blue-600 bg-blue-600 text-white shadow-lg shadow-blue-600/30"
                            : step > s
                            ? "border-green-600 bg-green-600 text-white"
                            : "border-slate-400 bg-white/60 text-slate-500"
                        }`}
                      >
                        {step > s ? "✓" : s}
                      </div>
                      {/* Metin */}
                      <span
                        className={`text-[10px] mt-2 whitespace-nowrap font-bold uppercase tracking-wider ${
                          step === s
                            ? "text-blue-800"
                            : step > s
                            ? "text-green-700"
                            : "text-slate-600"
                        }`}
                      >
                        {s === 1
                          ? "Kişisel"
                          : s === 2
                          ? "Hesap Türü"
                          : "Giriş Bilgileri"}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

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

              <form onSubmit={handleSubmit} className="w-full">
                {/* Adım 1 */}
                {step === 1 && (
                  <FormGroup>
                    <Input
                      id="fullName"
                      type="text"
                      label="Ad Soyad"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      required
                      className="bg-white/70 border-slate-300 text-slate-900 placeholder-slate-500 focus:bg-white focus:border-blue-600 transition-all font-medium"
                      labelClassName="text-slate-800 font-semibold"
                    />
                    <div className="mt-8">
                      <Button
                        type="button"
                        variant="primary"
                        fullWidth
                        onClick={nextStep}
                        disabled={!fullName.trim()}
                        className="shadow-lg shadow-blue-900/20 py-3 font-bold bg-blue-700 hover:bg-blue-800 text-white border-transparent"
                      >
                        Devam Et →
                      </Button>
                    </div>
                  </FormGroup>
                )}

                {/* Adım 2 */}
                {step === 2 && (
                  <FormGroup>
                    <label className="block text-sm font-bold text-slate-800 mb-3">
                      Hesap Türü Seçiniz
                    </label>
                    <div className="grid grid-cols-2 gap-4">
                      <button
                        type="button"
                        onClick={() => setUserType("client")}
                        className={`px-2 py-6 rounded-xl border-2 text-center font-bold transition-all duration-200 flex flex-col items-center justify-center gap-2 ${
                          userType === "client"
                            ? "border-blue-600 bg-blue-100 text-blue-800 shadow-lg shadow-blue-600/20"
                            : "border-slate-300 bg-white/60 text-slate-600 hover:bg-white hover:text-slate-900"
                        }`}
                      >
                        <span>Müşteriyim</span>
                        <span className="text-xs font-semibold opacity-80">
                          Hizmet Almak İstiyorum
                        </span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setUserType("freelancer")}
                        className={`px-2 py-6 rounded-xl border-2 text-center font-bold transition-all duration-200 flex flex-col items-center justify-center gap-2 ${
                          userType === "freelancer"
                            ? "border-blue-600 bg-blue-100 text-blue-800 shadow-lg shadow-blue-600/20"
                            : "border-slate-300 bg-white/60 text-slate-600 hover:bg-white hover:text-slate-900"
                        }`}
                      >
                        <span>Freelancerım</span>
                        <span className="text-xs font-semibold opacity-80">
                          Hizmet Vermek İstiyorum
                        </span>
                      </button>
                    </div>
                    <div className="flex justify-between mt-8 gap-4">
                      <Button
                        type="button"
                        variant="secondary"
                        onClick={prevStep}
                        className="bg-white/80 text-slate-700 border-slate-300 hover:bg-white hover:text-slate-900 py-3 font-semibold"
                      >
                        ← Geri
                      </Button>
                      <Button
                        type="button"
                        variant="primary"
                        onClick={nextStep}
                        disabled={!userType}
                        className="flex-1 shadow-lg shadow-blue-900/20 py-3 font-bold bg-blue-700 hover:bg-blue-800 text-white border-transparent"
                      >
                        Devam Et →
                      </Button>
                    </div>
                  </FormGroup>
                )}

                {/* Adım 3 */}
                {step === 3 && (
                  <FormGroup className="space-y-4">
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
                    <Input
                      id="confirmPassword"
                      type="password"
                      label="Şifre Tekrar"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                      className="bg-white/70 border-slate-300 text-slate-900 placeholder-slate-500 focus:bg-white focus:border-blue-600 transition-all font-medium"
                      labelClassName="text-slate-800 font-semibold"
                    />
                    <div className="flex justify-between mt-8 gap-4">
                      <Button
                        type="button"
                        variant="secondary"
                        onClick={prevStep}
                        className="bg-white/80 text-slate-700 border-slate-300 hover:bg-white hover:text-slate-900 py-3 font-semibold"
                      >
                        ← Geri
                      </Button>
                      <Button
                        type="submit"
                        variant="primary"
                        className="flex-1 shadow-lg shadow-blue-900/20 py-3 font-bold bg-blue-700 hover:bg-blue-800 text-white border-transparent"
                      >
                        Kayıt Ol
                      </Button>
                    </div>
                  </FormGroup>
                )}
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
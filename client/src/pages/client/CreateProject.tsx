import React, { useMemo, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Input, Button, Loader } from "../../components";
import {
  FiDollarSign,
  FiClock,
  FiFolder,
  FiArrowLeft,
  FiSave,
} from "react-icons/fi";
import { createProject } from "../../services/projectService";
import { useToast } from "../../context/ToastContext";

const DRAFT_KEY = "client_project_draft";

export default function CreateProject() {
  const navigate = useNavigate();
  const { success: toastSuccess, error: toastError } = useToast();
  const [title, setTitle] = useState("");
  const [budget, setBudget] = useState("");
  const [deadline, setDeadline] = useState("");
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");
  const [skillTags, setSkillTags] = useState<string[]>([]);
  const [currentSkillInput, setCurrentSkillInput] = useState("");
  const [skillsText, setSkillsText] = useState("");
  const [loading, setLoading] = useState(false);
  const [draftSaved, setDraftSaved] = useState(false);

  // Load draft on mount
  useEffect(() => {
    const saved = localStorage.getItem(DRAFT_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.title) setTitle(parsed.title);
        if (parsed.budget) setBudget(parsed.budget);
        if (parsed.deadline) setDeadline(parsed.deadline);
        if (parsed.category) setCategory(parsed.category);
        if (parsed.description) setDescription(parsed.description);
        if (parsed.skillTags) setSkillTags(parsed.skillTags);
      } catch (e) {
        console.error("Failed to parse draft", e);
      }
    }
  }, []);

  // Auto-save draft
  useEffect(() => {
    const timer = setTimeout(() => {
      const draft = {
        title,
        budget,
        deadline,
        category,
        description,
        skillTags,
      };
      // Only save if there is some data
      if (
        title ||
        budget ||
        deadline ||
        category ||
        description ||
        skillTags.length > 0
      ) {
        localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
        setDraftSaved(true);
        setTimeout(() => setDraftSaved(false), 2000);
      }
    }, 1000); // Debounce 1 second

    return () => clearTimeout(timer);
  }, [title, budget, deadline, category, description, skillTags]);

  const readinessCount = useMemo(() => {
    let c = 0;
    if (title.trim().length >= 5) c++;
    if (budget && !isNaN(Number(budget)) && Number(budget) > 0) c++;
    if (deadline) c++;
    if (category) c++;
    if (description.trim().length >= 20) c++;
    if (skillTags.length > 0) c++;
    return c;
  }, [title, budget, deadline, category, description, skillTags]);

  const readinessPct = Math.round((readinessCount / 6) * 100);

  const formatCurrency = (v: string) => {
    const n = Number(v);
    if (isNaN(n)) return "-";
    return new Intl.NumberFormat("tr-TR", {
      style: "currency",
      currency: "TRY",
    }).format(n);
  };

  const suggestedSkills = [
    "React",
    "TypeScript",
    "Node.js",
    "Express",
    "TailwindCSS",
    "GraphQL",
    "PostgreSQL",
    "MongoDB",
    "Docker",
    "AWS",
    "CI/CD",
    "Jest",
  ];

  const descriptionPreview = useMemo(
    () => description.slice(0, 300),
    [description]
  );

  const addSkill = (s: string) => {
    const v = s.trim();
    if (!v) return;
    if (skillTags.includes(v)) return;
    const next = [...skillTags, v];
    setSkillTags(next);
    setSkillsText(next.join(", "));
    setCurrentSkillInput("");
  };

  const removeSkill = (s: string) => {
    const next = skillTags.filter((x) => x !== s);
    setSkillTags(next);
    setSkillsText(next.join(", "));
  };

  const handleSkillInput = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === "," || e.key === ";") {
      e.preventDefault();
      addSkill(currentSkillInput);
    }
  };

  const handleSkillsTextChange = (v: string) => {
    setSkillsText(v);
    const parsed = v
      .split(",")
      .map((x) => x.trim())
      .filter(Boolean);
    setSkillTags(parsed);
  };

  const resetCreateForm = () => {
    setTitle("");
    setBudget("");
    setDeadline("");
    setCategory("");
    setDescription("");
    setSkillTags([]);
    setCurrentSkillInput("");
    setSkillsText("");
    localStorage.removeItem(DRAFT_KEY);
  };

  const submit = async () => {
    setLoading(true);
    const start = Date.now();
    try {
      const client = localStorage.getItem("user");
      const clientId = client ? JSON.parse(client).id : undefined;
      const payload: any = {
        title: title.trim(),
        description: description.trim(),
        budget: Number(budget),
        deadline,
        client_id: clientId,
        skills: skillTags.length
          ? skillTags
          : skillsText
              .split(",")
              .map((s) => s.trim())
              .filter(Boolean),
      };
      const res = await createProject(payload);
      const elapsed = Date.now() - start;
      const remain = Math.max(0, 500 - elapsed);
      if (res.success) {
        toastSuccess("Proje başarıyla oluşturuldu");
        localStorage.removeItem(DRAFT_KEY);
        setTitle("");
        setBudget("");
        setDeadline("");
        setDescription("");
        setSkillsText("");
        await new Promise((r) => setTimeout(r, remain));
        navigate("/client/projects");
      } else {
        toastError(res.message || "Hata oluştu");
      }
    } catch (e) {
      toastError("Beklenmeyen hata oluştu");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-600"
            title="Geri Dön"
          >
            <FiArrowLeft size={20} />
          </button>
          <h3 className="text-2xl text-gray-700 font-bold">
            Yeni Proje Oluştur
          </h3>
        </div>
        <div className="hidden md:flex items-center gap-3">
          {draftSaved && (
            <span className="text-xs text-green-600 flex items-center gap-1 animate-fade-in">
              <FiSave /> Taslak kaydedildi
            </span>
          )}
          <span className="text-sm text-gray-600">
            Hazırlık: {readinessCount}/6
          </span>
          <div className="w-40 h-2 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-green-500 transition-all"
              style={{ width: `${readinessPct}%` }}
            />
          </div>
        </div>
      </div>
      <p className="text-sm text-gray-500 mb-6">
        Bilgileri girerken sağ tarafta canlı önizleme görünür.
      </p>
      {loading && <Loader overlay text="Kaydediliyor..." />}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div>
            <label
              htmlFor="title"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Proje Başlığı <span className="text-red-500">*</span>
            </label>
            <Input
              id="title"
              placeholder="Örn: E-ticaret Web Sitesi"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label
                htmlFor="budget"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Proje Bütçesi (TL) <span className="text-red-500">*</span>
              </label>
              <Input
                id="budget"
                type="number"
                step="0.01"
                placeholder="Örn: 5000"
                value={budget}
                onChange={(e) => setBudget(e.target.value)}
              />
              <div className="text-xs text-gray-600 mt-1">
                Güncel: {budget ? formatCurrency(budget) : "-"}
              </div>
            </div>
            <div>
              <label
                htmlFor="deadline"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Son Teslim Tarihi <span className="text-red-500">*</span>
              </label>
              <Input
                id="deadline"
                type="date"
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
                min={
                  new Date(Date.now() + 86400000).toISOString().split("T")[0]
                }
                className={`${
                  deadline && new Date(deadline) <= new Date()
                    ? "border-red-300"
                    : ""
                }`}
              />
            </div>
          </div>
          <div>
            <label
              htmlFor="category"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Proje Kategorisi <span className="text-red-500">*</span>
            </label>
            <select
              id="category"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full rounded border border-blue-700 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Proje kategorisini seçin</option>
              <option value="web-development">Web Geliştirme</option>
              <option value="mobile-development">
                Mobil Uygulama Geliştirme
              </option>
              <option value="design">Grafik Tasarım</option>
              <option value="marketing">Dijital Pazarlama</option>
              <option value="writing">Yazım ve Çeviri</option>
              <option value="data-analysis">Veri Analizi</option>
              <option value="other">Diğer</option>
            </select>
            <div className="mt-3 flex flex-wrap gap-2">
              {[
                { v: "web-development", l: "Web" },
                { v: "mobile-development", l: "Mobil" },
                { v: "design", l: "Tasarım" },
                { v: "marketing", l: "Pazarlama" },
                { v: "writing", l: "Yazım" },
                { v: "data-analysis", l: "Veri" },
              ].map((c) => (
                <button
                  key={c.v}
                  type="button"
                  onClick={() => setCategory(c.v)}
                  className={`px-2 py-1 text-xs rounded border transition-colors ${
                    category === c.v
                      ? "bg-blue-600 text-white border-blue-600"
                      : "bg-gray-100 text-gray-700 border-gray-300 hover:bg-gray-200"
                  }`}
                >
                  {c.l}
                </button>
              ))}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Projeniz için en uygun kategoriyi seçin
            </p>
          </div>
          <div>
            <label
              htmlFor="description"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Detaylı Proje Açıklaması <span className="text-red-500">*</span>
            </label>
            <textarea
              id="description"
              placeholder={
                "Projeniz için detaylı bir açıklama yazın:\n• Projenin amacı\n• Temel gereksinimler\n• İstenen çıktılar\n• Diğer önemli detaylar"
              }
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className={`w-full h-32 rounded border border-blue-700 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-vertical ${
                description.trim() && description.trim().length < 20
                  ? "border-red-300"
                  : ""
              }`}
              rows={6}
            />
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>Açıklama 20-2000 karakter arasında olmalıdır</span>
              <span className={description.length > 2000 ? "text-red-500" : ""}>
                {description.length}/2000
              </span>
            </div>
          </div>
          <div>
            <label
              htmlFor="skills"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Gerekli Yetenekler ve Teknolojiler{" "}
              <span className="text-red-500">*</span>
            </label>
            {skillTags.length > 0 && (
              <div className="flex flex-wrap gap-2 p-3 bg-gray-50 rounded-lg border">
                {skillTags.map((skill) => (
                  <span
                    key={skill}
                    className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-800 border border-blue-200"
                  >
                    {skill}
                    <button
                      type="button"
                      onClick={() => removeSkill(skill)}
                      className="ml-2 text-blue-600 hover:text-blue-800"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            )}
            <div className="relative mt-3">
              <Input
                id="skills"
                placeholder="Yetenek yazın ve Enter veya virgül ile ekleyin"
                value={currentSkillInput}
                onChange={(e) => setCurrentSkillInput(e.target.value)}
                onKeyDown={handleSkillInput}
                className={`${
                  skillsText.trim() && skillsText.trim().length < 3
                    ? "border-red-300"
                    : ""
                }`}
              />
              {currentSkillInput.trim() && (
                <button
                  type="button"
                  onClick={() => addSkill(currentSkillInput)}
                  className="absolute left-2 top-1/2 -translate-y-1/2 px-3 py-1 text-xs bg-blue-500 text-white rounded"
                >
                  Ekle
                </button>
              )}
            </div>
            <div className="mt-3">
              <p className="text-xs text-gray-600 mb-2">
                Popüler önerilen yetenekler:
              </p>
              <div className="flex flex-wrap gap-2">
                {suggestedSkills
                  .filter((s) => !skillTags.includes(s))
                  .slice(0, 12)
                  .map((skill) => (
                    <button
                      key={skill}
                      type="button"
                      onClick={() => addSkill(skill)}
                      className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded border border-gray-300 hover:bg-gray-200"
                    >
                      + {skill}
                    </button>
                  ))}
              </div>
            </div>
            <div className="hidden">
              <Input
                value={skillsText}
                onChange={(e) => handleSkillsTextChange(e.target.value)}
                placeholder="Yetenekler metin olarak"
              />
            </div>
            <div className="text-xs text-gray-500 mt-2 space-y-1">
              <p>• Yetenek yazın ve Enter veya virgül ile ekleyin</p>
              <p>• Hızlı eklemek için önerilen yeteneklere tıklayın</p>
              <p>• Herhangi bir yeteneği silmek için × işaretine tıklayın</p>
              <p>
                <strong>Toplam yetenekler:</strong> {skillTags.length}
              </p>
            </div>
          </div>
          <div className="pt-4 flex flex-col sm:flex-row gap-3">
            <Button
              variant="primary"
              isLoading={loading}
              onClick={submit}
              disabled={loading}
              className="flex-1 py-3 text-lg font-semibold"
            >
              {loading ? "Proje oluşturuluyor..." : "Projeyi Yayınla"}
            </Button>
            <button
              type="button"
              onClick={resetCreateForm}
              className="sm:w-40 px-4 py-3 rounded-md border text-gray-700 hover:bg-gray-50"
            >
              Formu Temizle
            </button>
          </div>
          <p className="text-xs text-gray-500 text-center mt-2">
            "Projeyi Yayınla" butonuna tıklayarak hizmet şartlarını kabul etmiş
            olursunuz
          </p>
        </div>
        <div className="lg:col-span-1">
          <div className="sticky top-4 space-y-4">
            <div className="bg-gray-50 border rounded-lg p-4">
              <div className="flex items-center justify-between">
                <h4 className="font-semibold text-gray-800">Proje Önizleme</h4>
                <span
                  className={`px-2 py-1 rounded-full text-xs border ${
                    readinessPct === 100
                      ? "bg-green-100 text-green-700 border-green-200"
                      : "bg-yellow-100 text-yellow-700 border-yellow-200"
                  }`}
                >
                  Taslak
                </span>
              </div>
              <div className="mt-3 space-y-3 text-sm">
                <div>
                  <span className="font-medium text-gray-700">Başlık:</span>{" "}
                  <span className="text-gray-900">{title || "—"}</span>
                </div>
                <div className="flex items-center text-green-700">
                  <FiDollarSign className="mr-2" />
                  <span>{budget ? formatCurrency(budget) : "—"}</span>
                </div>
                <div className="flex items-center text-blue-700">
                  <FiClock className="mr-2" />
                  <span>
                    {deadline ? new Date(deadline).toLocaleDateString() : "—"}
                  </span>
                </div>
                <div className="flex items-center text-purple-700">
                  <FiFolder className="mr-2" />
                  <span>{category || "—"}</span>
                </div>
                <div className="text-gray-700">
                  <span className="font-medium">Yetenekler:</span>{" "}
                  {skillTags.length > 0 ? `${skillTags.length} adet` : "—"}
                </div>
                <div className="text-gray-600">
                  <span className="font-medium">Açıklama:</span>{" "}
                  <span className="break-all whitespace-pre-wrap">
                    {descriptionPreview || "—"}
                  </span>
                </div>
              </div>
            </div>
            <div className="bg-white border rounded-lg p-4">
              <h5 className="text-sm font-medium text-gray-800">İpuçları</h5>
              <ul className="mt-2 text-xs text-gray-600 space-y-1">
                <li>Başlığı açık ve öz yazın.</li>
                <li>Bütçeyi gerçekçi belirleyin.</li>
                <li>Net gereksinimler ve teslim tarihi ekleyin.</li>
                <li>İlgili yetenekleri etiketler olarak ekleyin.</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

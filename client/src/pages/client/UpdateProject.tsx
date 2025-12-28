import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Input, Button, Loader } from "../../components";
import { FiDollarSign, FiClock, FiFolder } from "react-icons/fi";
import { getProjectById, updateProject } from "../../services/projectService";
import { getProjectSkills } from "../../services/projectService";
import { useToast } from "../../context/ToastContext";

export default function UpdateProject() {
  const { id } = useParams();
  const navigate = useNavigate();
  const projectId = Number(id);
  const { success: toastSuccess, error: toastError } = useToast();

  const [title, setTitle] = useState("");
  const [budget, setBudget] = useState("");
  const [deadline, setDeadline] = useState("");
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");
  const [skillTags, setSkillTags] = useState<string[]>([]);
  const [currentSkillInput, setCurrentSkillInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const res = await getProjectById(projectId);
        if (res.success && res.project) {
          setTitle(String(res.project.title || ""));
          setBudget(res.project.budget ? String(res.project.budget) : "");
          setDeadline(res.project.deadline ? String(res.project.deadline) : "");
          setDescription(String(res.project.description || ""));
        }
        const skillsRes = await getProjectSkills(projectId);
        if (skillsRes.success) {
          const names = (skillsRes.skills || []).map((s: any) =>
            String(s.name || s)
          );
          setSkillTags(names);
        }
      } finally {
        setLoading(false);
      }
    };
    if (!isNaN(projectId)) load();
  }, [projectId]);

  const descriptionPreview = useMemo(
    () => description.slice(0, 300),
    [description]
  );

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

  const addSkill = (s: string) => {
    const v = s.trim();
    if (!v) return;
    if (skillTags.includes(v)) return;
    const next = [...skillTags, v];
    setSkillTags(next);
    setCurrentSkillInput("");
  };

  const removeSkill = (s: string) => {
    const next = skillTags.filter((x) => x !== s);
    setSkillTags(next);
  };

  const handleSkillInput = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === "," || e.key === ";") {
      e.preventDefault();
      addSkill(currentSkillInput);
    }
  };

  const resetForm = () => {
    setTitle("");
    setBudget("");
    setDeadline("");
    setCategory("");
    setDescription("");
    setSkillTags([]);
    setCurrentSkillInput("");
  };

  const submit = async () => {
    setSaving(true);
    const start = Date.now();
    try {
      const payload: any = {};
      if (title.trim()) payload.title = title.trim();
      if (description.trim()) payload.description = description.trim();
      if (budget && !isNaN(Number(budget))) payload.budget = Number(budget);
      if (deadline) payload.deadline = deadline;
      if (skillTags.length) payload.skills = skillTags;

      const res = await updateProject(projectId, payload);
      const elapsed = Date.now() - start;
      const remain = Math.max(0, 500 - elapsed);
      if (res.success) {
        toastSuccess("Proje güncellendi");
        await new Promise((r) => setTimeout(r, remain));
        navigate("/client/projects");
      } else {
        toastError(res.message || "Hata");
      }
    } catch (e) {
      toastError("Beklenmeyen hata");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <Loader overlay text="Yükleniyor..." />;

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-2xl text-gray-700 font-bold">Projeyi Güncelle</h3>
        <div className="hidden md:flex items-center gap-3">
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
        Bilgileri düzenlerken sağ tarafta canlı önizleme görünür.
      </p>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div>
            <label
              htmlFor="title"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Proje Başlığı
            </label>
            <Input
              id="title"
              placeholder="Başlık"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className={`${
                title.trim() && title.trim().length < 5 ? "border-red-300" : ""
              }`}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label
                htmlFor="budget"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Beklenen Bütçe
              </label>
              <div className="relative">
                <Input
                  id="budget"
                  type="number"
                  step="0.01"
                  placeholder="Örnek: 5000"
                  value={budget}
                  onChange={(e) => setBudget(e.target.value)}
                  className={`${
                    budget && (isNaN(Number(budget)) || Number(budget) <= 0)
                      ? "border-red-300"
                      : ""
                  } pr-14`}
                />
                <span className="pointer-events-none absolute right-3 top-2.5 text-sm text-gray-500">
                  ₺
                </span>
              </div>
              <div className="text-xs text-gray-600 mt-1">
                Güncel: {budget ? formatCurrency(budget) : "-"}
              </div>
            </div>
            <div>
              <label
                htmlFor="deadline"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Teslim Tarihi
              </label>
              <Input
                id="deadline"
                type="date"
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
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
              Proje Kategorisi
            </label>
            <select
              id="category"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full rounded border border-blue-700 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Seçiniz</option>
              <option value="web-development">Web Geliştirme</option>
              <option value="mobile-development">Mobil Uygulama</option>
              <option value="design">Grafik Tasarım</option>
              <option value="marketing">Dijital Pazarlama</option>
              <option value="writing">Yazım ve Çeviri</option>
              <option value="data-analysis">Veri Analizi</option>
            </select>
          </div>

          <div>
            <label
              htmlFor="description"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Detaylı Proje Açıklaması
            </label>
            <textarea
              id="description"
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
              <span>20-2000 karakter</span>
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
              Gerekli Yetenekler
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
          </div>

          <div className="pt-4 flex flex-col sm:flex-row gap-3">
            <Button
              variant="primary"
              isLoading={saving}
              onClick={submit}
              disabled={saving}
              className="flex-1 py-3 text-lg font-semibold"
            >
              {saving ? "Proje güncelleniyor..." : "Projeyi Güncelle"}
            </Button>
            <button
              type="button"
              onClick={resetForm}
              className="sm:w-40 px-4 py-3 rounded-md border text-gray-700 hover:bg-gray-50"
            >
              Formu Temizle
            </button>
          </div>
          <p className="text-xs text-gray-500 text-center mt-2">
            Güncelle butonuna basarak değişiklikleri kaydedersiniz
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
                <li>Güncel verileri dikkatle düzenleyin.</li>
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

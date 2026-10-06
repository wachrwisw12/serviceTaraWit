import { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Save,
  Send,
  ChevronLeft,
  CheckCircle2,
  Hourglass,
  Award,
  BookOpen,
  GraduationCap,
  AlertCircle,
  FileText,
  Upload,
  Trash2,
  Loader2,
} from "lucide-react";
import { useAppDispatch, useAppSelector } from "../../../store/hooks";
import { useDocumentTitle } from "../../../hooks/useDocumentTitle";
import { useSystemName } from "../../setting/hooks/useSystemName";
import useSnackbar from "../../../components/snackbar/useSnackbar";
import { useDialog } from "../../../components/dialog";
import api from "../../../api/axios";
import {
  fetchTree,
  fetchQualityLevels,
  getOrCreateAssessment,
  saveScores,
  submitAssessment,
  clearMyAssessment,
} from "../api/iqaSlice";
import type {
  IQAIndicator,
  ScoreItem,
  IQAEvidence,
} from "../types/iqaTypes";

const STANDARD_ICONS = [Award, BookOpen, GraduationCap];

const SCORE_COLORS: Record<number, string> = {
  4: "bg-emerald-500",
  3: "bg-blue-500",
  2: "bg-amber-500",
  1: "bg-red-500",
  0: "bg-gray-400",
};

const SCORE_LABELS: Record<number, string> = {
  4: "ดีเลิศ",
  3: "ดี",
  2: "พอใช้",
  1: "ปรับปรุง",
  0: "ไม่ผ่าน",
};

export default function IQAAssessPage() {
  const { cycleId } = useParams<{ cycleId: string }>();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { showSnackbar } = useSnackbar();
  const { confirm } = useDialog();
  const { shortName } = useSystemName();
  useDocumentTitle(`ประกันคุณภาพ ป.ม. ${shortName}`);

  const {
    tree,
    myAssessment,
    loading,
    saving,
    error,
  } = useAppSelector((s) => s.iqa);

  // local scores state
  const [scores, setScores] = useState<Record<number, number>>({});
  const [comments, setComments] = useState<Record<number, string>>({});
  const [activeStandard, setActiveStandard] = useState(0);
  const [evidenceFile, setEvidenceFile] = useState<File | null>(null);
  const [evidenceList, setEvidenceList] = useState<IQAEvidence[]>([]);
  const [uploadingEvidence, setUploadingEvidence] = useState(false);

  const assessmentId = myAssessment?.assessment?.id;
  const isSubmitted = myAssessment?.assessment?.status === "SUBMITTED";

  // Load data
  useEffect(() => {
    if (!cycleId) return;
    dispatch(fetchTree());
    dispatch(fetchQualityLevels());
    dispatch(getOrCreateAssessment(Number(cycleId)));
    return () => {
      dispatch(clearMyAssessment());
    };
  }, [cycleId, dispatch]);

  // Sync scores from assessment detail
  useEffect(() => {
    if (!myAssessment) return;
    const saved: Record<number, number> = {};
    const savedComments: Record<number, string> = {};
    for (const s of myAssessment.scores) {
      saved[s.indicator_id] = s.score;
      if (s.comment) savedComments[s.indicator_id] = s.comment;
    }
    setScores(saved);
    setComments(savedComments);
    setEvidenceList(myAssessment.evidence);
  }, [myAssessment]);

  // All indicators flat list
  const allIndicators = useMemo(() => {
    const list: (IQAIndicator & { standardCode: string })[] = [];
    for (const std of tree) {
      for (const crit of std.criteria) {
        for (const ind of crit.indicators) {
          list.push({ ...ind, standardCode: std.code });
        }
      }
    }
    return list;
  }, [tree]);

  const answeredCount = Object.keys(scores).length;
  const totalIndicators = allIndicators.length;
  const isComplete = totalIndicators > 0 && answeredCount === totalIndicators;

  // Handle score change
  const handleScoreChange = (indicatorId: number, score: number) => {
    if (isSubmitted) return;
    setScores((prev) => ({ ...prev, [indicatorId]: score }));
  };

  // Save scores
  const handleSave = async () => {
    if (!assessmentId) return;

    const scoreItems: ScoreItem[] = Object.entries(scores).map(
      ([indicatorId, score]) => ({
        indicator_id: Number(indicatorId),
        score,
        comment: comments[Number(indicatorId)] || "",
      }),
    );

    const res = await dispatch(
      saveScores({ assessmentId, scores: scoreItems }),
    );

    if (saveScores.fulfilled.match(res)) {
      showSnackbar("บันทึกคะแนนสำเร็จ", "success");
    } else {
      showSnackbar((res.payload as string) || "บันทึกไม่สำเร็จ", "error");
    }
  };

  // Submit assessment
  const handleSubmit = async () => {
    if (!assessmentId) return;

    if (!isComplete) {
      showSnackbar(
        `กรุณาให้คะแนนให้ครบทุกตัวชี้วัด (${answeredCount}/${totalIndicators})`,
        "error",
      );
      return;
    }

    const confirmed = await confirm({
      type: "warning",
      title: "ยืนยันส่งผลการประกันคุณภาพ?",
      message: "เมื่อส่งแล้วจะไม่สามารถแก้ไขคะแนนได้",
      confirmText: "ส่งผลประเมิน",
      cancelText: "ตรวจสอบอีกครั้ง",
    });

    if (!confirmed) return;

    // Save first
    await handleSave();

    // Then submit
    const res = await dispatch(submitAssessment(assessmentId));
    if (submitAssessment.fulfilled.match(res)) {
      showSnackbar("ส่งผลการประกันคุณภาพสำเร็จ", "success");
      navigate("/iqa/cycles");
    } else {
      showSnackbar((res.payload as string) || "ส่งไม่สำเร็จ", "error");
    }
  };

  // Upload evidence
  const handleUploadEvidence = async () => {
    if (!assessmentId || !evidenceFile) return;

    setUploadingEvidence(true);
    try {
      const formData = new FormData();
      formData.append("file", evidenceFile);

      const res = await api.post(
        `/iqa/assessments/${assessmentId}/evidence`,
        formData,
        { headers: { "Content-Type": "multipart/form-data" } },
      );

      setEvidenceList((prev) => [res.data, ...prev]);
      setEvidenceFile(null);
      showSnackbar("อัปโหลดหลักฐานสำเร็จ", "success");
    } catch {
      showSnackbar("อัปโหลดไม่สำเร็จ", "error");
    } finally {
      setUploadingEvidence(false);
    }
  };

  // Delete evidence
  const handleDeleteEvidence = async (evidenceId: number) => {
    if (!assessmentId) return;

    try {
      await api.delete(
        `/iqa/assessments/${assessmentId}/evidence/${evidenceId}`,
      );
      setEvidenceList((prev) => prev.filter((e) => e.id !== evidenceId));
      showSnackbar("ลบหลักฐานสำเร็จ", "success");
    } catch {
      showSnackbar("ลบไม่สำเร็จ", "error");
    }
  };

  const currentStandard = tree[activeStandard];

  if (loading && !myAssessment) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center text-sm text-gray-400">
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        กำลังโหลดแบบประเมิน...
      </div>
    );
  }

  if (isSubmitted) {
    return (
      <div className="mx-auto max-w-3xl space-y-6 pb-8">
        <div className="flex items-center gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-6 text-center">              <CheckCircle2 className="h-8 w-8 text-emerald-500" />
          <div className="text-left">
            <h2 className="text-lg font-semibold text-emerald-800">
              ส่งผลการประกันคุณภาพแล้ว
            </h2>
            <p className="mt-1 text-sm text-emerald-600">
              ผลการประกันคุณภาพของคุณได้บันทึกเรียบร้อยแล้ว
            </p>
          </div>
        </div>
        <button
          onClick={() => navigate("/iqa/cycles")}
          className="flex items-center gap-2 rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50"
        >
          <ChevronLeft className="h-4 w-4" />
          กลับไปรายการรอบ
        </button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6 pb-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate("/iqa/cycles")}
          className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700"
        >
          <ChevronLeft className="h-4 w-4" />
          กลับ
        </button>

        <div className="text-right">
          <div className="text-xs text-gray-500">
            ให้คะแนนแล้ว {answeredCount}/{totalIndicators} ตัวชี้วัด
          </div>
          {error && (
            <div className="mt-1 flex items-center gap-1 text-xs text-red-500">
              <AlertCircle className="h-3 w-3" />
              {error}
            </div>
          )}
        </div>
      </div>

      {/* Standard tabs */}
      <div className="flex gap-2 overflow-x-auto">
        {tree.map((std, idx) => {
          const Icon = STANDARD_ICONS[idx] ?? Award;
          const stdAnswered = std.criteria.reduce(
            (sum, c) =>
              sum +
              c.indicators.filter((ind) => scores[ind.id] !== undefined)
                .length,
            0,
          );
          const stdTotal = std.criteria.reduce(
            (sum, c) => sum + c.indicators.length,
            0,
          );

          return (
            <button
              key={std.id}
              onClick={() => setActiveStandard(idx)}
              className={`flex shrink-0 items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-medium transition-all ${
                idx === activeStandard
                  ? "border-primary bg-primary/5 text-primary-dark shadow-sm"
                  : "border-gray-200 text-gray-600 hover:bg-gray-50"
              }`}
            >
              <Icon className="h-4 w-4" />
              มาตรฐานที่ {std.code}
              <span
                className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold ${
                  stdAnswered === stdTotal
                    ? "bg-emerald-100 text-emerald-700"
                    : "bg-gray-100 text-gray-500"
                }`}
              >
                {stdAnswered}/{stdTotal}
              </span>
            </button>
          );
        })}
      </div>

      {/* Current Standard content */}
      {currentStandard && (
        <div className="space-y-4">
          {currentStandard.criteria.map((criterion) => (
            <div
              key={criterion.id}
              className="overflow-hidden rounded-2xl border border-gray-200 bg-white"
            >
              <div className="border-b border-gray-100 bg-gray-50/50 px-5 py-3">
                <h3 className="text-sm font-semibold text-gray-800">
                  <span className="mr-2 rounded bg-primary/10 px-1.5 py-0.5 text-xs font-bold text-primary-dark">
                    {criterion.code}
                  </span>
                  {criterion.name}
                </h3>
              </div>

              <div className="divide-y divide-gray-100">
                {criterion.indicators.map((indicator) => (
                  <div key={indicator.id} className="px-5 py-4">
                    <p className="mb-3 text-sm text-gray-700">
                      <span className="mr-1.5 font-mono text-xs text-gray-400">
                        {indicator.code}
                      </span>
                      {indicator.name}
                    </p>

                    {/* Score buttons */}
                    <div className="flex flex-wrap gap-2">
                      {[4, 3, 2, 1, 0].map((score) => (
                        <button
                          key={score}
                          onClick={() =>
                            handleScoreChange(indicator.id, score)
                          }
                          className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-all ${
                            scores[indicator.id] === score
                              ? `${SCORE_COLORS[score]} border-transparent text-white shadow-sm`
                              : "border-gray-200 text-gray-600 hover:bg-gray-50"
                          }`}
                        >
                          <span className="font-bold">{score}</span>
                          {SCORE_LABELS[score]}
                        </button>
                      ))}
                    </div>

                    {/* Comment */}
                    <input
                      type="text"
                      placeholder="หมายเหตุ (ถ้ามี)"
                      value={comments[indicator.id] || ""}
                      onChange={(e) =>
                        setComments((prev) => ({
                          ...prev,
                          [indicator.id]: e.target.value,
                        }))
                      }
                      className="mt-2 w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-1.5 text-xs text-gray-600 placeholder:text-gray-400 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/20"
                    />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Evidence section */}
      <div className="rounded-2xl border border-gray-200 bg-white p-5">
        <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-gray-800">
          <FileText className="h-4 w-4 text-primary" />
          หลักฐาน/เอกสารประกอบ
        </h3>

        {/* Upload */}
        <div className="mb-4 flex items-center gap-3">
          <label className="flex flex-1 cursor-pointer items-center gap-2 rounded-lg border border-dashed border-gray-300 bg-gray-50 px-4 py-3 text-sm text-gray-500 transition-colors hover:border-primary hover:bg-primary/5">
            <Upload className="h-4 w-4" />
            {evidenceFile ? evidenceFile.name : "เลือกไฟล์"}
            <input
              type="file"
              className="hidden"
              accept=".pdf,.jpg,.jpeg,.png,.doc,.docx,.xls,.xlsx"
              onChange={(e) => setEvidenceFile(e.target.files?.[0] ?? null)}
            />
          </label>
          <button
            onClick={handleUploadEvidence}
            disabled={!evidenceFile || uploadingEvidence}
            className="flex shrink-0 items-center gap-1.5 rounded-lg bg-primary px-4 py-2.5 text-xs font-medium text-white transition-colors hover:bg-primary-dark disabled:opacity-50"
          >
            {uploadingEvidence ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Upload className="h-3.5 w-3.5" />
            )}
            อัปโหลด
          </button>
        </div>

        {/* File list */}
        {evidenceList.length > 0 ? (
          <div className="space-y-2">
            {evidenceList.map((e) => (
              <div
                key={e.id}
                className="flex items-center justify-between rounded-lg border border-gray-100 bg-gray-50/60 px-3 py-2"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-medium text-gray-700">
                    {e.file_name}
                  </p>
                  <p className="text-[10px] text-gray-400">
                    {(e.file_size / 1024).toFixed(1)} KB
                  </p>
                </div>
                {!isSubmitted && (
                  <button
                    onClick={() => handleDeleteEvidence(e.id)}
                    className="ml-2 shrink-0 rounded p-1 text-gray-300 transition-colors hover:text-red-500"
                  >
                    <Trash2 size={14} />
                  </button>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p className="py-3 text-center text-xs text-gray-400">
            ยังไม่มีหลักฐาน
          </p>
        )}
      </div>

      {/* Footer actions */}
      <div className="sticky bottom-0 flex items-center justify-between rounded-2xl border border-gray-200 bg-white p-4 shadow-lg">
        <div className="text-xs text-gray-500">
          {isComplete ? (
            <span className="flex items-center gap-1 text-emerald-600">
              <CheckCircle2 className="h-3.5 w-3.5" />
              ให้คะแนนครบทุกตัวชี้วัดแล้ว
            </span>
          ) : (
            <span className="flex items-center gap-1">
              <Hourglass className="h-3.5 w-3.5" />
              เหลืออีก {totalIndicators - answeredCount} ตัวชี้วัด
            </span>
          )}
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-1.5 rounded-lg border border-gray-200 px-4 py-2.5 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-50 disabled:opacity-50"
          >
            {saving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            บันทึก
          </button>
          <button
            onClick={handleSubmit}
            disabled={saving || !isComplete}
            className="flex items-center gap-1.5 rounded-lg bg-primary px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-primary-dark disabled:opacity-50"
          >
            <Send className="h-4 w-4" />
            ส่งผลประเมิน
          </button>
        </div>
      </div>
    </div>
  );
}

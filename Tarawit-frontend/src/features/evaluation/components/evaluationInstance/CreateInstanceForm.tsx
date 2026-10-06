import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "../../../../store/hooks";
import { fetchTemplateById, fetchTemplates } from "../../api/templateSlice";
import {
  fetchEvaluationRoundCount,
  createEvaluationInstance,
} from "../../api/evaluationinstanceSlice";
import { fetchUser } from "../../../user/UserSlice";
import type {
  TemplateType,
  Member,
  MemberGroup,
} from "../../types/template_type";
import type { UserListResponse } from "../../../user/UserType";
import useSnackbar from "../../../../components/snackbar/useSnackbar";
import { v4 as uuidv4 } from "uuid"; // npm install uuid
import InstanceTypePicker from "./InstanceTypePicker";
import { ICONS, SvgIcon } from "@/design-system/icons";
import { getCurrentAcademicYear } from "@/utils/date";
import { FieldLabel } from "./FieldLabel";
import { GroupMemberPicker } from "./GroupMemberPicker";
import SummaryRow from "./SummaryRow";
import { TemplatePreviewModal } from "./TemplatePreviewModal";
import { evaluationColor } from "@/design-system/colors/modules/evaluation";
import { TemplateMultiPicker } from "./TemplateMultiPicker";

/** เฉพาะฟิลด์ที่ picker แม่แบบต้องใช้ — templates จริงจาก redux มีฟิลด์เกินนี้ได้ */

interface RoundInfo {
  round: string;
  loading: boolean;
  error: boolean;
}

// ⬇️ ใหม่: ประเภทของ instance — กำหนด flow ทั้งหมดตั้งแต่ผู้เกี่ยวข้องไปจนถึง payload ที่ส่ง

interface EvaluationFormData {
  templateType: TemplateType;
  templateIds: string[];
  instanceName: string;
  academicYear: number;
  targetMembers: Member[];
  evaluatorMembers: Member[];
  evaluatorSettings: Record<string, { canScore: boolean; requiresSignature: boolean }>;
  showScoreToVisibility: boolean;
}
const accentColor = evaluationColor; // สีหลักของระบบประเมิน (ใช้กับวงกลมขั้นตอน, ปุ่ม, แถบความคืบหน้า)
const EVALUATOR_PERSON_TYPE_CODES = ["ผู้บริหาร", "DIRECTOR"];

function normalizeCode(value: string | null | undefined): string {
  return (value ?? "").trim().toUpperCase();
}

const EVALUATOR_PERSON_TYPE_CODES_NORMALIZED =
  EVALUATOR_PERSON_TYPE_CODES.map(normalizeCode);

/** map user list จาก API ให้กลายเป็น MemberGroup[] โดย group ตาม person_type_code
 *  พร้อมเพิ่มกลุ่ม "ทั้งหมด" รวมทุกคนไว้ท้ายสุด */
function buildMemberGroups(
  users: UserListResponse[],
  idPrefix: string,
): MemberGroup[] {
  const byCode = new Map<string, MemberGroup>();

  users.forEach((u) => {
    const code = u.person_type_code || "OTHER";
    const label = u.person_type_name || "อื่นๆ";
    const member: Member = {
      id: String(u.id),
      name: `${u.first_name ?? ""} ${u.last_name ?? ""}`.trim(),
      personTypeCode: u.person_type_code,
      personTypeName: u.person_type_name,
    };

    if (!byCode.has(code)) {
      byCode.set(code, {
        id: `${idPrefix}_${code}`,
        label,
        members: [],
      });
    }
    byCode.get(code)!.members.push(member);
  });

  const groups = Array.from(byCode.values());

  if (users.length > 0 && byCode.size > 1) {
    groups.push({
      id: `${idPrefix}_ALL`,
      label: "ทั้งหมด",
      members: users.map((u) => ({
        id: String(u.id),
        name: `${u.first_name ?? ""} ${u.last_name ?? ""}`.trim(),
        personTypeCode: u.person_type_code,
        personTypeName: u.person_type_name,
      })),
    });
  }

  return groups;
}

const CURRENT_ACADEMIC_YEAR = getCurrentAcademicYear();
const YEAR_OPTIONS = [
  CURRENT_ACADEMIC_YEAR - 1,
  CURRENT_ACADEMIC_YEAR,
  CURRENT_ACADEMIC_YEAR + 1,
];

const selectClass =
  "w-full h-11 px-3 border border-gray-200 rounded-lg text-sm text-gray-800 outline-none focus:ring-2 focus:border-gray-300 transition-colors bg-white hover:border-gray-300";

/** ขั้นตอนพร้อมเส้นเชื่อมแนวตั้งระหว่างวงกลมลำดับ — ให้เห็นภาพรวมของฟอร์มทั้งหมดเป็น flow เดียว
 *  ไม่ใช่แค่ตกแต่ง: วงกลมจะเปลี่ยนเป็นเครื่องหมายถูกสีเขียวเมื่อขั้นนั้นกรอกครบแล้ว */
/** ⬇️ ใหม่: แทนที่ StepSection แบบเดิม (แสดงทุก step ซ้อนกันแนวตั้ง) ด้วย wizard —
 *  แสดงทีละ step, มีแถบหัวข้อแนวนอนบอกความคืบหน้า, คลิกย้อนกลับ step ที่ผ่านมาแล้วได้ */
function WizardHeader({
  steps,
  currentIndex,
  onStepClick,
}: {
  steps: { title: string }[];
  currentIndex: number;
  onStepClick: (index: number) => void;
}) {
  return (
    <div className="flex items-center mb-8">
      {steps.map((s, i) => {
        const done = i < currentIndex;
        const active = i === currentIndex;
        const clickable = i <= currentIndex;
        return (
          <div
            key={s.title}
            className={`flex items-center ${i < steps.length - 1 ? "flex-1" : ""}`}
          >
            <button
              type="button"
              disabled={!clickable}
              onClick={() => onStepClick(i)}
              className="flex flex-col items-center gap-1.5 shrink-0 disabled:cursor-default"
            >
              <span
                className="flex items-center justify-center w-8 h-8 rounded-full text-sm font-semibold transition-colors"
                style={
                  done
                    ? { backgroundColor: accentColor.main, color: "#fff" }
                    : active
                      ? {
                          border: `1.5px solid ${accentColor.main}`,
                          color: accentColor.main,
                          backgroundColor: "#fff",
                        }
                      : {
                          border: "1.5px solid #d1d5db",
                          color: "#9ca3af",
                          backgroundColor: "#fff",
                        }
                }
              >
                {done ? (
                  <SvgIcon icon={ICONS.eye} className="w-4 h-4" />
                ) : (
                  i + 1
                )}
              </span>
              <span
                className="text-xs font-medium whitespace-nowrap"
                style={{ color: active || done ? "#374151" : "#9ca3af" }}
              >
                {s.title}
              </span>
            </button>
            {i < steps.length - 1 && (
              <div
                className="flex-1 h-px mx-2 mb-5"
                style={{ backgroundColor: done ? accentColor.main : "#e5e7eb" }}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

/** แถวสรุปในแผงด้านข้าง — ไอคอน + ป้ายกำกับ + ค่า ให้กวาดตาเจอค่าที่ต้องการเร็วขึ้น */

export default function EvaluationForm() {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { showSnackbar } = useSnackbar();
  const {
    user: users,
    loading: usersLoading,
    error: usersError,
  } = useAppSelector((state) => state.user);

  // ✅ รายชื่อแม่แบบจริงจาก GET /get-evaluation/template (ผ่าน GetTemplate handler ที่มีอยู่แล้ว)
  const { templates, templatesLoading, templatesError } = useAppSelector(
    (state) => state.template,
  );

  // ✅ สถานะการสร้างรอบใหม่ (ผ่าน evaluationInstanceSlice) — ใช้เฉพาะ creating/createError
  const { creating: submitting, createError } = useAppSelector(
    (state) => state.evaluationInstance,
  );

  useEffect(() => {
    dispatch(fetchUser());
    dispatch(fetchTemplates());
  }, [dispatch]);

  const { targetUsers, evaluatorUsers } = useMemo(() => {
    const evaluators = users.filter((u) =>
      EVALUATOR_PERSON_TYPE_CODES_NORMALIZED.includes(
        normalizeCode(u.person_type_code),
      ),
    );
    const targets = users.filter(
      (u) =>
        !EVALUATOR_PERSON_TYPE_CODES_NORMALIZED.includes(
          normalizeCode(u.person_type_code),
        ),
    );
    return { targetUsers: targets, evaluatorUsers: evaluators };
  }, [users]);

  const targetGroups = useMemo(
    () => buildMemberGroups(targetUsers, "GROUP_TARGET"),
    [targetUsers],
  );
  const evaluatorGroups = useMemo(
    () => buildMemberGroups(evaluatorUsers, "GROUP_EVALUATOR"),
    [evaluatorUsers],
  );

  // ✅ รายชื่อทั้งหมดสำหรับ "ค้นหา" — ไม่จำกัดตามกลุ่มที่ระบบแยกอัตโนมัติ (person_type_code)
  const allMembersForSearch = useMemo(
    () => [...targetGroups, ...evaluatorGroups].flatMap((g) => g.members),
    [targetGroups, evaluatorGroups],
  );

  // ✅ รายการกลุ่มทั้งหมดสำหรับ dropdown "เลือกกลุ่ม..." — ใช้ทั้งแบบประเมินและแบบสอบถาม
  // (แบบสอบถามเลือกผู้ตอบจากทุกกลุ่มได้ ไม่จำกัดเฉพาะกลุ่ม "เป้าหมาย" เดิม)
  const allGroupsForSelect = useMemo(
    () => [...targetGroups, ...evaluatorGroups],
    [targetGroups, evaluatorGroups],
  );

  const [form, setForm] = useState<EvaluationFormData>({
    templateType: "EVALUATION",
    templateIds: [],
    instanceName: "",
    academicYear: CURRENT_ACADEMIC_YEAR,
    targetMembers: [],
    evaluatorMembers: [],
    evaluatorSettings: {},
    showScoreToVisibility: false,
  });

  const isSurvey = form.templateType === "SURVEY";
  const [error, setError] = useState<string | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [roundsByTemplate, setRoundsByTemplate] = useState<
    Record<string, RoundInfo>
  >({});

  /** อัปเดตฟอร์ม — ถ้าเปลี่ยน templateIds จะ sync roundsByTemplate ด้วย
   *  แทนที่ useEffect cleanup เดิมที่ทำ cascading renders */
  const update = <K extends keyof EvaluationFormData>(
    key: K,
    value: EvaluationFormData[K],
  ) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    if (key === "templateIds") {
      setRoundsByTemplate((prev) => {
        const next: Record<string, RoundInfo> = {};
        (value as string[]).forEach((id) => {
          next[id] = prev[id] ?? { round: "1", loading: true, error: false };
        });
        return next;
      });
    }
  };

  // ⬇️ ใหม่: สลับประเภทรายการ — ล้างการเลือก "ผู้ประเมิน" ทิ้งเมื่อเปลี่ยนเป็นแบบสอบถาม
  // เพราะแบบสอบถามไม่มีผู้ประเมินแยก ป้องกันข้อมูลเก่าค้างอยู่เบื้องหลังโดยผู้ใช้ไม่รู้ตัว
  // + clamp currentStep ให้ไม่เกินจำนวน step ใหม่ (แทน useEffect ที่ทำ cascading renders)
  const handleTemplateTypeChange = (type: TemplateType) => {
    const newStepCount = type === "SURVEY" ? 3 : 4;
    setForm((prev) => ({
      ...prev,
      templateType: type,
      templateIds: [],
      evaluatorMembers: type === "SURVEY" ? [] : prev.evaluatorMembers,
      evaluatorSettings: type === "SURVEY" ? {} : prev.evaluatorSettings,
    }));

    setRoundsByTemplate({});
    setCurrentStep((prev) => Math.min(prev, newStepCount - 1));
  };

  // ⬇️ เปลี่ยนปีการศึกษา — reset loading ทุกแม่แบบ (เรียกใน event handler จึง batched ได้)
  const handleAcademicYearChange = (year: number) => {
    setForm((prev) => ({ ...prev, academicYear: year }));
    setRoundsByTemplate((prev) => {
      const next: Record<string, RoundInfo> = {};
      Object.keys(prev).forEach((id) => {
        next[id] = { round: prev[id]?.round ?? "1", loading: true, error: false };
      });
      return next;
    });
  };

  // ✅ คำนวณ "รอบที่" อัตโนมัติแยกต่อแม่แบบ — เฉพาะ async dispatch เท่านั้น
  // ไม่เรียก setState synchronous ใน effect body อีกต่อไป (loading ตั้งไว้แล้วใน update/handler)
  useEffect(() => {
    form.templateIds.forEach((templateId) => {
      dispatch(
        fetchEvaluationRoundCount({
          templateId,
          academicYear: form.academicYear,
        }),
      )
        .unwrap()
        .then((count) => {
          setRoundsByTemplate((prev) => ({
            ...prev,
            [templateId]: {
              round: String(count + 1),
              loading: false,
              error: false,
            },
          }));
        })
        .catch(() => {
          setRoundsByTemplate((prev) => ({
            ...prev,
            [templateId]: { round: "1", loading: false, error: true },
          }));
        });
    });
  }, [form.templateIds, form.academicYear, dispatch]);
  const filteredTemplates = useMemo(() => {
    return (templates ?? []).filter(
      (t) => t.template_type === form.templateType,
    );
  }, [templates, form.templateType]);
  const selectedTemplates = useMemo(
    () =>
      (templates ?? []).filter((t) => form.templateIds.includes(String(t.id))),
    [templates, form.templateIds],
  );
  const scorerCount = form.evaluatorMembers.filter(
    (member) => form.evaluatorSettings[member.id]?.canScore ?? true,
  ).length;

  // ⬇️ แก้ไข: validation แยกตามประเภท — แบบสอบถามไม่บังคับเลือกผู้ประเมิน
  const isValid = isSurvey
    ? form.templateIds.length > 0 && form.targetMembers.length > 0
    : form.templateIds.length > 0 &&
      form.targetMembers.length > 0 &&
      form.evaluatorMembers.length > 0 &&
      scorerCount > 0;

  // ⬇️ แก้ไข: แบบสอบถาม = ผู้ตอบแต่ละคนตอบเอง (ไม่คูณด้วยผู้ประเมิน)
  const assignmentCount = isSurvey
    ? form.targetMembers.length * form.templateIds.length
    : form.targetMembers.length *
      scorerCount *
      form.templateIds.length;
  const isLargeBatch = assignmentCount > 100;

  const handleOpenPreview = (templateId: string) => {
    const tpl = templates?.find((t) => String(t.id) === templateId);
    if (!tpl) return;
    dispatch(fetchTemplateById(tpl.id));
    setPreviewOpen(true);
  };

  const handleRequestSubmit = () => {
    if (!isValid) {
      setError(
        isSurvey
          ? "กรอกข้อมูลให้ครบก่อนสร้างแบบสอบถาม"
          : "กรอกข้อมูลให้ครบก่อนสร้างการประเมิน",
      );
      return;
    }
    setError(null);
    setConfirmOpen(true);
  };

  const handleConfirmSubmit = async () => {
    if (form.templateIds.length === 0) return;
    const batchId: string = uuidv4();

    const failedTemplateNames: string[] = [];

    for (const templateId of form.templateIds) {
      const tpl = templates?.find((t) => String(t.id) === templateId);
      if (!tpl) continue;

      try {
        await dispatch(
          createEvaluationInstance({
            batch_id: batchId,
            template_id: tpl.id,
            instance_name: form.instanceName,
            template_type: form.templateType,
            academic_year: form.academicYear,
            round: roundsByTemplate[templateId]?.round ?? "1",
            target_member_ids: form.targetMembers.map((m) => m.id),
            // ⬇️ แบบสอบถาม: ผู้ตอบคือผู้ประเมินตัวเอง — ส่ง evaluator_member_ids ว่างไว้
            // (ถ้า backend ต้องการ evaluator_id เท่ากับ target_id ต่อคน ให้ปรับตรงนี้แทน)
            evaluator_member_ids: isSurvey
              ? []
              : form.evaluatorMembers.map((m) => m.id),
            evaluator_settings: isSurvey
              ? []
              : form.evaluatorMembers.map((member, index) => ({
                  user_id: member.id,
                  can_score: form.evaluatorSettings[member.id]?.canScore ?? true,
                  requires_signature:
                    form.evaluatorSettings[member.id]?.requiresSignature ?? true,
                  signature_order: index + 1,
                  signature_role: "ผู้ประเมิน",
                })),
            show_score_to_visibility: form.showScoreToVisibility,
          }),
        ).unwrap();
      } catch {
        failedTemplateNames.push(tpl.template_name);
      }
    }

    setConfirmOpen(false);

    if (failedTemplateNames.length === 0) {
      showSnackbar("บันทึกข้อมูลสำเร็จ", "success");
      navigate("/dashboard");
    } else if (failedTemplateNames.length === form.templateIds.length) {
      setError(
        isSurvey
          ? "สร้างแบบสอบถามไม่สำเร็จ ลองใหม่อีกครั้ง"
          : "สร้างการประเมินไม่สำเร็จ ลองใหม่อีกครั้ง",
      );
    } else {
      showSnackbar(
        `สร้างสำเร็จบางส่วน — ไม่สำเร็จ: ${failedTemplateNames.join(", ")}`,
        "warning",
      );
      navigate("/dashboard");
    }
  };

  const createButtonLabel = isSurvey ? "สร้างแบบสอบถาม" : "สร้างการประเมิน";

  // ⬇️ ใหม่: wizard steps — จำนวน step ต่างกันตามประเภท (แบบสอบถามไม่มี step "การมองเห็นคะแนน")
  type StepId = "type" | "info" | "members" | "visibility";
  const stepIds: StepId[] = isSurvey
    ? ["type", "info", "members"]
    : ["type", "info", "members", "visibility"];

  const stepTitles: Record<StepId, string> = {
    type: "ประเภทรายการ",
    info: "เลือกแม่แบบ",
    members: isSurvey ? "ผู้ตอบแบบสอบถาม" : "ผู้เกี่ยวข้อง",
    visibility: "การมองเห็นคะแนน",
  };

  const isStepValid = (id: StepId): boolean => {
    switch (id) {
      case "type":
        return true;
      case "info":
        return form.templateIds.length > 0 && form.instanceName.trim() !== "";
      case "members":
        return isSurvey
          ? form.targetMembers.length > 0
          : form.targetMembers.length > 0 &&
              form.evaluatorMembers.length > 0 &&
              scorerCount > 0;
      case "visibility":
        return true;
    }
  };

  const [currentStep, setCurrentStep] = useState(0);



  const currentStepId = stepIds[currentStep];
  const isLastStep = currentStep === stepIds.length - 1;

  const goNext = () => {
    if (!isStepValid(currentStepId)) return;
    setCurrentStep((s) => Math.min(s + 1, stepIds.length - 1));
  };
  const goBack = () => setCurrentStep((s) => Math.max(s - 1, 0));

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-6 items-start max-w-4xl">
      {/* ฟอร์มหลัก — แสดงทีละ step */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
        <WizardHeader
          steps={stepIds.map((id) => ({ title: stepTitles[id] }))}
          currentIndex={currentStep}
          onStepClick={(i) => setCurrentStep(i)}
        />

        {currentStepId === "type" && (
          <div>
            <InstanceTypePicker
              value={form.templateType}
              onChange={handleTemplateTypeChange}
            />
          </div>
        )}

        {currentStepId === "info" && (
          <div>
            <FieldLabel required>แม่แบบ</FieldLabel>
            <TemplateMultiPicker
              templates={filteredTemplates}
              templateType={form.templateType}
              selectedIds={form.templateIds}
              onChange={(ids) => update("templateIds", ids)}
              onPreview={handleOpenPreview}
              loading={templatesLoading}
              error={templatesError}
            />

            <div className="grid grid-cols-2 gap-4 mt-4">
              <div>
                <FieldLabel required>ปีการศึกษา</FieldLabel>
                <select
                  value={form.academicYear}
                  onChange={(e) =>
                    handleAcademicYearChange(Number(e.target.value))
                  }
                  className={selectClass}
                  style={{
                    ["--tw-ring-color" as string]: `${accentColor.main}33`,
                  }}
                >
                  {YEAR_OPTIONS.map((y) => (
                    <option key={y} value={y}>
                      {y}
                      {y === CURRENT_ACADEMIC_YEAR ? " (ปัจจุบัน)" : ""}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <FieldLabel>รอบที่ (คำนวณอัตโนมัติต่อแม่แบบ)</FieldLabel>
                {form.templateIds.length === 0 ? (
                  <div
                    className={`${selectClass} flex items-center text-gray-400 cursor-default select-none`}
                  >
                    เลือกแม่แบบก่อน
                  </div>
                ) : (
                  <div className="space-y-1.5">
                    {form.templateIds.map((id) => {
                      const tpl = templates?.find((t) => String(t.id) === id);
                      const info = roundsByTemplate[id];
                      return (
                        <div
                          key={id}
                          className="flex items-center justify-between text-sm border border-gray-200 rounded-lg px-3 py-2 bg-white"
                        >
                          <span className="text-gray-600 truncate max-w-[55%]">
                            {tpl?.template_name ?? id}
                          </span>
                          <span className="text-gray-800 font-medium">
                            {info?.loading
                              ? "กำลังคำนวณ..."
                              : `รอบที่ ${info?.round ?? "1"}`}
                          </span>
                        </div>
                      );
                    })}
                    {Object.values(roundsByTemplate).some((r) => r.error) && (
                      <p className="text-xs text-gray-400">
                        บางแม่แบบคำนวณรอบอัตโนมัติไม่สำเร็จ ตั้งเป็นรอบ 1
                        ชั่วคราว
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>
            <div className="mt-4">
              <FieldLabel required>ชื่อรายการ</FieldLabel>
              <input
                type="text"
                value={form.instanceName}
                onChange={(e) => update("instanceName", e.target.value)}
                placeholder={
                  isSurvey
                    ? "ตัวอย่าง แบบสอบถามความพึงพอใจ ปี 2569"
                    : "ตัวอย่าง ประเมินบุคลากรครู ปี 2569"
                }
                className="w-full h-10 pl-3 pr-3 text-sm border border-gray-200 rounded-lg outline-none focus:ring-2 focus:border-gray-300 transition-colors bg-white hover:border-gray-300"
                style={{
                  ["--tw-ring-color" as string]: `${accentColor.main}33`,
                }}
              />
            </div>
          </div>
        )}

        {currentStepId === "members" && (
          <div>
            <p className="text-xs text-gray-400 mb-4">
              {isSurvey
                ? "แต่ละคนที่เลือกจะได้รับลิงก์ให้ตอบแบบสอบถามด้วยตนเอง"
                : "เลือกได้แยกกันว่าใครเป็นผู้ลงคะแนน และใครต้องมีช่องลงลายมือชื่อในรายงาน (ต้องมีผู้ลงคะแนนอย่างน้อย 1 คน)"}
            </p>
            <div className="space-y-4">
              <GroupMemberPicker
                label={isSurvey ? "ผู้ตอบแบบสอบถาม" : "กลุ่มเป้าหมาย"}
                groups={allGroupsForSelect}
                searchMembers={allMembersForSearch}
                selectedMembers={form.targetMembers}
                onChange={(members) => update("targetMembers", members)}
                placeholder={
                  isSurvey
                    ? "เลือกกลุ่มผู้ตอบแบบสอบถาม..."
                    : "เลือกกลุ่มผู้รับการประเมิน..."
                }
                loading={usersLoading}
                error={usersError}
              />

              {!isSurvey && (
                <div className="space-y-3">
                  <GroupMemberPicker
                    label="คณะผู้ประเมิน"
                    groups={allGroupsForSelect}
                    searchMembers={allMembersForSearch}
                    selectedMembers={form.evaluatorMembers}
                    onChange={(members) => {
                      update("evaluatorMembers", members);
                      setForm((prev) => {
                        const nextSettings: EvaluationFormData["evaluatorSettings"] = {};
                        for (const member of members) {
                          nextSettings[member.id] = prev.evaluatorSettings[member.id] ?? {
                            canScore: true,
                            requiresSignature: true,
                          };
                        }
                        return { ...prev, evaluatorMembers: members, evaluatorSettings: nextSettings };
                      });
                    }}
                    placeholder="เลือกคณะผู้ประเมิน..."
                    loading={usersLoading}
                    error={usersError}
                  />
                  {form.evaluatorMembers.length > 0 ? (
                    <div className="overflow-hidden rounded-lg border border-gray-200">
                      <div className="grid grid-cols-[1fr_90px_90px] bg-gray-50 px-3 py-2 text-xs font-medium text-gray-500">
                        <span>รายชื่อ</span><span className="text-center">ลงคะแนน</span><span className="text-center">ลงชื่อ</span>
                      </div>
                      {form.evaluatorMembers.map((member) => {
                        const setting = form.evaluatorSettings[member.id] ?? { canScore: true, requiresSignature: true };
                        return (
                          <div key={member.id} className="grid grid-cols-[1fr_90px_90px] items-center border-t border-gray-100 px-3 py-2.5 text-sm">
                            <span className="truncate">{member.name}</span>
                            <input type="checkbox" checked={setting.canScore} onChange={(event) => setForm((prev) => ({ ...prev, evaluatorSettings: { ...prev.evaluatorSettings, [member.id]: { ...setting, canScore: event.target.checked } } }))} className="mx-auto h-4 w-4" />
                            <input type="checkbox" checked={setting.requiresSignature} onChange={(event) => setForm((prev) => ({ ...prev, evaluatorSettings: { ...prev.evaluatorSettings, [member.id]: { ...setting, requiresSignature: event.target.checked } } }))} className="mx-auto h-4 w-4" />
                          </div>
                        );
                      })}
                    </div>
                  ) : null}
                </div>
              )}
            </div>
          </div>
        )}

        {currentStepId === "visibility" && (
          <div>
            <div className="flex items-center justify-between rounded-xl border border-gray-100 bg-gray-50/60 px-4 py-3.5">
              <div>
                <p className="text-sm font-medium text-gray-700">
                  เปิดให้ผู้ถูกประเมินเห็นคะแนน
                </p>
                <p className="text-xs text-gray-400 mt-0.5">
                  หากปิด จะเห็นเฉพาะสถานะ "ประเมินแล้ว" เท่านั้น
                </p>
              </div>
              <button
                type="button"
                onClick={() =>
                  update("showScoreToVisibility", !form.showScoreToVisibility)
                }
                className="relative h-6 w-11 rounded-full transition-colors shrink-0"
                style={{
                  backgroundColor: form.showScoreToVisibility
                    ? accentColor.main
                    : "#d1d5db",
                }}
                aria-pressed={form.showScoreToVisibility}
              >
                <span
                  className="absolute top-0.5 h-5 w-5 rounded-full bg-white transition-transform shadow-sm"
                  style={{
                    transform: form.showScoreToVisibility
                      ? "translateX(22px)"
                      : "translateX(2px)",
                  }}
                />
              </button>
            </div>
          </div>
        )}

        {(error || createError) && (
          <div className="bg-rose-50 border border-rose-100 text-rose-600 text-sm rounded-lg px-4 py-3 mt-6">
            {error ?? createError}
          </div>
        )}

        {/* ⬇️ ใหม่: แถบนำทาง ย้อนกลับ / ถัดไป / สร้าง — แทนที่ปุ่ม submit ซ้ำในแต่ละ step เดิม */}
        <div className="flex items-center justify-between mt-8 pt-6 border-t border-gray-100">
          <button
            type="button"
            onClick={currentStep === 0 ? () => navigate(-1) : goBack}
            className="h-11 px-5 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100 transition-colors"
          >
            {currentStep === 0 ? "ยกเลิก" : "ย้อนกลับ"}
          </button>

          {isLastStep ? (
            <button
              type="button"
              onClick={handleRequestSubmit}
              disabled={!isValid}
              className="h-11 px-6 rounded-lg text-sm font-medium text-white transition-all hover:brightness-95 active:brightness-90 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:brightness-100"
              style={{ backgroundColor: accentColor.main }}
            >
              {createButtonLabel}
            </button>
          ) : (
            <button
              type="button"
              onClick={goNext}
              disabled={!isStepValid(currentStepId)}
              className="h-11 px-6 rounded-lg text-sm font-medium text-white transition-all hover:brightness-95 active:brightness-90 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:brightness-100"
              style={{ backgroundColor: accentColor.main }}
            >
              ถัดไป
            </button>
          )}
        </div>
      </div>

      {/* แผงสรุปแบบเรียลไทม์ — อ่านอย่างเดียว ไม่มีปุ่ม submit ซ้ำ ปุ่มหลักอยู่ในแถบนำทางของฟอร์ม */}
      <aside className="hidden lg:block sticky top-6 bg-white rounded-xl border border-gray-100 shadow-sm p-5 space-y-4">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
          {isSurvey ? "สรุปแบบสอบถาม" : "สรุปรอบประเมิน"}
        </p>

        <div className="space-y-3 text-sm">
          <SummaryRow
            icon={ICONS.doc}
            label="แม่แบบ"
            value={
              selectedTemplates.length === 0
                ? "ยังไม่ได้เลือก"
                : selectedTemplates.length === 1
                  ? selectedTemplates[0].template_name
                  : `${selectedTemplates.length} แม่แบบ`
            }
          />
          <SummaryRow
            icon={ICONS.calendar}
            label="ปีการศึกษา"
            value={String(form.academicYear)}
          />
          <SummaryRow
            icon={ICONS.users}
            label={isSurvey ? "ผู้ตอบ" : "เป้าหมาย"}
            value={`${form.targetMembers.length} คน`}
          />
          {!isSurvey && (
            <SummaryRow
              icon={ICONS.users}
              label="ผู้ประเมิน"
              value={`${form.evaluatorMembers.length} คน`}
            />
          )}
        </div>

        <div className="h-px bg-gray-100" />

        <div
          className="rounded-lg px-3.5 py-3"
          style={{
            backgroundColor: isLargeBatch ? "#fef3c7" : accentColor.soft,
          }}
        >
          <p
            className="text-xs font-medium mb-0.5 flex items-center gap-1.5"
            style={{ color: isLargeBatch ? "#92400e" : accentColor.dark }}
          >
            <SvgIcon icon={ICONS.users} className="w-3.5 h-3.5" />
            การมอบหมายที่จะสร้าง
          </p>
          <p
            className="text-xl font-bold"
            style={{ color: isLargeBatch ? "#92400e" : accentColor.dark }}
          >
            {assignmentCount.toLocaleString("th-TH")} รายการ
          </p>
          {isLargeBatch && (
            <p className="text-xs text-amber-700 mt-1 flex items-center gap-1">
              <SvgIcon icon={ICONS.check} className="w-3.5 h-3.5 shrink-0" />
              จำนวนมาก ตรวจสอบรายชื่ออีกครั้งก่อนยืนยัน
            </p>
          )}
        </div>
      </aside>

      {confirmOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 px-4"
          onClick={() => !submitting && setConfirmOpen(false)}
        >
          <div
            className="bg-white rounded-xl shadow-lg max-w-md w-full p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-lg font-bold text-gray-900">
              {isSurvey
                ? "ยืนยันการสร้างแบบสอบถาม"
                : "ยืนยันการสร้างการประเมิน"}
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              ระบบจะสร้าง {assignmentCount.toLocaleString("th-TH")} การมอบหมาย
              จาก {form.templateIds.length} แม่แบบ และแจ้งเตือน
              {isSurvey ? "ผู้ตอบ" : "กลุ่มเป้าหมาย"}ทันทีหลังสร้าง
            </p>

            <div className="flex items-center justify-end gap-3 mt-6">
              <button
                type="button"
                onClick={() => setConfirmOpen(false)}
                disabled={submitting}
                className="h-10 px-4 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100 transition-colors disabled:opacity-60"
              >
                กลับไปแก้ไข
              </button>
              <button
                type="button"
                onClick={handleConfirmSubmit}
                disabled={submitting}
                className="h-10 px-5 rounded-lg text-sm font-medium text-white transition-all hover:brightness-95 active:brightness-90 disabled:opacity-60"
                style={{ backgroundColor: accentColor.main }}
              >
                {submitting ? "กำลังสร้าง..." : "ยืนยันสร้าง"}
              </button>
            </div>
          </div>
        </div>
      )}

      {previewOpen && (
        <TemplatePreviewModal onClose={() => setPreviewOpen(false)} />
      )}
    </div>
  );
}

/**
 * หมายเหตุฝั่ง backend ที่ต้องตามไปแก้ให้ frontend นี้ทำงานได้จริง:
 * 1. เพิ่มคอลัมน์ instance_type ('evaluation' | 'survey') ในตาราง evaluation_instances (หรือ batch)
 * 2. handler createEvaluationInstance ต้องรับ instance_type และ evaluator_member_ids ว่างได้
 *    (แบบสอบถามไม่มี evaluator แยก — assignment ควรผูก respondent เป็นทั้ง target และ answerer)
 * 3. ตาราง evaluation_assignments (หรือเทียบเท่า) ต้องรองรับกรณี evaluator_id = target_id
 *    หรือ evaluator_id เป็น NULL สำหรับแบบสอบถาม แล้วให้ "Answer" flow อ่านจาก target แทน
 * 4. GetMyTasks / GetAllTasks ต้อง filter/แสดง instance_type ด้วย เพื่อแยกรายการแบบประเมินกับแบบสอบถามในหน้า list
 */

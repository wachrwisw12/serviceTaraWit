import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Users,
  UserCheck,
  Search,
  Trash2,
  AlertTriangle,
  CheckSquare,
  Square,
  MinusSquare,
  History,
  UserPlus,
  UserMinus,
} from "lucide-react";

import { useAppDispatch, useAppSelector } from "../../../store/hooks";
import { useDialog } from "../../../components/dialog";
import { fetchUser } from "../../user/UserSlice";
import {
  fetchInstanceEditDetail,
  updateInstanceTargets,
  updateInstanceEvaluators,
  fetchInstanceAuditLogs,
  resetEditState,
  resetAuditLogs,
} from "../api/createdEvaluationSlice";
import type { MemberGroup } from "../types/template_type";
import type { UserListResponse } from "../../user/UserType";

const ACCENT = "var(--color-primary)";
const selectClass =
  "w-full h-11 px-3 border border-gray-200 rounded-lg text-sm text-gray-800 outline-none focus:ring-2 focus:border-gray-300 transition-colors bg-white hover:border-gray-300";

const EVALUATOR_PERSON_TYPE_CODES = ["ผู้บริหาร", "DIRECTOR"];

function normalizeCode(value: string | null | undefined): string {
  return (value ?? "").trim().toUpperCase();
}

const EVALUATOR_PERSON_TYPE_CODES_NORMALIZED =
  EVALUATOR_PERSON_TYPE_CODES.map(normalizeCode);

/** จัดกลุ่ม user ตาม person_type_code */
function buildMemberGroups(
  users: UserListResponse[],
  idPrefix: string,
): MemberGroup[] {
  const byCode = new Map<string, MemberGroup>();

  users.forEach((u) => {
    const code = u.person_type_code || "OTHER";
    const label = u.person_type_name || "อื่นๆ";
    const member = {
      id: String(u.id),
      name: `${u.first_name ?? ""} ${u.last_name ?? ""}`.trim(),
    };

    if (!byCode.has(code)) {
      byCode.set(code, { id: `${idPrefix}_${code}`, label, members: [] });
    }
    byCode.get(code)!.members.push(member);
  });

  const groups = Array.from(byCode.values());

  // เพิ่มกลุ่ม "ทั้งหมด" ไว้ท้ายสุด
  if (users.length > 0) {
    groups.push({
      id: `${idPrefix}_ALL`,
      label: "ทั้งหมด",
      members: users.map((u) => ({
        id: String(u.id),
        name: `${u.first_name ?? ""} ${u.last_name ?? ""}`.trim(),
      })),
    });
  }

  return groups;
}

export default function EditInstancePage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { confirm, alert } = useDialog();

  const {
    editDetail: detail,
    editLoading: loading,
    editError: error,
    editSaving: saving,
    editSaveError: saveError,
    auditLogs,
    auditLoading,
  } = useAppSelector((state) => state.createdEvaluation);

  const { user: users, loading: usersLoading } = useAppSelector(
    (state) => state.user,
  );

  const [activeTab, setActiveTab] = useState<"targets" | "evaluators">(
    "targets",
  );
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const searchWrapRef = useRef<HTMLDivElement | null>(null);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [showAuditLog, setShowAuditLog] = useState(false);

  useEffect(() => {
    if (id) {
      dispatch(fetchInstanceEditDetail(Number(id)));
      dispatch(fetchUser());
    }
    return () => {
      dispatch(resetEditState());
      dispatch(resetAuditLogs());
    };
  }, [dispatch, id]);

  // Reset selection เมื่อเปลี่ยน tab
  useEffect(() => {
    setSelectedIds(new Set());
    setSearchTerm("");
  }, [activeTab]);

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
    () => buildMemberGroups(targetUsers, "GRP_TARGET"),
    [targetUsers],
  );
  const evaluatorGroups = useMemo(
    () => buildMemberGroups(evaluatorUsers, "GRP_EVAL"),
    [evaluatorUsers],
  );

  const currentGroups =
    activeTab === "targets" ? targetGroups : evaluatorGroups;

  // Members that can be added (not already in the list)
  const availableMembers = useMemo(() => {
    if (!detail) return [];
    const source = activeTab === "targets" ? targetUsers : evaluatorUsers;
    const existingIds = new Set(
      (activeTab === "targets" ? detail.targets : detail.evaluators).map(
        (m) => String(m.user_id),
      ),
    );
    return source
      .filter((u) => !existingIds.has(String(u.id)))
      .map((u) => ({
        id: String(u.id),
        name: `${u.first_name ?? ""} ${u.last_name ?? ""}`.trim(),
      }));
  }, [detail, activeTab, targetUsers, evaluatorUsers]);

  const filteredAvailable = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) return availableMembers.slice(0, 15);
    return availableMembers
      .filter((m) => m.name.toLowerCase().includes(term))
      .slice(0, 15);
  }, [availableMembers, searchTerm]);

  const currentMembers =
    activeTab === "targets" ? detail?.targets ?? [] : detail?.evaluators ?? [];

  // Members ที่ลบทีเดียวได้ (ยังไม่มี has_submitted)
  const removableMembers = useMemo(
    () => currentMembers.filter((m) => !m.has_submitted),
    [currentMembers],
  );

  const allVisibleSelected =
    removableMembers.length > 0 &&
    removableMembers.every((m) => selectedIds.has(m.user_id));

  const someSelected = removableMembers.some((m) =>
    selectedIds.has(m.user_id),
  );

  // ── Handlers ───────────────────────────────────────────

  /** เพิ่มสมาชิกจากกลุ่ม (bulk) */
  const handleAddGroup = async (groupId: string) => {
    if (!detail) return;
    const group = currentGroups.find((g) => g.id === groupId);
    if (!group) return;

    const existingIds = new Set(
      currentMembers.map((m) => String(m.user_id)),
    );
    const newUserIds = group.members
      .map((m) => m.id)
      .filter((id) => !existingIds.has(id));

    if (newUserIds.length === 0) {
      await alert({
        type: "info",
        title: "ไม่มีรายชื่อใหม่",
        message: `ทุกคนในกลุ่ม "${group.label}" อยู่ในรายการแล้ว`,
      });
      return;
    }

    // ยืนยันก่อนเพิ่ม
    const confirmed = await confirm({
      type: "info",
      title: `เพิ่ม ${group.label}?`,
      message: `ต้องการเพิ่ม ${newUserIds.length} คนจากกลุ่ม "${group.label}" ใช่หรือไม่`,
      confirmText: `เพิ่ม ${newUserIds.length} คน`,
      cancelText: "ยกเลิก",
    });

    if (!confirmed) return;

    if (activeTab === "targets") {
      await dispatch(
        updateInstanceTargets({
          instanceId: detail.id,
          payload: { add_user_ids: newUserIds, remove_user_ids: [] },
        }),
      ).unwrap();
    } else {
      await dispatch(
        updateInstanceEvaluators({
          instanceId: detail.id,
          payload: { add_user_ids: newUserIds, remove_user_ids: [] },
        }),
      ).unwrap();
    }
  };

  /** เพิ่มรายบุคคล */
  const handleAddOne = async (userId: string) => {
    if (!detail) return;
    if (activeTab === "targets") {
      await dispatch(
        updateInstanceTargets({
          instanceId: detail.id,
          payload: { add_user_ids: [userId], remove_user_ids: [] },
        }),
      ).unwrap();
    } else {
      await dispatch(
        updateInstanceEvaluators({
          instanceId: detail.id,
          payload: { add_user_ids: [userId], remove_user_ids: [] },
        }),
      ).unwrap();
    }
    setSearchTerm("");
    setShowSuggestions(false);
  };

  /** ลบรายบุคคล */
  const handleRemoveOne = async (userId: number) => {
    if (!detail) return;
    const member = currentMembers.find((m) => m.user_id === userId);
    if (member?.has_submitted) return;

    if (activeTab === "targets") {
      await dispatch(
        updateInstanceTargets({
          instanceId: detail.id,
          payload: { add_user_ids: [], remove_user_ids: [String(userId)] },
        }),
      ).unwrap();
    } else {
      await dispatch(
        updateInstanceEvaluators({
          instanceId: detail.id,
          payload: { add_user_ids: [], remove_user_ids: [String(userId)] },
        }),
      ).unwrap();
    }
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.delete(userId);
      return next;
    });
  };

  /** ลบหลายคนพร้อมกัน (bulk remove) */
  const handleBulkRemove = async () => {
    if (!detail || selectedIds.size === 0) return;

    const userIdsToRemove = Array.from(selectedIds)
      .filter((uid) => {
        const member = currentMembers.find((m) => m.user_id === uid);
        return member && !member.has_submitted;
      })
      .map(String);

    if (userIdsToRemove.length === 0) return;

    const confirmed = await confirm({
      type: "warning",
      title: "ลบรายการที่เลือก?",
      message: `ต้องการลบ ${userIdsToRemove.length} คนออกจากรายการ ใช่หรือไม่\n(รายการที่มีผลประเมินแล้วจะไม่ถูกลบ)`,
      confirmText: `ลบ ${userIdsToRemove.length} คน`,
      cancelText: "ยกเลิก",
    });

    if (!confirmed) return;

    if (activeTab === "targets") {
      await dispatch(
        updateInstanceTargets({
          instanceId: detail.id,
          payload: { add_user_ids: [], remove_user_ids: userIdsToRemove },
        }),
      ).unwrap();
    } else {
      await dispatch(
        updateInstanceEvaluators({
          instanceId: detail.id,
          payload: { add_user_ids: [], remove_user_ids: userIdsToRemove },
        }),
      ).unwrap();
    }
    setSelectedIds(new Set());
  };

  /** Toggle select all / deselect all */
  const handleToggleAll = () => {
    if (allVisibleSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(removableMembers.map((m) => m.user_id)));
    }
  };

  const handleToggleOne = (userId: number) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(userId)) {
        next.delete(userId);
      } else {
        next.add(userId);
      }
      return next;
    });
  };

  const handleToggleAuditLog = () => {
    const next = !showAuditLog;
    setShowAuditLog(next);
    if (next && detail && auditLogs.length === 0) {
      dispatch(fetchInstanceAuditLogs({ instanceId: detail.id }));
    }
  };

  const handleEvaluatorSetting = async (
    member: (typeof currentMembers)[number],
    changes: Partial<Pick<typeof member, "can_score" | "requires_signature">>,
  ) => {
    if (!detail || activeTab !== "evaluators") return;
    await dispatch(
      updateInstanceEvaluators({
        instanceId: detail.id,
        payload: {
          add_user_ids: [],
          remove_user_ids: [],
          evaluator_settings: [{
            user_id: String(member.user_id),
            can_score: changes.can_score ?? member.can_score,
            requires_signature:
              changes.requires_signature ?? member.requires_signature,
            signature_order: member.signature_order,
            signature_role: member.signature_role || "ผู้ประเมิน",
          }],
        },
      }),
    ).unwrap();
  };

  // API ส่งสถานะจากฐานข้อมูลเป็นตัวพิมพ์ใหญ่ แต่ชนิดข้อมูลฝั่งหน้าเว็บใช้ตัวพิมพ์เล็ก
  const isDraft = detail?.status.toUpperCase() === "DRAFT";
  const isClosed = detail?.status.toUpperCase() === "CLOSED";

  // ── Render ─────────────────────────────────────────────

  if (loading) {
    return (
      <div className="py-20 text-center text-sm text-gray-400">
        กำลังโหลดข้อมูล...
      </div>
    );
  }

  if (error) {
    return (
      <div className="py-20 text-center text-sm text-red-500">
        เกิดข้อผิดพลาด: {error}
      </div>
    );
  }

  if (!detail) {
    return (
      <div className="py-20 text-center text-sm text-gray-400">
        ไม่พบข้อมูลการประเมิน
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      {/* Back link */}
      <Link
        to={`/evaluation/my-created/${detail.id}`}
        className="inline-flex items-center gap-1.5 text-sm font-medium text-gray-500 transition-colors hover:text-gray-900"
      >
        <ArrowLeft className="h-4 w-4" />
        กลับไปหน้าสรุปการประเมิน
      </Link>

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          แก้ไขผู้เกี่ยวข้อง
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          {detail.template_name}
          {detail.instance_name ? ` — ${detail.instance_name}` : ""}
          {" · "}ปีการศึกษา {detail.academic_year} · รอบ {detail.round}
        </p>
      </div>

      {/* Warning if not draft */}
      {!isDraft && !isClosed && (
        <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
          <AlertTriangle className="h-5 w-5 shrink-0 text-amber-500 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-amber-800">
              แก้ไขหน้าที่ผู้ประเมินได้
            </p>
            <p className="text-xs text-amber-600 mt-0.5">
              สามารถเปิดหรือปิดสิทธิ์ลงคะแนนและการลงชื่อได้จนกว่าจะปิดรอบ
            </p>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 rounded-xl border border-gray-200 bg-gray-50 p-1">
        <button
          type="button"
          onClick={() => setActiveTab("targets")}
          className="flex flex-1 items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition-colors"
          style={
            activeTab === "targets"
              ? {
                  backgroundColor: "#fff",
                  color: ACCENT,
                  boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
                }
              : { color: "#6b7280" }
          }
        >
          <Users className="h-4 w-4" />
          ผู้ถูกประเมิน ({detail.targets.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("evaluators")}
          className="flex flex-1 items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition-colors"
          style={
            activeTab === "evaluators"
              ? {
                  backgroundColor: "#fff",
                  color: ACCENT,
                  boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
                }
              : { color: "#6b7280" }
          }
        >
          <UserCheck className="h-4 w-4" />
          ผู้ประเมิน ({detail.evaluators.length})
        </button>
      </div>

      {/* Save error */}
      {saveError && (
        <div className="bg-rose-50 border border-rose-100 text-rose-600 text-sm rounded-lg px-4 py-3">
          {saveError}
        </div>
      )}

      {/* Content */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 space-y-5">
        {/* ── ส่วนเพิ่มรายชื่อ (เฉพาะ DRAFT) ── */}
        {isDraft && (
          <>
            {/* Group selector — เพิ่มทั้งกลุ่ม */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                {activeTab === "targets"
                  ? "เพิ่มผู้ถูกประเมิน"
                  : "เพิ่มผู้ประเมิน"}
              </label>
              <select
                value=""
                disabled={saving || usersLoading}
                onChange={(e) => {
                  const val = e.target.value;
                  if (val) handleAddGroup(val);
                  e.target.value = "";
                }}
                className={`${selectClass} disabled:opacity-50 disabled:cursor-not-allowed`}
                style={{ ["--tw-ring-color" as string]: `${ACCENT}33` }}
              >
                <option value="">
                  {usersLoading
                    ? "กำลังโหลดรายชื่อ..."
                    : `เพิ่มทั้งกลุ่ม...`}
                </option>
                {currentGroups.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.label} ({g.members.length} คน)
                  </option>
                ))}
              </select>
            </div>

            {/* Search — เพิ่มรายบุคคล */}
            <div className="relative" ref={searchWrapRef}>
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-300" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setShowSuggestions(true);
                }}
                onFocus={() => setShowSuggestions(true)}
                placeholder="ค้นหาชื่อเพื่อเพิ่มรายบุคคล..."
                disabled={saving}
                className="w-full h-11 pl-10 pr-3 text-sm border border-gray-200 rounded-lg outline-none focus:ring-2 focus:border-gray-300 transition-colors bg-white hover:border-gray-300 disabled:opacity-50"
              />
              {showSuggestions && searchTerm.trim() !== "" && (
                <div className="absolute z-10 mt-1 w-full max-h-60 overflow-y-auto bg-white border border-gray-200 rounded-lg shadow-lg">
                  {filteredAvailable.length > 0 ? (
                    filteredAvailable.map((m) => (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => handleAddOne(m.id)}
                        disabled={saving}
                        className="w-full flex items-center justify-between text-left px-3 py-2.5 text-sm text-gray-700 hover:bg-slate-50 transition-colors disabled:opacity-50"
                      >
                        <span className="truncate">{m.name}</span>
                        <span
                          className="text-xs font-medium shrink-0 ml-2"
                          style={{ color: ACCENT }}
                        >
                          + เพิ่ม
                        </span>
                      </button>
                    ))
                  ) : (
                    <p className="px-3 py-2.5 text-xs text-gray-400">
                      ไม่พบรายชื่อที่ตรงกับ "{searchTerm}"
                    </p>
                  )}
                </div>
              )}
            </div>
          </>
        )}

        {/* ── รายชื่อปัจจุบัน ── */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs text-gray-400">
              รายชื่อปัจจุบัน ({currentMembers.length} คน)
            </p>

            {isDraft && currentMembers.length > 0 && (
              <div className="flex items-center gap-2">
                {/* Bulk remove button */}
                {selectedIds.size > 0 && (
                  <button
                    type="button"
                    onClick={handleBulkRemove}
                    disabled={saving}
                    className="flex items-center gap-1.5 rounded-lg bg-red-50 border border-red-200 px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-100 transition-colors disabled:opacity-50"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    ลบ {selectedIds.size} รายการ
                  </button>
                )}
              </div>
            )}
          </div>

          {currentMembers.length === 0 ? (
            <div className="py-10 text-center text-sm text-gray-400">
              ยังไม่มี
              {activeTab === "targets" ? "ผู้ถูกประเมิน" : "ผู้ประเมิน"}
            </div>
          ) : (
            <div className="divide-y divide-gray-100 rounded-lg border border-gray-100">
              {/* Header row with select-all checkbox */}
              {isDraft && removableMembers.length > 0 && (
                <div className="flex items-center gap-3 px-4 py-2 bg-gray-50/80">
                  <button
                    type="button"
                    onClick={handleToggleAll}
                    className="flex items-center gap-2 text-xs font-medium text-gray-500 hover:text-gray-700 transition-colors"
                  >
                    {allVisibleSelected ? (
                      <CheckSquare className="h-4 w-4" style={{ color: ACCENT }} />
                    ) : someSelected ? (
                      <MinusSquare className="h-4 w-4" style={{ color: ACCENT }} />
                    ) : (
                      <Square className="h-4 w-4 text-gray-300" />
                    )}
                    {allVisibleSelected
                      ? "ยกเลิกทั้งหมด"
                      : `เลือกทั้งหมด (${removableMembers.length})`}
                  </button>
                </div>
              )}

              {currentMembers.map((member) => {
                const isSelected = selectedIds.has(member.user_id);
                const canRemove = isDraft && !member.has_submitted;

                return (
                  <div
                    key={member.user_id}
                    className={`flex items-center justify-between gap-3 px-4 py-3 transition-colors ${
                      isSelected ? "bg-primary/5" : "hover:bg-gray-50/60"
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      {/* Checkbox */}
                      {isDraft && removableMembers.length > 0 && (
                        <button
                          type="button"
                          onClick={() =>
                            canRemove && handleToggleOne(member.user_id)
                          }
                          disabled={!canRemove}
                          className="shrink-0 disabled:cursor-not-allowed"
                        >
                          {isSelected ? (
                            <CheckSquare
                              className="h-4.5 w-4.5"
                              style={{ color: ACCENT }}
                            />
                          ) : (
                            <Square
                              className={`h-4.5 w-4.5 ${
                                canRemove
                                  ? "text-gray-300 hover:text-gray-400"
                                  : "text-gray-200"
                              }`}
                            />
                          )}
                        </button>
                      )}

                      <div className="min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {member.name}
                        </p>
                        <p className="text-xs text-gray-400 truncate">
                          {member.position || "—"}
                          {member.assignment_count > 0 && (
                            <span className="ml-2">
                              · มอบหมาย {member.assignment_count} ครั้ง
                              {member.completed_count > 0 &&
                                ` (${member.completed_count} ส่งแล้ว)`}
                            </span>
                          )}
                        </p>
                      </div>
                    </div>

                    <div className="flex shrink-0 items-center gap-2">
                      {activeTab === "evaluators" && (
                        <div className="mr-2 flex items-center gap-3 text-xs text-gray-600">
                          <label className="flex items-center gap-1.5">
                            <input
                              type="checkbox"
                              checked={member.can_score}
                              disabled={saving || isClosed || member.has_submitted}
                              onChange={(event) =>
                                handleEvaluatorSetting(member, { can_score: event.target.checked })
                              }
                            />
                            ลงคะแนน
                          </label>
                          <label className="flex items-center gap-1.5">
                            <input
                              type="checkbox"
                              checked={member.requires_signature}
                              disabled={saving || isClosed}
                              onChange={(event) =>
                                handleEvaluatorSetting(member, { requires_signature: event.target.checked })
                              }
                            />
                            ลงชื่อ
                          </label>
                        </div>
                      )}
                      {member.has_submitted && (
                        <span className="text-[11px] text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">
                          มีผลประเมินแล้ว
                        </span>
                      )}
                      {isDraft && (
                        <button
                          type="button"
                          onClick={() => handleRemoveOne(member.user_id)}
                          disabled={saving || member.has_submitted}
                          className="flex items-center justify-center w-8 h-8 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                          title={
                            member.has_submitted
                              ? "ลบไม่ได้ — มีผลประเมินแล้ว"
                              : "ลบ"
                          }
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* ── Audit Log Panel ── */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <button
          type="button"
          onClick={handleToggleAuditLog}
          className="flex w-full items-center justify-between px-5 py-4 text-left hover:bg-gray-50/60 transition-colors"
        >
          <div className="flex items-center gap-2">
            <History className="h-4 w-4 text-gray-400" />
            <span className="text-sm font-semibold text-gray-800">
              ประวัติการแก้ไข
            </span>
            {auditLogs.length > 0 && (
              <span className="text-xs text-gray-400">
                ({auditLogs.length} รายการ)
              </span>
            )}
          </div>
          <span className="text-xs text-gray-400">
            {showAuditLog ? "ซ่อน" : "แสดง"}
          </span>
        </button>

        {showAuditLog && (
          <div className="border-t border-gray-100">
            {auditLoading ? (
              <div className="px-5 py-6 text-center text-xs text-gray-400">
                กำลังโหลดประวัติ...
              </div>
            ) : auditLogs.length === 0 ? (
              <div className="px-5 py-6 text-center text-xs text-gray-400">
                ยังไม่มีประวัติการแก้ไข
              </div>
            ) : (
              <div className="divide-y divide-gray-50">
                {auditLogs.map((log) => {
                  const isAdd = log.action.includes("add");
                  const isTarget = log.action.includes("target");
                  const actionLabel = isAdd
                    ? isTarget
                      ? "เพิ่มผู้ถูกประเมิน"
                      : "เพิ่มผู้ประเมิน"
                    : isTarget
                      ? "ลบผู้ถูกประเมิน"
                      : "ลบผู้ประเมิน";

                  return (
                    <div
                      key={log.id}
                      className="flex items-start gap-3 px-5 py-3"
                    >
                      <div
                        className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full"
                        style={
                          isAdd
                            ? {
                                backgroundColor: "#ecfdf5",
                                color: "#059669",
                              }
                            : {
                                backgroundColor: "#fef2f2",
                                color: "#dc2626",
                              }
                        }
                      >
                        {isAdd ? (
                          <UserPlus className="h-3.5 w-3.5" />
                        ) : (
                          <UserMinus className="h-3.5 w-3.5" />
                        )}
                      </div>

                      <div className="min-w-0 flex-1">
                        <p className="text-sm text-gray-700">
                          <span className="font-medium">
                            {log.actor_name}
                          </span>
                          <span className="mx-1 text-gray-400">•</span>
                          <span
                            className={
                              isAdd ? "text-emerald-600" : "text-red-500"
                            }
                          >
                            {actionLabel}
                          </span>
                          <span className="mx-1 text-gray-400">•</span>
                          <span className="font-medium text-gray-900">
                            {log.target_name}
                          </span>
                        </p>
                        <p className="mt-0.5 text-[11px] text-gray-400">
                          {new Date(log.created_at).toLocaleString("th-TH", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Bottom nav */}
      {isDraft && (
        <div className="flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={() => navigate(`/evaluation/my-created/${detail.id}`)}
            className="h-11 px-5 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100 transition-colors"
          >
            เสร็จสิ้น
          </button>
        </div>
      )}
    </div>
  );
}

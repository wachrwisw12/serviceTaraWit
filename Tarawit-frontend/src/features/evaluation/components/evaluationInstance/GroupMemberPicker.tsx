import { useEffect, useMemo, useRef, useState } from "react";
import type { Member, MemberGroup } from "../../types/template_type";
import { FieldLabel } from "./FieldLabel";
import { ICONS, SvgIcon } from "@/design-system/icons";
import { evaluationColor } from "@/design-system/colors";

const ACCENT = evaluationColor.main;
const ACCENT_SOFT = evaluationColor.soft;
const ACCENT_DARK = evaluationColor.main;
const selectClass =
  "w-full h-11 px-3 border border-gray-200 rounded-lg text-sm text-gray-800 outline-none focus:ring-2 focus:border-gray-300 transition-colors bg-white hover:border-gray-300";

export function GroupMemberPicker({
  label,
  groups,
  searchMembers = [],
  selectedMembers,
  onChange,
  placeholder,
  loading,
  error,
}: {
  label: string;
  groups: MemberGroup[];
  searchMembers?: Member[];
  selectedMembers: Member[];
  onChange: (members: Member[]) => void;
  placeholder: string;
  loading?: boolean;
  error?: string | null;
}) {
  const handleAddGroup = (groupId: string) => {
    const group = groups.find((g) => g.id === groupId);
    if (!group) return;

    const existingIds = new Set(selectedMembers.map((m) => m.id));
    const merged = [
      ...selectedMembers,
      ...group.members.filter((m) => !existingIds.has(m.id)),
    ];
    onChange(merged);
  };

  const handleRemove = (memberId: string) => {
    onChange(selectedMembers.filter((m) => m.id !== memberId));
  };

  const handleClearAll = () => onChange([]);

  const allMembers = useMemo(() => {
    const map = new Map<string, Member>();
    searchMembers.forEach((m) => map.set(m.id, m));
    return Array.from(map.values());
  }, [searchMembers]);

  const selectedIds = useMemo(
    () => new Set(selectedMembers.map((m) => m.id)),
    [selectedMembers],
  );

  const [searchTerm, setSearchTerm] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const searchWrapRef = useRef<HTMLDivElement | null>(null);

  const searchResults = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) return [];
    return allMembers
      .filter(
        (m) => !selectedIds.has(m.id) && m.name.toLowerCase().includes(term),
      )
      .slice(0, 8);
  }, [searchTerm, allMembers, selectedIds]);

  const handleAddMember = (member: Member) => {
    onChange([...selectedMembers, member]);
    setSearchTerm("");
    setShowSuggestions(false);
  };

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        searchWrapRef.current &&
        !searchWrapRef.current.contains(e.target as Node)
      ) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const [filter, setFilter] = useState("");
  const showFilter = selectedMembers.length > 8;
  const visibleMembers = showFilter
    ? selectedMembers.filter((m) =>
        m.name.toLowerCase().includes(filter.trim().toLowerCase()),
      )
    : selectedMembers;

  return (
    <div className="rounded-xl border border-gray-100 bg-gray-50/60 p-4">
      <div className="flex items-center justify-between mb-1.5">
        <FieldLabel required>{label}</FieldLabel>
        {selectedMembers.length > 0 && (
          <span
            className="text-xs font-medium px-2 py-0.5 rounded-full shrink-0"
            style={{ backgroundColor: ACCENT_SOFT, color: ACCENT_DARK }}
          >
            {selectedMembers.length} คน
          </span>
        )}
      </div>

      {loading && (
        <p className="text-xs text-gray-400 mb-1.5">กำลังโหลดรายชื่อ...</p>
      )}
      {!loading && error && (
        <p className="text-xs text-rose-500 mb-1.5">{error}</p>
      )}

      <select
        value=""
        disabled={loading}
        onChange={(e) => {
          const value = e.target.value;
          if (value) handleAddGroup(value);
          e.target.value = "";
        }}
        className={`${selectClass} disabled:opacity-50 disabled:cursor-not-allowed`}
        style={{ ["--tw-ring-color" as string]: `${ACCENT}33` }}
      >
        <option value="">{loading ? "กำลังโหลด..." : placeholder}</option>
        {groups.map((g) => (
          <option key={g.id} value={g.id}>
            {g.label} ({g.members.length} คน)
          </option>
        ))}
      </select>

      <div className="relative mt-2" ref={searchWrapRef}>
        <SvgIcon
          icon={ICONS.search}
          className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-300"
        />
        <input
          type="text"
          value={searchTerm}
          disabled={loading}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            setShowSuggestions(true);
          }}
          onFocus={() => setShowSuggestions(true)}
          placeholder="ค้นหาเพื่อเพิ่มรายชื่อเป็นรายบุคคล..."
          className="w-full h-10 pl-8 pr-3 text-sm border border-gray-200 rounded-lg outline-none focus:ring-2 focus:border-gray-300 transition-colors bg-white hover:border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
          style={{ ["--tw-ring-color" as string]: `${ACCENT}33` }}
        />

        {showSuggestions && searchTerm.trim() !== "" && (
          <div className="absolute z-10 mt-1 w-full max-h-56 overflow-y-auto bg-white border border-gray-200 rounded-lg shadow-lg">
            {searchResults.length > 0 ? (
              searchResults.map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => handleAddMember(m)}
                  className="w-full flex items-center justify-between text-left px-3 py-2 text-sm text-gray-700 hover:bg-slate-50 transition-colors"
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

      {selectedMembers.length > 0 ? (
        <div className="mt-2.5">
          <div className="flex items-center justify-between mb-1.5">
            <p className="text-xs text-gray-400">
              รวม {selectedMembers.length} รายชื่อ
            </p>
            <button
              type="button"
              onClick={handleClearAll}
              className="text-xs text-gray-400 hover:text-rose-500 transition-colors"
            >
              ล้างทั้งหมด
            </button>
          </div>

          {showFilter && (
            <div className="relative mb-2">
              <SvgIcon
                icon={ICONS.search}
                className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-300"
              />
              <input
                type="text"
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                placeholder="ค้นหารายชื่อที่เลือกไว้..."
                className="w-full h-8 pl-8 pr-2.5 text-xs border border-gray-200 rounded-md outline-none focus:ring-2 focus:border-gray-300 transition-colors bg-white"
                style={{ ["--tw-ring-color" as string]: `${ACCENT}33` }}
              />
            </div>
          )}

          <div className="flex flex-wrap gap-1.5 max-h-40 overflow-y-auto rounded-lg border border-gray-100 bg-white p-2.5">
            {visibleMembers.length > 0 ? (
              visibleMembers.map((m) => (
                <span
                  key={m.id}
                  className="inline-flex items-center gap-1.5 bg-white border border-gray-200 rounded-full pl-3 pr-1.5 py-1 text-xs text-gray-700 max-w-full"
                >
                  <span className="truncate">{m.name}</span>
                  <button
                    type="button"
                    onClick={() => handleRemove(m.id)}
                    className="flex items-center justify-center w-4 h-4 rounded-full text-gray-400 hover:text-rose-500 hover:bg-rose-50 transition-colors shrink-0"
                    aria-label={`ลบ ${m.name}`}
                  >
                    <SvgIcon icon={ICONS.x} className="w-3 h-3" />
                  </button>
                </span>
              ))
            ) : (
              <p className="text-xs text-gray-400 py-1">
                ไม่พบรายชื่อที่ตรงกับ "{filter}"
              </p>
            )}
          </div>
        </div>
      ) : (
        <p className="text-xs text-gray-400 mt-1.5">
          ยังไม่ได้เลือกกลุ่ม — เลือกกลุ่มด้านบนเพื่อดึงรายชื่อมาแสดง
        </p>
      )}
    </div>
  );
}

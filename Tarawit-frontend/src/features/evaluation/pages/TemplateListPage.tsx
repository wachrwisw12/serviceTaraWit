import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import TemplateTable from "../components/templates/TemplateTable";
import TemplateFilterBar from "../components/templates/TemplateFilter";
import { useAppDispatch, useAppSelector } from "../../../store/hooks";
import useSnackbar from "../../../components/snackbar/useSnackbar";
import {
  fetchTemplates,
  duplicateTemplate,
  updateTemplateStatus,
} from "../api/templateSlice";
import type { TemplateApiResponse } from "../types/template_type";

export default function TemplateListPage() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const snackbar = useSnackbar();
  const { templates, loading, error } = useAppSelector(
    (state) => state.template,
  );

  useEffect(() => {
    dispatch(fetchTemplates());
  }, [dispatch]);

  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");

  const filteredItems = useMemo<typeof templates>(() => {
    return templates
      .map((item) => ({
        ...item,
      }))
      .filter((item) => {
        const matchSearch =
          search.trim() === "" ||
          item.template_name.toLowerCase().includes(search.toLowerCase()) ||
          item.code.toLowerCase().includes(search.toLowerCase());

        const matchType =
          typeFilter === "ALL" || item.evaluation_target_id === typeFilter;

        const matchStatus =
          statusFilter === "ALL" || item.status === statusFilter;

        return matchSearch && matchType && matchStatus;
      });
  }, [templates, search, typeFilter, statusFilter]);

  async function handleDuplicate(item: TemplateApiResponse) {
    const res = await dispatch(duplicateTemplate(item.id));
    if (duplicateTemplate.fulfilled.match(res)) {
      snackbar.showSnackbar("คัดลอกแม่แบบสำเร็จ", "success");
      dispatch(fetchTemplates());
    } else {
      snackbar.showSnackbar(
        (res as { payload?: string }).payload ?? "คัดลอกไม่สำเร็จ",
        "error",
      );
    }
  }

  async function handleActivate(item: TemplateApiResponse) {
    const newStatus = item.status === "ACTIVE" ? "INACTIVE" : "ACTIVE";
    const res = await dispatch(
      updateTemplateStatus({ id: item.id, status: newStatus }),
    );
    if (updateTemplateStatus.fulfilled.match(res)) {
      snackbar.showSnackbar(
        newStatus === "ACTIVE" ? "เปิดใช้งานแม่แบบแล้ว" : "ปิดใช้งานแม่แบบแล้ว",
        "success",
      );
    } else {
      snackbar.showSnackbar(
        (res as { payload?: string }).payload ?? "เปลี่ยนสถานะไม่สำเร็จ",
        "error",
      );
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">แม่แบบการนิเทศ</h1>
        <p className="text-sm text-gray-500 mt-1">
          จัดการแม่แบบสำหรับใช้สร้างการนิเทศ
        </p>
      </div>

      <TemplateFilterBar
        typeValue={typeFilter}
        onTypeChange={setTypeFilter}
        statusValue={statusFilter}
        onStatusChange={setStatusFilter}
        searchValue={search}
        onSearchChange={setSearch}
        onCreate={() => navigate("/evaluation/templates/create")}
      />

      <TemplateTable
        items={filteredItems}
        loading={loading}
        errors={error ?? ""}
        onView={(item) => navigate(`/evaluation/templates/${item.id}`)}
        onEdit={(item) =>
          navigate(`/evaluation/templates/${item.id}/edit`)
        }
        onDuplicate={handleDuplicate}
        onActivate={handleActivate}
      />
    </div>
  );
}

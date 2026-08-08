import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import TemplateTable from "../components/templates/TemplateTable";
import TemplateFilterBar from "../components/templates/TemplateFilter";
import { useAppDispatch, useAppSelector } from "../../../store/hooks";
import { fetchTemplates } from "../api/templateSlice";

export default function TemplateListPage() {
  const dispatch = useAppDispatch();
  const { templates, loading, error } = useAppSelector(
    (state) => state.template,
  );
  useEffect(() => {
    dispatch(fetchTemplates());
  }, [dispatch]);
  const navigate = useNavigate();

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
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">แม่แบบการประเมิน</h1>
        <p className="text-sm text-gray-500 mt-1">
          จัดการแม่แบบสำหรับใช้สร้างการประเมิน
        </p>
      </div>

      <TemplateFilterBar
        typeValue={typeFilter}
        onTypeChange={setTypeFilter}
        statusValue={statusFilter}
        onStatusChange={setStatusFilter}
        searchValue={search}
        onSearchChange={setSearch}
        onCreate={function (): void {
          throw new Error("Function not implemented.");
        }}
      />

      <TemplateTable
        items={filteredItems}
        loading={loading}
        errors={error ?? ""}
        onView={(item) => navigate(`/evaluation/templates/${item.id}`)}
        onEdit={(item) => navigate(`/templates/${item.id}/edit`)}
        onDuplicate={(item) => console.log("duplicate", item.id)}
        onActivate={(item) => console.log("activate", item.id)}
      />
    </div>
  );
}

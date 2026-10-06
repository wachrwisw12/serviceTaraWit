import { useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";

import { useAppDispatch, useAppSelector } from "../../../store/hooks";
import useSnackbar from "../../../components/snackbar/useSnackbar";
import { clearEvaluatorDetail } from "../api/EvaluatorSlice";
import ScoringDrawer from "../components/evaluators/Scoringdraweb";

/**
 * หน้าให้คะแนนแบบ standalone (เปิดจากปุ่ม "ไปให้คะแนน" ใน /my/evaluation)
 *
 * ใช้ ScoringDrawer เดิมซึ่งเป็นฟอร์มเต็มจออยู่แล้ว —
 * เปิดค้างไว้ตลอด และปุ่มปิด/ยกเลิกจะพากลับไปหน้าก่อนหน้า
 */
export default function ScoreAssignmentPage() {
  const { assignmentId } = useParams<{ assignmentId: string }>();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { showSnackbar } = useSnackbar();
  const { detail } = useAppSelector((state) => state.evaluator);

  const id = assignmentId ? Number(assignmentId) : NaN;

  useEffect(() => {
    return () => {
      dispatch(clearEvaluatorDetail());
    };
  }, [dispatch]);

  if (Number.isNaN(id) || id <= 0) {
    return (
      <div className="flex min-h-screen items-center justify-center text-sm text-gray-400">
        หมายเลขรายการไม่ถูกต้อง
      </div>
    );
  }

  /*
   * กลับไปหน้า /my/evaluation (แทนที่ entry ของหน้าคะแนนเดิม)
   * เพื่อให้หน้าดังกล่าว mount ใหม่และโหลดข้อมูลความคืบหน้าล่าสุดอัตโนมัติ
   */
  const goBackToList = () => navigate("/my/evaluation", { replace: true });

  /*
   * คิวก่อนหน้า/ถัดไป: ใช้รายชื่อผู้ถูกประเมินทั้งหมดจาก detail (siblings)
   * เพื่อไล่ให้คะแนนคนถัดไปในรายการเดียวกันโดยไม่ต้องกลับไปเลือกชื่อใหม่
   *
   * ในหน้า DRAFT (ตัวอย่าง) คิวจะข้ามเฉพาะรายชื่อที่ยังไม่ให้คะแนน
   * — กันไม่ให้วนไปเจอคนที่ถูกทำเครื่องหมาย submitted แล้ว
   */
  const siblings = detail?.siblings ?? [];

  const queueList =
    detail?.status === "DRAFT"
      ? siblings.filter((s) => s.status !== "submitted")
      : siblings;

  const currentIndex = queueList.findIndex((s) => s.assignment_id === id);
  const inQueue = queueList.length > 0 && currentIndex >= 0;

  const goTo = (assignmentId: number) =>
    navigate(`/evaluation/score/${assignmentId}`, { replace: true });

  /*
   * บันทึกคะแนนสำเร็จ → แจ้งเตือน (snackbar) แล้วกลับหน้า /my/evaluation
   * provider ของ snackbar อยู่เหนือ router จึงแสดงค้างไว้บนหน้าใหม่ได้
   */
  const handleSubmitted = () => {
    const targetName = detail?.target.name;

    showSnackbar(
      targetName
        ? `บันทึกคะแนนของ ${targetName} เรียบร้อยแล้ว`
        : "บันทึกคะแนนเรียบร้อยแล้ว",
      "success",
    );

    goBackToList();
  };

  return (
    <ScoringDrawer
      open
      onClose={goBackToList}
      onSubmitted={handleSubmitted}
      assignmentsId={id}
      targetUserId={0}
      targetName=""
      instance={null}
      onPrev={
        inQueue && currentIndex > 0
          ? () => goTo(queueList[currentIndex - 1].assignment_id)
          : undefined
      }
      onNext={
        inQueue && currentIndex < queueList.length - 1
          ? () => goTo(queueList[currentIndex + 1].assignment_id)
          : undefined
      }
      queueIndex={inQueue ? currentIndex : undefined}
      queueTotal={inQueue ? queueList.length : undefined}
    />
  );
}

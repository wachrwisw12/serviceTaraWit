import EvaluationForm from "../components/evaluationInstance/CreateInstanceForm";

export default function CreateEvaluationPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">สร้างการประเมิน</h1>
        <p className="text-sm text-gray-500 mt-1">
          เปิดรอบการประเมินใหม่โดยอ้างอิงแม่แบบที่มีอยู่
        </p>
      </div>

      <EvaluationForm />
    </div>
  );
}

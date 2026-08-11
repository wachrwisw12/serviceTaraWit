import type { MenuItem } from "../types/menu";

export const pages: MenuItem[] = [
  // หน้าแรก — ทุกคนที่ login แล้วเห็นเสมอ ไม่ผูก permission
  {
    id: "home",
    label: "หน้าแรก",
    path: "/",
  },

  // Dashboard
  {
    id: "dashboard",
    label: "Dashboard",
    path: "/dashboard",
    permission: "dashboard.view",
  },

  // บุคลากร
  {
    id: "personnel",
    label: "บุคลากร",
    path: "#",
    permission: "personnel.view",

    children: [
      {
        id: "personnel-list",
        label: "รายชื่อบุคลากร",
        path: "/personnel",
        permission: "personnel.view",
      },
      {
        id: "personnel-create",
        label: "เพิ่มบุคลากร",
        path: "/personnel/create",
        permission: "personnel.create",
      },
      {
        id: "position",
        label: "ตำแหน่ง/วิทยฐานะ",
        path: "/positions",
        permission: "position.view",
      },
    ],
  },

  // การประเมิน
  {
    id: "evaluation",
    label: "แฟ้มการประเมิน",
    path: "#",
    permission: "evaluation.view",

    children: [
      {
        id: "myinstance",
        label: "รายการรับประเมินของฉัน",
        path: "/my/evaluation",
        permission: "instance.view",
      },
      {
        id: "evaluation-instancelist",
        label: "สร้างแบบการประเมิน",
        path: "evaluation/instance/create",
        permission: "instance.create",
      },

      {
        id: "evaluation-round",
        label: "รอบการประเมิน",
        path: "/evaluation/rounds",
        permission: "evaluation.round.view",
      },
      {
        id: "evaluation-submit",
        label: "ส่งแบบประเมิน",
        path: "/evaluation/submit",
        permission: "evaluation.submit",
      },
      // {
      //   id: "evaluation-approve",
      //   label: "อนุมัติผล",
      //   path: "/evaluation/approve",
      //   permission: "evaluation.approve",
      // },
    ],
  },

  // ผลการประเมิน
  {
    id: "result",
    label: "ผลการประเมิน",
    path: "#",
    permission: "result.view",

    children: [
      {
        id: "result-person",
        label: "คะแนนรายบุคคล",
        path: "/results/person",
        permission: "result.person.view",
      },
      {
        id: "result-summary",
        label: "สรุปผลการประเมิน",
        path: "/results/summary",
        permission: "result.summary.view",
      },
      {
        id: "result-history",
        label: "ประวัติการประเมิน",
        path: "/results/history",
        permission: "result.history.view",
      },
    ],
  },

  // รายงาน
  // {
  //   id: "report",
  //   label: "รายงาน",
  //   path: "#",
  //   permission: "report.view",

  //   children: [
  //     {
  //       id: "report-evaluation",
  //       label: "รายงานผลการประเมิน",
  //       path: "/report/evaluation",
  //       permission: "report.evaluation.view",
  //     },
  //     {
  //       id: "report-personnel",
  //       label: "รายงานบุคลากร",
  //       path: "/report/personnel",
  //       permission: "report.personnel.view",
  //     },
  //     {
  //       id: "report-export",
  //       label: "ส่งออก Excel",
  //       path: "/report/export",
  //       permission: "report.export",
  //     },
  //   ],
  // },

  // ผู้ใช้งานระบบ
  {
    id: "user-management",
    label: "จัดการผู้ใช้งาน",
    path: "#",
    permission: "user.view",

    children: [
      {
        id: "user",
        label: "ผู้ใช้งาน",
        path: "/user/manage",
        permission: "user.view",
      },
      {
        id: "role",
        label: "Role",
        path: "/roles",
        permission: "role.view",
      },
      {
        id: "permission",
        label: "Permission",
        path: "/permissions",
        permission: "permission.view",
      },
    ],
  },

  // ตั้งค่าระบบ
  {
    id: "setting",
    label: "ตั้งค่าระบบ",
    path: "#",
    permission: "setting.manage",

    children: [
      {
        id: "setting-school",
        label: "ข้อมูลโรงเรียน",
        path: "/settings/school",
        permission: "setting.school",
      },
      {
        id: "setting-academic-year",
        label: "ปีการศึกษา",
        path: "/settings/academic-year",
        permission: "setting.academic",
      },
      {
        id: "setting-scoring",
        label: "ตั้งค่าคะแนน",
        path: "/settings/scoring",
        permission: "setting.scoring",
      },
    ],
  },
];

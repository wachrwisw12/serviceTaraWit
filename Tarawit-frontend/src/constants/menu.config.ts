import HomeIcon from "@mui/icons-material/Home";
import AssignmentIcon from "@mui/icons-material/Assignment";
import GroupIcon from "@mui/icons-material/Group";
import BadgeIcon from "@mui/icons-material/Badge";
import SettingsIcon from "@mui/icons-material/Settings";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import BarChartIcon from "@mui/icons-material/BarChart";
import VerifiedIcon from "@mui/icons-material/Verified";

import { Permission } from "../store/hooks/permission";
import type { MenuItem } from "../types/menu";

export const pages: MenuItem[] = [
  // ===== โมดูล: หน้าหลัก =====
  // ทุกคนที่ login แล้วเห็นเสมอ ไม่ผูก permission
  {
    id: "home",
    label: "หน้าหลัก",
    path: "/dashboard",
    icon: HomeIcon,
  },

  // ===== โมดูล: ลงเวลาปฏิบัติงาน =====
  {
    id: "attendance",
    label: "การลงเวลา",
    path: "/attendance",
    permission: Permission.ATTENDANCE_VIEW,
    module: "attendance",
    icon: AccessTimeIcon,

    children: [
      {
        id: "attendance-manage",
        label: "สรุปการลงเวลา",
        path: "/attendance/manage",
        permission: Permission.ATTENDANCE_MANAGE,
      },
      {
        id: "attendance-geofence",
        label: "พื้นที่และสิทธิ์ลงเวลา",
        path: "/attendance/geofence",
        permission: Permission.ATTENDANCE_MANAGE,
      },
    ],
  },

  // ===== โมดูล: ระบบประเมินบุคลากร =====
  {
    id: "evaluation",
    label: "ระบบนิเทศ",
    path: "/evaluation",
    permission: Permission.INSTANCE_VIEW,
    module: "evaluation",
    icon: AssignmentIcon,

    children: [
      {
        id: "myinstance",
        label: "งานประเมินของฉัน",
        path: "/my/evaluation",
      },
      // {
      //   id: "evaluation-instancelist",
      //   label: "สร้างการประเมิน",
      //   path: "/evaluation/instance/create",
      //   permission: "instance.create",
      // },
      {
        id: "evaluation-mycreated",
        label: "รายการที่ฉันสร้าง",
        path: "/evaluation/my-created",
        permission: Permission.INSTANCE_CREATE,
      },
      {
        id: "evaluation-template",
        label: "แม่แบบประเมิน",
        path: "/evaluation/templates",
        permission: Permission.TEMPLATE_VIEW,
      },
      {
        id: "evaluation-round",
        label: "รอบการนิเทศ",
        path: "/evaluation/rounds",
        permission: Permission.EVALUATION_ROUND_VIEW,
      },
      {
        id: "evaluation-submit",
        label: "รายการรอส่ง",
        path: "/evaluation/submit",
        permission: Permission.EVALUATION_SUBMIT,
      },
      {
        id: "result-person",
        label: "ผลรายบุคคล",
        path: "/results/person",
        permission: Permission.RESULT_PERSON_VIEW,
      },
      {
        id: "result-summary",
        label: "สรุปผล",
        path: "/results/summary",
        permission: Permission.RESULT_SUMMARY_VIEW,
      },
      {
        id: "result-history",
        label: "ประวัติผลประเมิน",
        path: "/results/history",
        permission: Permission.RESULT_HISTORY_VIEW,
      },
    ],
  },

  // ===== โมดูล: การประกันคุณภาพภายในสถานศึกษา =====
  {
    id: "iqa",
    label: "ประกันคุณภาพ",
    path: "/iqa",
    permission: Permission.INSTANCE_VIEW,
    module: "evaluation",
    icon: VerifiedIcon,

    children: [
      {
        id: "iqa-cycles",
        label: "รอบการประกันคุณภาพ",
        path: "/iqa/cycles",
        permission: Permission.INSTANCE_VIEW,
      },
    ],
  },

  // ===== โมดูล: ระบบจัดการผู้ใช้งาน =====
  {
    id: "user-management",
    label: "ผู้ใช้และสิทธิ์",
    path: "/user",
    permission: Permission.USER_VIEW,
    module: "users",
    icon: GroupIcon,

    children: [
      {
        id: "user",
        label: "บัญชีผู้ใช้",
        path: "/user/manage",
        permission: Permission.USER_VIEW,
      },
      {
        id: "role",
        label: "บทบาท",
        path: "/roles",
        permission: Permission.ROLE_VIEW,
      },
      {
        id: "permission",
        label: "สิทธิ์การใช้งาน",
        path: "/permissions",
        permission: Permission.PERMISSION_VIEW,
      },
    ],
  },

  // ===== โมดูล: ข้อมูลบุคลากร =====
  {
    id: "personnel",
    label: "บุคลากร",
    path: "/personnel",
    permission: Permission.PERSONNEL_VIEW,
    module: "personnel",
    icon: BadgeIcon,

    children: [
      {
        id: "personnel-list",
        label: "รายชื่อบุคลากร",
        path: "/personnel/list",
        permission: Permission.PERSONNEL_VIEW,
      },
      {
        id: "personnel-create",
        label: "เพิ่มบุคลากร",
        path: "/personnel/create",
        permission: Permission.PERSONNEL_CREATE,
      },
      {
        id: "personnel-import",
        label: "นำเข้าบุคลากร",
        path: "/personnel/import",
        permission: Permission.PERSONNEL_CREATE,
      },
      {
        id: "position",
        label: "ตำแหน่งและวิทยฐานะ",
        path: "/positions",
        permission: Permission.POSITION_VIEW,
      },
    ],
  },

  // ===== โมดูล: รายงาน/สถิติ =====
  {
    id: "report",
    label: "รายงาน",
    path: "/reports",
    permission: Permission.REPORT_VIEW,
    module: "reports",
    icon: BarChartIcon,

    children: [
      {
        id: "report-executive",
        label: "ภาพรวมผู้บริหาร",
        path: "/reports",
        permission: Permission.REPORT_VIEW,
      },
    ],
  },

  // ===== โมดูล: ตั้งค่าระบบ =====
  {
    id: "setting",
    label: "ตั้งค่าระบบ",
    path: "/settings",
    permission: Permission.SETTING_MANAGE,
    module: "settings",
    icon: SettingsIcon,

    children: [
      {
        id: "setting-school",
        label: "ข้อมูลโรงเรียน",
        path: "/settings/school",
        permission: Permission.SETTING_SCHOOL,
      },
      {
        id: "setting-academic-year",
        label: "ปีการศึกษา",
        path: "/settings/academic-year",
        permission: Permission.SETTING_ACADEMIC,
      },
      {
        id: "setting-scoring",
        label: "เกณฑ์คะแนน",
        path: "/settings/scoring",
        permission: Permission.SETTING_SCORING,
      },
    ],
  },
];

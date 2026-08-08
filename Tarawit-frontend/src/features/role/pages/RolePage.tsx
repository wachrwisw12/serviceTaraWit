// import { useState } from "react";
// import { Plus, Shield, Users, KeyRound, Edit, Trash2 } from "lucide-react";

// import type { Rol } from "../roleType";

// const mockRoles: Role[] = [
//   {
//     id: 1,
//     name: "ผู้ดูแลระบบ",
//     code: "ADMIN",
//     description: "จัดการระบบทั้งหมด",
//     users: 2,
//     permissions: 25,
//   },
//   {
//     id: 2,
//     name: "ผู้บริหาร",
//     code: "DIRECTOR",
//     description: "ดู Dashboard และอนุมัติ",
//     users: 5,
//     permissions: 12,
//   },
//   {
//     id: 3,
//     name: "ครู",
//     code: "TEACHER",
//     description: "จัดการข้อมูลการเรียน",
//     users: 80,
//     permissions: 10,
//   },
//   {
//     id: 4,
//     name: "นักเรียน",
//     code: "STUDENT",
//     description: "ใช้งานระบบทั่วไป",
//     users: 500,
//     permissions: 3,
//   },
// ];

// export default function RolePage() {
//   const [roles, setRoles] = useState(mockRoles);

//   return (
//     <div className="space-y-6">
//       {/* Header */}

//       <div className="flex justify-between items-center">
//         <div>
//           <h1 className="text-2xl font-bold text-gray-800">Role Management</h1>

//           <p className="text-gray-500">จัดการกลุ่มสิทธิ์ผู้ใช้งาน</p>
//         </div>

//         <button
//           className="
// flex items-center gap-2
// rounded-lg
// bg-blue-600
// px-4 py-2
// text-white
// hover:bg-blue-700
// "
//         >
//           <Plus size={18} />
//           เพิ่ม Role
//         </button>
//       </div>

//       {/* Role Grid */}

//       <div
//         className="
// grid
// grid-cols-1
// md:grid-cols-2
// xl:grid-cols-4
// gap-5
// "
//       >
//         {roles.map((role) => (
//           <div
//             key={role.id}
//             className="
// rounded-xl
// border
// bg-white
// p-5
// shadow-sm
// hover:shadow-md
// transition
// "
//           >
//             <div className="flex justify-between">
//               <div
//                 className="
// rounded-full
// bg-blue-100
// p-3
// text-blue-600
// "
//               >
//                 <Shield size={24} />
//               </div>

//               <div className="flex gap-2">
//                 <button
//                   className="
// text-gray-500
// hover:text-blue-600
// "
//                 >
//                   <Edit size={18} />
//                 </button>

//                 <button
//                   className="
// text-gray-500
// hover:text-red-600
// "
//                 >
//                   <Trash2 size={18} />
//                 </button>
//               </div>
//             </div>

//             <h2
//               className="
// mt-4
// text-lg
// font-semibold
// "
//             >
//               {role.name}
//             </h2>

//             <p
//               className="
// text-sm
// text-gray-500
// "
//             >
//               {role.code}
//             </p>

//             <div
//               className="
// mt-4
// space-y-2
// text-sm
// "
//             >
//               <div className="flex gap-2 items-center">
//                 <Users size={16} />
//                 {role.users} Users
//               </div>

//               <div className="flex gap-2 items-center">
//                 <KeyRound size={16} />
//                 {role.permissions} Permissions
//               </div>
//             </div>

//             <button
//               className="
// mt-5
// w-full
// rounded-lg
// border
// px-3 py-2
// text-sm
// hover:bg-gray-50
// "
//             >
//               จัดการ Permission
//             </button>
//           </div>
//         ))}
//       </div>
//     </div>
//   );
// }

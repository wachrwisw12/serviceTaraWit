const roles = [
  {
    id: 1,
    name: "Admin",
    description: "ผู้ดูแลระบบ",
  },
  {
    id: 2,
    name: "Director",
    description: "ผู้บริหาร",
  },
  {
    id: 3,
    name: "Teacher",
    description: "ครูผู้สอน",
  },
];

export default function RoleTab() {
  return (
    <div className="space-y-3">
      {roles.map((role) => (
        <label
          key={role.id}
          className="
 flex items-center gap-3
 rounded-lg
 border
 p-4
 cursor-pointer
 "
        >
          <input type="radio" name="role" />

          <div>
            <p className="font-medium">{role.name}</p>

            <p className="text-sm text-gray-500">{role.description}</p>
          </div>
        </label>
      ))}
    </div>
  );
}

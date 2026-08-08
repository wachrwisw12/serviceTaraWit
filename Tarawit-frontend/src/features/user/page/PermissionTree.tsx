import { ChevronDown } from "lucide-react";

const modules = [
  {
    name: "Dashboard",
    permissions: ["dashboard.view", "dashboard.export"],
  },

  {
    name: "Evaluation",
    permissions: ["evaluation.view", "evaluation.submit", "evaluation.approve"],
  },
];

export default function PermissionTree() {
  return (
    <div className="space-y-4">
      {modules.map((module) => (
        <div
          key={module.name}
          className="
 border rounded-lg
 "
        >
          <div
            className="
flex items-center gap-2
px-4 py-3
font-medium
"
          >
            <ChevronDown size={18} />

            {module.name}
          </div>

          <div className="px-6 pb-3 space-y-2">
            {module.permissions.map((permission) => (
              <label
                key={permission}
                className="
flex gap-2 items-center
text-sm
"
              >
                <input type="checkbox" />

                {permission}
              </label>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

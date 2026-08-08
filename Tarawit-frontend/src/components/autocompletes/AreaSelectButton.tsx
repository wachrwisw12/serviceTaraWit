import { useState } from "react";
import { Button, Typography, Stack } from "@mui/material";
import AreaSearchDialog from "./AreaSearchDialog";
import type { Area } from "../../types/village";

type Props = {
  value: Area | null;
  onChange: (area: Area) => void;
};

export default function AreaSelectButton({ value, onChange }: Props) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button variant="outlined" onClick={() => setOpen(true)}>
        {value ? "เปลี่ยนพื้นที่" : "เลือกพื้นที่"}
      </Button>

      {value && (
        <Stack>
          <Typography variant="body2">
            ตำบล{value.sub_districts_name} / {value.district} / {value.province}
          </Typography>
        </Stack>
      )}

      <AreaSearchDialog
        open={open}
        onClose={() => setOpen(false)}
        onSelect={(data) => {
          onChange(data); // ⭐ ส่งค่ากลับขึ้น parent
          setOpen(false);
        }}
      />
    </>
  );
}

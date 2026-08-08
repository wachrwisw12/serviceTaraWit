// AreaSearchDialog.tsx
import {
  Dialog,
  DialogTitle,
  DialogContent,
  TextField,
  List,
  ListItemButton,
  ListItemText,
  CircularProgress,
  Typography,
} from "@mui/material";
import { useEffect, useMemo, useState } from "react";
import debounce from "lodash.debounce";
import type { Area } from "../../types/village";
import api from "../../api/axios";

type Props = {
  open: boolean;
  onClose: () => void;
  onSelect: (data: Area) => void;
};

export default function AreaSearchDialog({ open, onClose, onSelect }: Props) {
  const [keyword, setKeyword] = useState("");
  const [items, setItems] = useState<Area[]>([]);
  const [loading, setLoading] = useState(false);

  // ยิง API
  const searchTambon = async (q: string) => {
    if (!q) {
      setItems([]);
      return;
    }
    if (q.length < 2 || q.length > 20) {
      setItems([]);
      return;
    }
    try {
      setLoading(true);

      const res = await api.get(`/init/search-village?q=${q}`);

      setItems(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // debounce
  const debouncedSearch = useMemo(() => debounce(searchTambon, 800), []);

  // เมื่อพิมพ์
  useEffect(() => {
    debouncedSearch(keyword);

    return () => {
      debouncedSearch.cancel();
    };
  }, [keyword]);

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>ค้นหาตำบล</DialogTitle>

      <DialogContent>
        <TextField
          fullWidth
          placeholder="พิมพ์ชื่อตำบล..."
          value={keyword}
          onChange={(e) => {
            const value = e.target.value.slice(0, 20);
            setKeyword(value);
          }}
          inputProps={{ maxLength: 20 }}
          error={keyword.length === 1}
          helperText={
            keyword.length === 1
              ? "พิมพ์อย่างน้อย 2 ตัวอักษร"
              : `${keyword.length}/20 ตัวอักษร`
          }
          sx={{ mb: 2 }}
        />

        {/* loading */}
        {loading && <CircularProgress size={24} />}

        {/* no result */}
        {!loading && items.length === 0 && keyword && (
          <Typography color="text.secondary">ไม่พบข้อมูล</Typography>
        )}
        {!loading && items.length !== 0 && keyword && (
          <List>
            {items.map((item) => (
              <ListItemButton key={item.id} onClick={() => onSelect(item)}>
                <ListItemText
                  primary={`ตำบล ${item.sub_districts_name}`}
                  secondary={`${item.district} / ${item.province}`}
                />
              </ListItemButton>
            ))}
          </List>
        )}
      </DialogContent>
    </Dialog>
  );
}

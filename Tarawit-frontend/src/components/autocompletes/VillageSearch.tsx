import { Autocomplete, TextField } from "@mui/material";
import { useEffect, useState } from "react";
import type { Area } from "../../types/village";

type Props = {
  onSelect: (v: Area | null) => void;
};

export default function VillageSearch({ onSelect }: Props) {
  const [options, setOptions] = useState<Area[]>([]);
  const [loading, setLoading] = useState(false);
  const [keyword, setKeyword] = useState("");

  useEffect(() => {
    if (!keyword) return;

    const delay = setTimeout(() => {
      fetchVillages(keyword);
    }, 400); // debounce

    return () => clearTimeout(delay);
  }, [keyword]);

  const fetchVillages = async (q: string) => {
    try {
      setLoading(true);

      // 🔥 เปลี่ยนเป็น API จริงคุณ
      const res = await fetch(
        `/api/locations/search?q=${encodeURIComponent(q)}`,
      );

      const data = await res.json();
      setOptions(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Autocomplete
      options={options}
      loading={loading}
      getOptionLabel={(o) =>
        `ต.${o.sub_districts_name} อ.${o.district} จ.${o.province}`
      }
      onInputChange={(_, value) => setKeyword(value)}
      onChange={(_, value) => onSelect(value)}
      renderInput={(params) => (
        <TextField {...params} label="ค้นหาพื้นที่ / หมู่บ้าน" size="small" />
      )}
    />
  );
}

import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import api from "../../../api/axios";
import type {
  EvaluationSectionForm,
  InstanceAttachment,
  MyEvaluationAssignment,
} from "../types/EvaluationSectionForm_type";

interface MyEvaluationsState {
  myinstance: MyEvaluationAssignment[];
  listLoading: boolean;
  listError: string | null;
  detail: EvaluationSectionForm | null;
  detailLoading: boolean;
  detailError: string | null;

  attachments: InstanceAttachment[];
  attachmentsLoading: boolean;
  attachmentsError: string | null;
}

const initialState: MyEvaluationsState = {
  myinstance: [],
  listLoading: false,
  listError: null,

  detail: null,
  detailLoading: false,
  detailError: null,

  attachments: [],
  attachmentsLoading: false,
  attachmentsError: null,
};

export const fetchMyInstance = createAsyncThunk<
  MyEvaluationAssignment[],
  void,
  { rejectValue: string }
>("template/getAll", async (_, { rejectWithValue }) => {
  try {
    const res = await api.get<MyEvaluationAssignment[]>(
      "/evaluation/instances/get-my-instance",
    );
    return res.data ?? [];
  } catch {
    return rejectWithValue("ไม่สามารถโหลดข้อมูลได้");
  }
});

export const fetchMyInstanceDetail = createAsyncThunk<
  EvaluationSectionForm,
  number | { instanceId: number; targetId?: number },
  { rejectValue: string }
>("myInstance/getDetail", async (request, { rejectWithValue }) => {
  try {
	const instanceId = typeof request === "number" ? request : request.instanceId;
	const targetId = typeof request === "number" ? undefined : request.targetId;
    const res = await api.get<EvaluationSectionForm>(
	  `/evaluation/instances/get-my-instanceByid/${instanceId}`,
	  { params: targetId ? { target_id: targetId } : undefined },
    );

    const data = res.data;
    if (!data) return rejectWithValue("ไม่พบข้อมูลรายละเอียด");

    return {
      ...data,
      fields: Array.isArray(data.fields) ? data.fields : [],
      questions: Array.isArray(data.questions) ? data.questions : [],
      evaluators: Array.isArray(data.evaluators)
        ? data.evaluators
        : [],
	  accessible_targets: Array.isArray(data.accessible_targets)
		? data.accessible_targets
		: [data.target].filter(Boolean),
      sections: Array.isArray(data.sections) ? data.sections : [],
    };
  } catch {
    return rejectWithValue("ไม่สามารถโหลดรายละเอียดได้");
  }
});
export const fetchInstanceAttachments = createAsyncThunk<
  InstanceAttachment[],
  {
    instanceId: number;
    targetId: number;
  },
  { rejectValue: string }
>(
  "myInstance/fetchAttachments",
  async ({ instanceId, targetId }, { rejectWithValue }) => {
    try {
      const res = await api.get<InstanceAttachment[]>(
        `/evaluation/instances/${instanceId}/targets/${targetId}/attachments`,
      );

      return res.data ?? [];
    } catch {
      return rejectWithValue("โหลดไฟล์แนบไม่สำเร็จ");
    }
  },
);
export const uploadInstanceAttachment = createAsyncThunk<
  InstanceAttachment,
  {
    instanceId: number;
    targetId: number;
    file: File;
  }
>("myInstance/uploadAttachment", async ({ instanceId, targetId, file }) => {
  const formData = new FormData();

  formData.append("file", file);

  const res = await api.post<InstanceAttachment>(
    `/evaluation/instances/${instanceId}/targets/${targetId}/attachments`,
    formData,
    {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    },
  );

  return res.data;
});
export const deleteInstanceAttachment = createAsyncThunk(
  "myInstance/deleteAttachment",
  async ({
    instanceId,
    targetId,
    attachmentId,
  }: {
    instanceId: number;
    targetId: number;
    attachmentId: number;
  }) => {
    await api.delete(
      `/evaluation/instances/${instanceId}/targets/${targetId}/attachments/${attachmentId}`,
    );

    return attachmentId;
  },
);
export const updateInstanceFields = createAsyncThunk<
  void,
  {
    instanceId: number;
    fields: Record<number, string>;
  },
  { rejectValue: string }
>(
  "myInstance/updateInstanceFields",
  async ({ instanceId, fields }, { rejectWithValue }) => {
    try {
      await api.put(
        `/evaluation/instances/${instanceId}/fields`,
        {
          fields,
        },
      );

      return;
    } catch {
      return rejectWithValue("บันทึกข้อมูลไม่สำเร็จ");
    }
  },
);
const myInstanceSlice = createSlice({
  name: "myInstance",
  initialState,
  reducers: {
    clearMyInstanceDetail: (state) => {
      state.detail = null;
      state.detailError = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchMyInstance.pending, (state) => {
        state.listLoading = true;
        state.listError = null;
      })
      .addCase(fetchMyInstance.fulfilled, (state, action) => {
        state.listLoading = false;
        state.myinstance = action.payload ?? [];
      })
      .addCase(fetchMyInstance.rejected, (state, action) => {
        state.listLoading = false;
        state.listError =
          action.payload ?? action.error.message ?? "โหลดข้อมูลไม่สำเร็จ";
      })
      .addCase(fetchMyInstanceDetail.pending, (state) => {
        state.detailLoading = true;
        state.detailError = null;
      })
      .addCase(fetchMyInstanceDetail.fulfilled, (state, action) => {
        state.detailLoading = false;
        state.detail = action.payload;
      })
      .addCase(fetchMyInstanceDetail.rejected, (state, action) => {
        state.detailLoading = false;
        state.detailError =
          action.payload ?? action.error.message ?? "โหลดรายละเอียดไม่สำเร็จ";
      })

      // extraReducers
      .addCase(fetchInstanceAttachments.pending, (state) => {
        state.attachmentsLoading = true;
        state.attachmentsError = null;
      })
      .addCase(fetchInstanceAttachments.fulfilled, (state, action) => {
        state.attachmentsLoading = false;
        state.attachments = action.payload ?? [];
      })
      .addCase(fetchInstanceAttachments.rejected, (state, action) => {
        state.attachmentsLoading = false;
        state.attachmentsError = action.error.message ?? "โหลดไฟล์แนบไม่สำเร็จ";
      })
      .addCase(uploadInstanceAttachment.fulfilled, (state, action) => {
        state.attachments.push(action.payload);
      })
      .addCase(deleteInstanceAttachment.fulfilled, (state, action) => {
        state.attachments = state.attachments.filter(
          (a) => a.id !== action.payload,
        );
      })
      .addCase(updateInstanceFields.pending, (state) => {
        state.detailError = null;
      })

      .addCase(updateInstanceFields.rejected, (state, action) => {
        state.detailError = action.payload ?? "บันทึกข้อมูลไม่สำเร็จ";
      });
  },
});

export const { clearMyInstanceDetail } = myInstanceSlice.actions;
export default myInstanceSlice.reducer;

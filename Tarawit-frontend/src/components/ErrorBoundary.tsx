import { Component, type ReactNode } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";

interface Props {
  children: ReactNode;
  /** label สำหรับ error boundary นี้ (เช่น "Dashboard") */
  label?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export default class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error(`[ErrorBoundary${this.props.label ? ` — ${this.props.label}` : ""}]`, error, info.componentStack);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="rounded-2xl border border-red-200 bg-red-50/50 p-6">
          <div className="flex flex-col items-center text-center">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-100 text-red-500">
              <AlertTriangle size={20} />
            </div>
            <h3 className="mt-3 text-sm font-semibold text-gray-900">
              เกิดข้อผิดพลาด{this.props.label ? `ในส่วน "${this.props.label}"` : ""}
            </h3>
            <p className="mt-1 max-w-sm text-xs text-gray-500">
              {this.state.error?.message || "ไม่สามารถโหลดข้อมูลได้ กรุณาลองใหม่อีกครั้ง"}
            </p>
            <button
              type="button"
              onClick={this.handleRetry}
              className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-white px-3 py-1.5 text-sm font-medium text-gray-700 border border-gray-300 transition-colors hover:bg-gray-50"
            >
              <RefreshCw size={14} />
              ลองใหม่
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

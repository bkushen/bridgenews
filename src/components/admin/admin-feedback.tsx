type AdminFeedbackProps = {
  saved?: boolean;
  deleted?: boolean;
  error?: string | null;
};

export function AdminFeedback({ saved, deleted, error }: AdminFeedbackProps) {
  if (error) {
    return <div className="mb-5 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-700">Could not save changes: {error}</div>;
  }
  if (deleted) {
    return <div className="mb-5 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-bold text-amber-800">Item deleted successfully.</div>;
  }
  if (saved) {
    return <div className="mb-5 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-700">Changes saved successfully.</div>;
  }
  return null;
}

import { useParams } from "react-router-dom";

export default function EditApplication() {
  const { id } = useParams();

  return (
    <div>
      <h1 className="font-display text-2xl font-semibold text-ink">Edit Application</h1>
      <div className="mt-6 flex flex-col items-center justify-center rounded-xl border border-dashed border-border-strong bg-surface px-5 py-16 text-center">
        <p className="text-sm font-medium text-ink">This page is coming next</p>
        <p className="mt-1 text-sm text-ink-muted">Editing for application {id} isn't built yet.</p>
      </div>
    </div>
  );
}

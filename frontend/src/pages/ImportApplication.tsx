import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ApiError, createApplication } from "../services/api";
import type { ApplicationStatus } from "../types/application";
import LoadingSpinner from "../components/LoadingSpinner";

interface MockExtraction {
  company: string;
  position: string;
  location: string;
  salary: string;
  skills: string[];
}

const MOCK_POSTINGS: MockExtraction[] = [
  {
    company: "Acme Corp",
    position: "Senior Frontend Engineer",
    location: "Remote",
    salary: "$120,000 – $150,000",
    skills: ["React", "TypeScript", "GraphQL"],
  },
  {
    company: "Northwind Systems",
    position: "Backend Engineer, Platform",
    location: "Berlin, Germany",
    salary: "€65,000 – €80,000",
    skills: ["Go", "PostgreSQL", "Kubernetes"],
  },
  {
    company: "Solace Health",
    position: "Full Stack Developer Intern",
    location: "Austin, TX",
    salary: "$28/hr",
    skills: ["Python", "FastAPI", "React"],
  },
];

const STATUS_OPTIONS: { value: ApplicationStatus; label: string }[] = [
  { value: "APPLIED", label: "Applied" },
  { value: "INTERVIEW", label: "Interview" },
  { value: "OFFER", label: "Offer" },
  { value: "REJECTED", label: "Rejected" },
];

export default function ImportApplication() {
  const navigate = useNavigate();

  const [url, setUrl] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analyzeError, setAnalyzeError] = useState<string | null>(null);

  const [extraction, setExtraction] = useState<MockExtraction | null>(null);
  const [status, setStatus] = useState<ApplicationStatus>("APPLIED");

  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  async function handleAnalyze() {
    if (isAnalyzing) return;

    if (!url.trim()) {
      setAnalyzeError("Paste a job posting URL first.");
      return;
    }

    setAnalyzeError(null);
    setIsAnalyzing(true);
    setExtraction(null);

    // Mocked AI extraction — no backend endpoint exists yet.
    // This does not read the pasted URL; it returns a random sample posting
    // so the preview → confirm → save flow can be tested end to end.
    await new Promise((resolve) => setTimeout(resolve, 900));
    const sample =
      MOCK_POSTINGS[Math.floor(Math.random() * MOCK_POSTINGS.length)];

    setExtraction(sample);
    setStatus("APPLIED");
    setIsAnalyzing(false);
  }

  function handleCancel() {
    setExtraction(null);
    setSaveError(null);
  }

  async function handleSave() {
    if (!extraction || isSaving) return;

    setSaveError(null);
    setIsSaving(true);
    try {
      const application = await createApplication({
        company: extraction.company,
        position: extraction.position,
        location: extraction.location,
        status,
        job_url: url.trim() || undefined,
        salary: extraction.salary || undefined,
        skills: extraction.skills.length > 0 ? extraction.skills : undefined,
      });
      navigate(`/applications/${application.id}`, { replace: true });
    } catch (err) {
      setSaveError(
        err instanceof ApiError
          ? err.message
          : "Something went wrong. Please try again.",
      );
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="font-display text-2xl font-semibold text-ink">
        Import a Job with AI
      </h1>
      <p className="mt-1 text-sm text-ink-muted">
        Paste a job posting URL and let AI pull out the details for you to
        review.
      </p>

      <div className="mt-6 rounded-xl border border-border bg-surface p-6 shadow-sm">
        {analyzeError && (
          <div
            role="alert"
            className="mb-4 rounded-md border border-status-rejected-dot/30 bg-status-rejected-bg px-3 py-2 text-sm text-status-rejected-text"
          >
            {analyzeError}
          </div>
        )}

        <label
          htmlFor="jobUrl"
          className="mb-1.5 block text-sm font-medium text-ink"
        >
          Job posting URL
        </label>
        <div className="flex flex-col gap-3 sm:flex-row">
          <input
            id="jobUrl"
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            disabled={isAnalyzing}
            placeholder="Paste a job posting URL..."
            className="flex-1 rounded-md border border-border-strong bg-white px-3 py-2 text-sm text-ink outline-none placeholder:text-ink-faint focus:border-brand-500 focus:ring-1 focus:ring-brand-500 disabled:opacity-70"
          />
          <button
            type="button"
            onClick={handleAnalyze}
            disabled={isAnalyzing}
            className="flex items-center justify-center gap-2 whitespace-nowrap rounded-md bg-brand-500 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {isAnalyzing && <LoadingSpinner size="sm" className="text-white" />}
            {isAnalyzing ? "Analyzing..." : "Analyze Job"}
          </button>
        </div>
        <p className="mt-2 text-xs text-ink-faint">
          This is a mocked preview for now — it doesn't read the actual page
          yet.
        </p>
      </div>

      {extraction && (
        <div className="mt-6 rounded-xl border border-border bg-surface p-6 shadow-sm">
          <h2 className="font-display text-base font-semibold text-ink">
            Preview
          </h2>

          <dl className="mt-4 grid gap-4 sm:grid-cols-2">
            <div>
              <dt className="text-xs font-medium uppercase tracking-wide text-ink-faint">
                Company
              </dt>
              <dd className="mt-1 text-sm text-ink">{extraction.company}</dd>
            </div>
            <div>
              <dt className="text-xs font-medium uppercase tracking-wide text-ink-faint">
                Position
              </dt>
              <dd className="mt-1 text-sm text-ink">{extraction.position}</dd>
            </div>
            <div>
              <dt className="text-xs font-medium uppercase tracking-wide text-ink-faint">
                Location
              </dt>
              <dd className="mt-1 text-sm text-ink">{extraction.location}</dd>
            </div>
            <div>
              <dt className="text-xs font-medium uppercase tracking-wide text-ink-faint">
                Salary
              </dt>
              <dd className="mt-1 text-sm text-ink">{extraction.salary}</dd>
            </div>
            <div className="sm:col-span-2">
              <dt className="text-xs font-medium uppercase tracking-wide text-ink-faint">
                Skills
              </dt>
              <dd className="mt-1.5 flex flex-wrap gap-1.5">
                {extraction.skills.map((skill) => (
                  <span
                    key={skill}
                    className="rounded-full bg-brand-50 px-2.5 py-1 text-xs font-medium text-brand-700"
                  >
                    {skill}
                  </span>
                ))}
              </dd>
            </div>
          </dl>

          <div className="mt-4 border-t border-border pt-4">
            <label
              htmlFor="status"
              className="mb-1.5 block text-sm font-medium text-ink"
            >
              Status
            </label>
            <select
              id="status"
              value={status}
              onChange={(e) => setStatus(e.target.value as ApplicationStatus)}
              className="w-full max-w-xs rounded-md border border-border-strong bg-white px-3 py-2 text-sm text-ink outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 sm:w-auto"
            >
              {STATUS_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          {saveError && (
            <div
              role="alert"
              className="mt-4 rounded-md border border-status-rejected-dot/30 bg-status-rejected-bg px-3 py-2 text-sm text-status-rejected-text"
            >
              {saveError}
            </div>
          )}

          <div className="mt-6 flex gap-3 border-t border-border pt-6">
            <button
              type="button"
              onClick={handleSave}
              disabled={isSaving}
              className="flex items-center justify-center gap-2 rounded-md bg-brand-500 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {isSaving && <LoadingSpinner size="sm" className="text-white" />}
              {isSaving ? "Saving..." : "Save Application"}
            </button>
            <button
              type="button"
              onClick={handleCancel}
              disabled={isSaving}
              className="rounded-md border border-border px-4 py-2.5 text-sm font-medium text-ink-muted transition-colors hover:border-border-strong hover:text-ink disabled:cursor-not-allowed disabled:opacity-70"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

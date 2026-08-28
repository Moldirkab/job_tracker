import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ApiError, getApplication, updateApplication } from "../services/api";
import type { ApplicationStatus } from "../types/application";
import LoadingSpinner from "../components/LoadingSpinner";
import SkillsInput from "../components/SkillsInput";

const STATUS_OPTIONS: { value: ApplicationStatus; label: string }[] = [
  { value: "APPLIED", label: "Applied" },
  { value: "INTERVIEW", label: "Interview" },
  { value: "OFFER", label: "Offer" },
  { value: "REJECTED", label: "Rejected" },
];

export default function EditApplication() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [company, setCompany] = useState("");
  const [position, setPosition] = useState("");
  const [location, setLocation] = useState("");
  const [status, setStatus] = useState<ApplicationStatus>("APPLIED");
  const [jobUrl, setJobUrl] = useState("");
  const [salary, setSalary] = useState("");
  const [skills, setSkills] = useState<string[]>([]);
  const [notes, setNotes] = useState("");

  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!id) return;
    let isMounted = true;

    async function load() {
      setIsLoading(true);
      setLoadError(null);
      try {
        const application = await getApplication(id!);
        if (!isMounted) return;
        setCompany(application.company);
        setPosition(application.position);
        setLocation(application.location);
        setStatus(application.status);
        setJobUrl(application.job_url ?? "");
        setSalary(application.salary ?? "");
        setSkills(application.skills ?? []);
        setNotes(application.notes ?? "");
      } catch (err) {
        if (isMounted) {
          setLoadError(
            err instanceof ApiError
              ? err.message
              : "Couldn't load this application.",
          );
        }
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    load();
    return () => {
      isMounted = false;
    };
  }, [id]);

  function validate(): string | null {
    if (!company.trim()) return "Enter the company name.";
    if (!position.trim()) return "Enter the position.";
    if (!location.trim()) return "Enter the location.";
    return null;
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (isSubmitting || !id) return;

    const validationError = validate();
    if (validationError) {
      setSubmitError(validationError);
      return;
    }

    setSubmitError(null);
    setIsSubmitting(true);
    try {
      await updateApplication(id, {
        company: company.trim(),
        position: position.trim(),
        location: location.trim(),
        status,
        job_url: jobUrl.trim() || undefined,
        salary: salary.trim() || undefined,
        skills: skills.length > 0 ? skills : undefined,
        notes: notes.trim() || undefined,
      });
      navigate(`/applications/${id}`, { replace: true });
    } catch (err) {
      setSubmitError(
        err instanceof ApiError
          ? err.message
          : "Something went wrong. Please try again.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center rounded-xl border border-border bg-surface py-16">
        <LoadingSpinner />
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="rounded-xl border border-status-rejected-dot/30 bg-status-rejected-bg px-4 py-3 text-sm text-status-rejected-text">
        {loadError}
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-xl">
      <h1 className="font-display text-2xl font-semibold text-ink">
        Edit Application
      </h1>
      <p className="mt-1 text-sm text-ink-muted">
        Update the details for this application.
      </p>

      <form
        onSubmit={handleSubmit}
        noValidate
        className="mt-6 rounded-xl border border-border bg-surface p-6 shadow-sm"
      >
        {submitError && (
          <div
            role="alert"
            className="mb-4 rounded-md border border-status-rejected-dot/30 bg-status-rejected-bg px-3 py-2 text-sm text-status-rejected-text"
          >
            {submitError}
          </div>
        )}

        <div className="mb-4 grid gap-4 sm:grid-cols-2">
          <div>
            <label
              htmlFor="company"
              className="mb-1.5 block text-sm font-medium text-ink"
            >
              Company
            </label>
            <input
              id="company"
              type="text"
              value={company}
              onChange={(e) => setCompany(e.target.value)}
              className="w-full rounded-md border border-border-strong bg-white px-3 py-2 text-sm text-ink outline-none placeholder:text-ink-faint focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
              placeholder="Google"
            />
          </div>

          <div>
            <label
              htmlFor="position"
              className="mb-1.5 block text-sm font-medium text-ink"
            >
              Position
            </label>
            <input
              id="position"
              type="text"
              value={position}
              onChange={(e) => setPosition(e.target.value)}
              className="w-full rounded-md border border-border-strong bg-white px-3 py-2 text-sm text-ink outline-none placeholder:text-ink-faint focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
              placeholder="Backend Intern"
            />
          </div>
        </div>

        <div className="mb-4 grid gap-4 sm:grid-cols-2">
          <div>
            <label
              htmlFor="location"
              className="mb-1.5 block text-sm font-medium text-ink"
            >
              Location
            </label>
            <input
              id="location"
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="w-full rounded-md border border-border-strong bg-white px-3 py-2 text-sm text-ink outline-none placeholder:text-ink-faint focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
              placeholder="Warsaw"
            />
          </div>

          <div>
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
              className="w-full rounded-md border border-border-strong bg-white px-3 py-2 text-sm text-ink outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
            >
              {STATUS_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="mb-4 grid gap-4 sm:grid-cols-2">
          <div>
            <label
              htmlFor="jobUrl"
              className="mb-1.5 block text-sm font-medium text-ink"
            >
              Job URL{" "}
              <span className="font-normal text-ink-faint">(optional)</span>
            </label>
            <input
              id="jobUrl"
              type="url"
              value={jobUrl}
              onChange={(e) => setJobUrl(e.target.value)}
              className="w-full rounded-md border border-border-strong bg-white px-3 py-2 text-sm text-ink outline-none placeholder:text-ink-faint focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
              placeholder="https://careers.example.com/job/123"
            />
          </div>

          <div>
            <label
              htmlFor="salary"
              className="mb-1.5 block text-sm font-medium text-ink"
            >
              Salary{" "}
              <span className="font-normal text-ink-faint">(optional)</span>
            </label>
            <input
              id="salary"
              type="text"
              value={salary}
              onChange={(e) => setSalary(e.target.value)}
              className="w-full rounded-md border border-border-strong bg-white px-3 py-2 text-sm text-ink outline-none placeholder:text-ink-faint focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
              placeholder="$120,000 – $150,000"
            />
          </div>
        </div>

        <div className="mb-4">
          <label className="mb-1.5 block text-sm font-medium text-ink">
            Skills{" "}
            <span className="font-normal text-ink-faint">(optional)</span>
          </label>
          <SkillsInput value={skills} onChange={setSkills} />
        </div>

        <div className="mb-6">
          <label
            htmlFor="notes"
            className="mb-1.5 block text-sm font-medium text-ink"
          >
            Notes <span className="font-normal text-ink-faint">(optional)</span>
          </label>
          <textarea
            id="notes"
            rows={4}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full resize-none rounded-md border border-border-strong bg-white px-3 py-2 text-sm text-ink outline-none placeholder:text-ink-faint focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
            placeholder="Referred by a friend, followed up on..."
          />
        </div>

        <div className="flex gap-3">
          <button
            type="submit"
            disabled={isSubmitting}
            className="flex items-center justify-center gap-2 rounded-md bg-brand-500 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {isSubmitting && (
              <LoadingSpinner size="sm" className="text-white" />
            )}
            {isSubmitting ? "Saving..." : "Save Changes"}
          </button>
          <button
            type="button"
            onClick={() => navigate(-1)}
            disabled={isSubmitting}
            className="rounded-md border border-border px-4 py-2.5 text-sm font-medium text-ink-muted transition-colors hover:border-border-strong hover:text-ink disabled:cursor-not-allowed disabled:opacity-70"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}

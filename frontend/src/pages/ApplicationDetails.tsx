import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ApiError, deleteApplication, getApplication } from "../services/api";
import type { Application } from "../types/application";
import StatusBadge from "../components/StatusBadge";
import LoadingSpinner from "../components/LoadingSpinner";

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export default function ApplicationDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [application, setApplication] = useState<Application | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    let isMounted = true;

    async function load() {
      setIsLoading(true);
      setError(null);
      try {
        const data = await getApplication(id!);
        if (isMounted) setApplication(data);
      } catch (err) {
        if (isMounted) {
          setError(
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

  async function handleDelete() {
    if (!id || isDeleting) return;
    setIsDeleting(true);
    setDeleteError(null);
    try {
      await deleteApplication(id);
      navigate("/applications", { replace: true });
    } catch (err) {
      setDeleteError(
        err instanceof ApiError
          ? err.message
          : "Couldn't delete this application.",
      );
      setIsDeleting(false);
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center rounded-xl border border-border bg-surface py-16">
        <LoadingSpinner />
      </div>
    );
  }

  if (error || !application) {
    return (
      <div className="rounded-xl border border-status-rejected-dot/30 bg-status-rejected-bg px-4 py-3 text-sm text-status-rejected-text">
        {error || "Application not found."}
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl">
      <Link
        to="/applications"
        className="text-sm font-medium text-brand-600 hover:text-brand-700"
      >
        ← Back to applications
      </Link>

      <div className="mt-4 rounded-xl border border-border bg-surface p-6 shadow-sm">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="font-display text-2xl font-semibold text-ink">
              {application.position}
            </h1>
            <p className="mt-1 text-base text-ink-muted">
              {application.company} · {application.location}
            </p>
          </div>
          <StatusBadge status={application.status} />
        </div>

        <dl className="mt-6 grid gap-4 border-t border-border pt-6 sm:grid-cols-2">
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-ink-faint">
              Company
            </dt>
            <dd className="mt-1 text-sm text-ink">{application.company}</dd>
          </div>
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-ink-faint">
              Position
            </dt>
            <dd className="mt-1 text-sm text-ink">{application.position}</dd>
          </div>
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-ink-faint">
              Location
            </dt>
            <dd className="mt-1 text-sm text-ink">{application.location}</dd>
          </div>
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-ink-faint">
              Added
            </dt>
            <dd className="mt-1 text-sm text-ink">
              {formatDate(application.created_at)}
            </dd>
          </div>
          {application.salary && (
            <div>
              <dt className="text-xs font-medium uppercase tracking-wide text-ink-faint">
                Salary
              </dt>
              <dd className="mt-1 text-sm text-ink">{application.salary}</dd>
            </div>
          )}
          {application.job_url && (
            <div className="sm:col-span-2">
              <dt className="text-xs font-medium uppercase tracking-wide text-ink-faint">
                Job URL
              </dt>
              <dd className="mt-1 truncate text-sm">
                <a
                  href={application.job_url}
                  target="_blank"
                  rel="noreferrer"
                  className="text-brand-600 hover:text-brand-700"
                >
                  {application.job_url}
                </a>
              </dd>
            </div>
          )}
          {application.skills && application.skills.length > 0 && (
            <div className="sm:col-span-2">
              <dt className="text-xs font-medium uppercase tracking-wide text-ink-faint">
                Skills
              </dt>
              <dd className="mt-1.5 flex flex-wrap gap-1.5">
                {application.skills.map((skill) => (
                  <span
                    key={skill}
                    className="rounded-full bg-brand-50 px-2.5 py-1 text-xs font-medium text-brand-700"
                  >
                    {skill}
                  </span>
                ))}
              </dd>
            </div>
          )}
          {application.notes && (
            <div className="sm:col-span-2">
              <dt className="text-xs font-medium uppercase tracking-wide text-ink-faint">
                Notes
              </dt>
              <dd className="mt-1 whitespace-pre-wrap text-sm text-ink">
                {application.notes}
              </dd>
            </div>
          )}
        </dl>

        <div className="mt-6 flex items-center gap-3 border-t border-border pt-6">
          <Link
            to={`/applications/${application.id}/edit`}
            className="rounded-md border border-border px-4 py-2 text-sm font-medium text-ink transition-colors hover:border-border-strong"
          >
            Edit
          </Link>

          <button
            type="button"
            onClick={() => setIsDeleteModalOpen(true)}
            className="rounded-md border border-status-rejected-dot/40 px-4 py-2 text-sm font-medium text-status-rejected-text transition-colors hover:bg-status-rejected-bg"
          >
            Delete
          </button>
        </div>
      </div>

      {isDeleteModalOpen && (
        <div
          className="fixed inset-0 z-20 flex items-center justify-center bg-ink/40 px-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="delete-modal-title"
          onClick={() => {
            if (!isDeleting) setIsDeleteModalOpen(false);
          }}
        >
          <div
            className="w-full max-w-sm rounded-xl border border-border bg-surface p-6 shadow-lg"
            onClick={(e) => e.stopPropagation()}
          >
            <h2
              id="delete-modal-title"
              className="font-display text-lg font-semibold text-ink"
            >
              Confirm delete?
            </h2>
            <p className="mt-2 text-sm text-ink-muted">
              This will permanently delete the application for{" "}
              <span className="font-medium text-ink">
                {application.position} at {application.company}
              </span>
              . This can't be undone.
            </p>

            {deleteError && (
              <div
                role="alert"
                className="mt-4 rounded-md border border-status-rejected-dot/30 bg-status-rejected-bg px-3 py-2 text-sm text-status-rejected-text"
              >
                {deleteError}
              </div>
            )}

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setIsDeleteModalOpen(false)}
                disabled={isDeleting}
                className="rounded-md border border-border px-4 py-2 text-sm font-medium text-ink-muted transition-colors hover:border-border-strong hover:text-ink disabled:cursor-not-allowed disabled:opacity-70"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={isDeleting}
                className="flex items-center gap-2 rounded-md bg-status-rejected-dot px-4 py-2 text-sm font-medium text-white transition-colors hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {isDeleting && (
                  <LoadingSpinner size="sm" className="text-white" />
                )}
                {isDeleting ? "Deleting..." : "Confirm delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

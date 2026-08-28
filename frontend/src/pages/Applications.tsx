import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ApiError, getApplications } from "../services/api";
import type { Application, ApplicationStatus } from "../types/application";
import StatusBadge from "../components/StatusBadge";
import LoadingSpinner from "../components/LoadingSpinner";

type StatusFilter = "ALL" | ApplicationStatus;
type SortOption = "newest" | "oldest" | "company_az";

const STATUS_FILTERS: { value: StatusFilter; label: string }[] = [
  { value: "ALL", label: "All" },
  { value: "APPLIED", label: "Applied" },
  { value: "INTERVIEW", label: "Interview" },
  { value: "OFFER", label: "Offer" },
  { value: "REJECTED", label: "Rejected" },
];

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export default function Applications() {
  const [applications, setApplications] = useState<Application[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("ALL");
  const [sortOption, setSortOption] = useState<SortOption>("newest");

  useEffect(() => {
    let isMounted = true;

    async function load() {
      setIsLoading(true);
      setError(null);
      try {
        const data = await getApplications();
        if (isMounted) setApplications(data);
      } catch (err) {
        if (isMounted) {
          setError(
            err instanceof ApiError
              ? err.message
              : "Couldn't load your applications.",
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
  }, []);

  const filtered = useMemo(() => {
    let result = applications;

    if (statusFilter !== "ALL") {
      result = result.filter((app) => app.status === statusFilter);
    }

    const query = search.trim().toLowerCase();
    if (query) {
      result = result.filter(
        (app) =>
          app.company.toLowerCase().includes(query) ||
          app.position.toLowerCase().includes(query) ||
          app.location.toLowerCase().includes(query),
      );
    }

    const sorted = [...result];
    if (sortOption === "newest") {
      sorted.sort(
        (a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
      );
    } else if (sortOption === "oldest") {
      sorted.sort(
        (a, b) =>
          new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
      );
    } else {
      sorted.sort((a, b) => a.company.localeCompare(b.company));
    }

    return sorted;
  }, [applications, search, statusFilter, sortOption]);

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-semibold text-ink">
            Applications
          </h1>
          <p className="mt-1 text-sm text-ink-muted">
            Everything you've applied to, in one place.
          </p>
        </div>
        <Link
          to="/applications/new"
          className="rounded-md bg-brand-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-brand-600"
        >
          Add Application
        </Link>
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search company, position, or location..."
          className="min-w-[240px] flex-1 rounded-md border border-border-strong bg-white px-3 py-2 text-sm text-ink outline-none placeholder:text-ink-faint focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
        />

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
          className="rounded-md border border-border-strong bg-white px-3 py-2 text-sm text-ink outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
        >
          {STATUS_FILTERS.map((filter) => (
            <option key={filter.value} value={filter.value}>
              {filter.label}
            </option>
          ))}
        </select>

        <select
          value={sortOption}
          onChange={(e) => setSortOption(e.target.value as SortOption)}
          className="rounded-md border border-border-strong bg-white px-3 py-2 text-sm text-ink outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
        >
          <option value="newest">Newest first</option>
          <option value="oldest">Oldest first</option>
          <option value="company_az">Company A–Z</option>
        </select>
      </div>

      {isLoading && (
        <div className="flex items-center justify-center rounded-xl border border-border bg-surface py-16">
          <LoadingSpinner />
        </div>
      )}

      {!isLoading && error && (
        <div className="rounded-xl border border-status-rejected-dot/30 bg-status-rejected-bg px-4 py-3 text-sm text-status-rejected-text">
          {error}
        </div>
      )}

      {!isLoading && !error && filtered.length === 0 && (
        <div className="flex flex-col items-center gap-2 rounded-xl border border-border bg-surface px-5 py-16 text-center">
          <p className="text-sm font-medium text-ink">
            {applications.length === 0
              ? "No applications yet"
              : "No applications match your filters"}
          </p>
          <p className="text-sm text-ink-muted">
            {applications.length === 0
              ? "Add your first application to start tracking."
              : "Try a different search term or status."}
          </p>
        </div>
      )}

      {!isLoading && !error && filtered.length > 0 && (
        <div className="overflow-hidden rounded-xl border border-border bg-surface">
          <ul className="divide-y divide-border">
            {filtered.map((app) => (
              <li key={app.id}>
                <Link
                  to={`/applications/${app.id}`}
                  className="flex items-center justify-between gap-4 px-5 py-4 transition-colors hover:bg-canvas"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-ink">
                      {app.company}
                    </p>
                    <p className="truncate text-sm text-ink-muted">
                      {app.position} · {app.location} ·{" "}
                      {formatDate(app.created_at)}
                    </p>
                  </div>

                  <div className="flex items-center gap-3">
                    <StatusBadge status={app.status} />
                    <span className="text-sm font-medium text-brand-600">
                      View
                    </span>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

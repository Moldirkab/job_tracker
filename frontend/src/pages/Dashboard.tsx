import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ApiError, getApplications } from "../services/api";
import type { Application } from "../types/application";
import StatCard from "../components/StatCard";
import StatusBadge from "../components/StatusBadge";
import LoadingSpinner from "../components/LoadingSpinner";

interface Stats {
  total: number;
  applied: number;
  interview: number;
  offer: number;
  rejected: number;
}

function computeStats(applications: Application[]): Stats {
  return applications.reduce(
    (acc, app) => {
      acc.total += 1;
      if (app.status === "APPLIED") acc.applied += 1;
      if (app.status === "INTERVIEW") acc.interview += 1;
      if (app.status === "OFFER") acc.offer += 1;
      if (app.status === "REJECTED") acc.rejected += 1;
      return acc;
    },
    { total: 0, applied: 0, interview: 0, offer: 0, rejected: 0 },
  );
}

export default function Dashboard() {
  const [applications, setApplications] = useState<Application[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

  const stats = computeStats(applications);
  const recent = [...applications]
    .sort(
      (a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
    )
    .slice(0, 5);

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-display text-2xl font-semibold text-ink">
          Dashboard
        </h1>
        <p className="mt-1 text-sm text-ink-muted">
          An overview of where your applications stand.
        </p>
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

      {!isLoading && !error && (
        <>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
            <StatCard
              label="Total Applications"
              value={stats.total}
              accent="brand"
            />
            <StatCard label="Applied" value={stats.applied} accent="neutral" />
            <StatCard
              label="Interviews"
              value={stats.interview}
              accent="interview"
            />
            <StatCard label="Offers" value={stats.offer} accent="offer" />
            <StatCard
              label="Rejected"
              value={stats.rejected}
              accent="rejected"
            />
          </div>

          <div className="mt-8 rounded-xl border border-border bg-surface">
            <div className="flex items-center justify-between border-b border-border px-5 py-4">
              <h2 className="font-display text-base font-semibold text-ink">
                Recent Applications
              </h2>
              <Link
                to="/applications"
                className="text-sm font-medium text-brand-600 hover:text-brand-700"
              >
                View all
              </Link>
            </div>

            {recent.length === 0 ? (
              <div className="flex flex-col items-center gap-2 px-5 py-12 text-center">
                <p className="text-sm font-medium text-ink">
                  No applications yet
                </p>
                <p className="text-sm text-ink-muted">
                  Add your first application to see it here.
                </p>
                <Link
                  to="/applications/new"
                  className="mt-2 rounded-md bg-brand-500 px-4 py-2 text-sm font-medium text-white hover:bg-brand-600"
                >
                  Add Application
                </Link>
              </div>
            ) : (
              <ul className="divide-y divide-border">
                {recent.map((app) => (
                  <li key={app.id}>
                    <Link
                      to={`/applications/${app.id}`}
                      className="flex items-center justify-between gap-4 px-5 py-4 transition-colors hover:bg-canvas"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-ink">
                          {app.company}
                        </p>
                        <p className="truncate text-sm text-ink-muted">
                          {app.position} · {app.location}
                        </p>
                      </div>
                      <StatusBadge status={app.status} />
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </>
      )}
    </div>
  );
}

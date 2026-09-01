import { useState } from "react";
import type { FormEvent } from "react";
import { Link } from "react-router-dom";
import { ApiError, requestPasswordReset } from "../services/api";
import LoadingSpinner from "../components/LoadingSpinner";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (isSubmitting) return;

    if (!email.trim()) {
      setError("Enter your email address.");
      return;
    }

    setError(null);
    setIsSubmitting(true);
    try {
      await requestPasswordReset(email.trim());
      setIsSubmitted(true);
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : "Something went wrong. Please try again.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-canvas px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-500 font-display text-base font-semibold text-white">
            JT
          </span>
          <h1 className="font-display text-xl font-semibold text-ink">
            Reset your password
          </h1>
          <p className="text-center text-sm text-ink-muted">
            Enter your email and we'll send you a link to reset it
          </p>
        </div>

        <div className="rounded-xl border border-border bg-surface p-6 shadow-sm">
          {isSubmitted ? (
            <div className="text-center">
              <p className="text-sm text-ink">
                If that email is registered, a reset link has been sent. Check
                your inbox (and spam folder).
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} noValidate>
              {error && (
                <div
                  role="alert"
                  className="mb-4 rounded-md border border-status-rejected-dot/30 bg-status-rejected-bg px-3 py-2 text-sm text-status-rejected-text"
                >
                  {error}
                </div>
              )}

              <div className="mb-6">
                <label
                  htmlFor="email"
                  className="mb-1.5 block text-sm font-medium text-ink"
                >
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-md border border-border-strong bg-white px-3 py-2 text-sm text-ink outline-none placeholder:text-ink-faint focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
                  placeholder="you@example.com"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="flex w-full items-center justify-center gap-2 rounded-md bg-brand-500 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {isSubmitting && (
                  <LoadingSpinner size="sm" className="text-white" />
                )}
                {isSubmitting ? "Sending..." : "Send reset link"}
              </button>
            </form>
          )}
        </div>

        <p className="mt-6 text-center text-sm text-ink-muted">
          <Link
            to="/login"
            className="font-medium text-brand-600 hover:text-brand-700"
          >
            Back to login
          </Link>
        </p>
      </div>
    </div>
  );
}

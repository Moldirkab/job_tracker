import { useState } from "react";
import type { FormEvent } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { ApiError, confirmPasswordReset } from "../services/api";
import LoadingSpinner from "../components/LoadingSpinner";

export default function ResetPassword() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  function validate(): string | null {
    if (!token) return "This reset link is invalid or missing a token.";
    if (!newPassword) return "Choose a new password.";
    if (newPassword.length < 8)
      return "Password must be at least 8 characters.";
    if (newPassword !== confirmPassword) return "Passwords don't match.";
    return null;
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (isSubmitting) return;

    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    setError(null);
    setIsSubmitting(true);
    try {
      await confirmPasswordReset(token!, newPassword);
      navigate("/login", { replace: true, state: { justReset: true } });
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

  if (!token) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-canvas px-4">
        <div className="w-full max-w-sm text-center">
          <div className="rounded-xl border border-border bg-surface p-6 shadow-sm">
            <p className="text-sm text-ink">
              This reset link is invalid or missing a token. Please request a
              new one.
            </p>
            <Link
              to="/forgot-password"
              className="mt-4 inline-block text-sm font-medium text-brand-600 hover:text-brand-700"
            >
              Request a new link
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-canvas px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-500 font-display text-base font-semibold text-white">
            JT
          </span>
          <h1 className="font-display text-xl font-semibold text-ink">
            Set a new password
          </h1>
        </div>

        <form
          onSubmit={handleSubmit}
          noValidate
          className="rounded-xl border border-border bg-surface p-6 shadow-sm"
        >
          {error && (
            <div
              role="alert"
              className="mb-4 rounded-md border border-status-rejected-dot/30 bg-status-rejected-bg px-3 py-2 text-sm text-status-rejected-text"
            >
              {error}
            </div>
          )}

          <div className="mb-4">
            <label
              htmlFor="newPassword"
              className="mb-1.5 block text-sm font-medium text-ink"
            >
              New password
            </label>
            <input
              id="newPassword"
              type="password"
              autoComplete="new-password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full rounded-md border border-border-strong bg-white px-3 py-2 text-sm text-ink outline-none placeholder:text-ink-faint focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
              placeholder="At least 8 characters"
            />
          </div>

          <div className="mb-6">
            <label
              htmlFor="confirmPassword"
              className="mb-1.5 block text-sm font-medium text-ink"
            >
              Confirm new password
            </label>
            <input
              id="confirmPassword"
              type="password"
              autoComplete="new-password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full rounded-md border border-border-strong bg-white px-3 py-2 text-sm text-ink outline-none placeholder:text-ink-faint focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
              placeholder="Re-enter your new password"
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
            {isSubmitting ? "Updating..." : "Update password"}
          </button>
        </form>
      </div>
    </div>
  );
}

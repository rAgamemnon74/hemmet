"use client";

import { useState } from "react";
import Link from "next/link";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    // TODO: Implement password reset API
    await new Promise((r) => setTimeout(r, 1000));
    setLoading(false);
    setSent(true);
  }

  if (sent) {
    return (
      <div className="rounded-lg border border-gray-200 bg-white p-8 shadow-sm text-center">
        <h1 className="mb-4 text-xl font-semibold text-gray-900">
          Kontrollera din e-post
        </h1>
        <p className="mb-6 text-sm text-gray-500">
          Om det finns ett konto med adressen <strong>{email}</strong> har vi
          skickat instruktioner för att återställa lösenordet.
        </p>
        <Link
          href="/login"
          className="text-sm text-blue-600 hover:text-blue-700"
        >
          Tillbaka till inloggning
        </Link>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-8 shadow-sm">
      <h1 className="mb-2 text-xl font-semibold text-gray-900">
        Glömt lösenord
      </h1>
      <p className="mb-6 text-sm text-gray-500">
        Ange din e-postadress så skickar vi instruktioner för att återställa ditt lösenord.
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="email" className="mb-1 block text-sm font-medium text-gray-700">
            E-post
          </label>
          <input
            id="email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            placeholder="din@epost.se"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
        >
          {loading ? "Skickar..." : "Skicka återställningslänk"}
        </button>
      </form>

      <div className="mt-4 text-center text-sm text-gray-500">
        <Link href="/login" className="text-blue-600 hover:text-blue-700">
          Tillbaka till inloggning
        </Link>
      </div>
    </div>
  );
}

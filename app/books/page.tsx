"use client";

import Image from "next/image";
import { Card, CardContent } from "@/components/ui/Card";
import { useBooks } from "@/hooks/useBooks";
import LoadingSpinner from "@/components/LoadingSpinner";
import ErrorState from "@/components/ErrorState";
import EmptyState from "@/components/EmptyState";
import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

const FreeBooksPage = () => {
  const { data: books, isLoading, error } = useBooks();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [hasSubmittedEmail, setHasSubmittedEmail] = useState(
    searchParams?.get("access") === "1"
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const handleDownloadBook = (pdfUrl: string) => {
    // Open Google Drive link directly
    window.open(pdfUrl, "_blank");
  };

  const handleSubmitEmail = async () => {
    if (!email) {
      setSubmitError("Please enter your email");
      return;
    }
    const normalized = email.trim().toLowerCase();
    const regex = /[^@\s]+@[^@\s]+\.[^@\s]+/;
    if (!regex.test(normalized)) {
      setSubmitError("Email is invalid");
      return;
    }
    setSubmitError(null);
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/email/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: normalized }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({ error: "Unknown error" }));
        setSubmitError(data.error || "Failed to subscribe");
        setIsSubmitting(false);
        return;
      }
      setHasSubmittedEmail(true);
      router.replace("/books?access=1");
    } catch {
      setSubmitError("Network error");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          <div className="flex justify-center items-center h-64">
            <LoadingSpinner />
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          <ErrorState
            title="Error Loading Books"
            description="Unable to load books at this time. Please try again later."
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        {hasSubmittedEmail && (
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-foreground mb-4">
              Free Books
            </h1>
            <p className="text-lg text-muted-foreground mb-6">
              Click on any book to download from Google Drive
            </p>
          </div>
        )}

        {!hasSubmittedEmail ? (
          <div className="flex items-center justify-center min-h-[80vh]">
            <div className="relative overflow-hidden rounded-2xl border border-border bg-card w-full max-w-5xl mx-auto">
              <div className="relative grid grid-cols-1 md:grid-cols-2 gap-6 px-4 py-6 md:px-8 md:py-8 items-center max-w-5xl mx-auto">
                <div className="space-y-3">
                  <span className="inline-block text-xs px-2.5 py-0.5 rounded-full bg-primary/10 text-primary font-medium mb-2.5">
                    Free PDF
                  </span>
                  <h2 className="text-2xl md:text-3xl font-bold text-card-foreground leading-snug mb-3">
                    Short Stories in{" "}
                    <span className="text-primary">English</span>
                    <br className="hidden sm:block" /> for Beginners
                  </h2>
                  <p className="text-muted-foreground md:text-base mb-4">
                    Enter your email and we’ll notify you when new free books
                    are available.
                  </p>
                  <div className="w-full max-w-xl">
                    <label htmlFor="email" className="sr-only">
                      Email
                    </label>
                    <div className="flex flex-col sm:flex-row gap-3">
                      <input
                        id="email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            handleSubmitEmail();
                          }
                        }}
                        placeholder="Your email address.."
                        className="flex-1 px-3.5 py-2.5 rounded-lg border border-input bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                        aria-label="Email address"
                        tabIndex={0}
                      />
                      <button
                        type="button"
                        onClick={handleSubmitEmail}
                        disabled={isSubmitting}
                        className="px-5 py-2.5 rounded-lg bg-primary text-primary-foreground hover:opacity-90 disabled:opacity-60 focus:outline-none focus:ring-2 focus:ring-primary"
                        aria-label="Submit email"
                      >
                        {isSubmitting ? "Submitting..." : "Grab the Free Ebook"}
                      </button>
                    </div>
                    {submitError ? (
                      <p className="mt-2.5 text-sm text-red-500" role="alert">
                        {submitError}
                      </p>
                    ) : null}
                    <p className="mt-2.5 text-xs text-muted-foreground">
                      By subscribing, you agree to our emails and privacy
                      policy. Unsubscribe at any time.
                    </p>
                  </div>
                </div>
                <div className="relative h-48 md:h-[320px]">
                  <Image
                    src="/free-books/bg.png"
                    alt="Book cover"
                    fill
                    className="object-contain"
                  />
                </div>
              </div>
            </div>
          </div>
        ) : null}

        {/* Books Grid */}
        {hasSubmittedEmail ? (
          !books || books.length === 0 ? (
            <EmptyState
              icon={
                <svg
                  className="w-8 h-8 text-primary"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                  />
                </svg>
              }
              title="No Books Available"
              description="There are no books available at the moment. Please check back later."
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {books.map((book) => (
                <div
                  key={book._id}
                  className="overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group cursor-pointer"
                  onClick={() => handleDownloadBook(book.pdfUrl)}
                  role="button"
                  tabIndex={0}
                  aria-label={`Download ${book.name}`}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      handleDownloadBook(book.pdfUrl);
                    }
                  }}
                >
                  <Card className="h-full border-border hover:border-primary/50 transition-colors duration-300">
                    <CardContent className="p-0">
                      {/* Book Cover */}
                      <div className="relative h-64 bg-muted flex items-center justify-center overflow-hidden rounded-t-2xl">
                        <Image
                          src={book.bookImageUrl}
                          alt={book.name}
                          fill
                          className="object-contain transition-all duration-300 group-hover:scale-105"
                        />
                        {/* Overlay on hover */}
                        <div className="absolute inset-0 bg-primary/0 group-hover:bg-primary/10 transition-colors duration-300" />
                      </div>

                      {/* Book Info */}
                      <div className="p-4 space-y-3">
                        <h3 className="font-semibold text-lg text-card-foreground mb-2 line-clamp-2 group-hover:text-primary transition-colors duration-300">
                          {book.name}
                        </h3>

                        <div className="flex items-center justify-between">
                          <span className="text-xs bg-primary/10 text-primary px-3 py-1.5 rounded-full font-medium">
                            {book.language.toUpperCase()}
                          </span>
                          <div className="text-xs text-muted-foreground">
                            Click to download
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              ))}
            </div>
          )
        ) : null}
      </div>
    </div>
  );
};

export default FreeBooksPage;

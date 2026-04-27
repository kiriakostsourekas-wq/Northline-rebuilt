"use client";

import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    if (error.digest) {
      console.error("northline.global_error", { digest: error.digest });
    } else {
      console.error("northline.global_error", { message: "uncaught" });
    }
  }, [error]);

  return (
    <html lang="en">
      <body>
        <main
          style={{
            alignItems: "center",
            background: "#f7f4ee",
            color: "#17211f",
            display: "flex",
            minHeight: "100vh",
            padding: "24px",
          }}
        >
          <section
            style={{
              border: "1px solid #d9d2c3",
              borderRadius: "8px",
              margin: "0 auto",
              maxWidth: "560px",
              padding: "28px",
            }}
          >
            <p style={{ color: "#68736f", fontSize: "13px", margin: "0 0 8px" }}>
              Northline
            </p>
            <h1 style={{ fontSize: "30px", lineHeight: 1.15, margin: "0 0 12px" }}>
              Something went wrong.
            </h1>
            <p style={{ color: "#3d4845", lineHeight: 1.6, margin: "0 0 20px" }}>
              The application hit an unexpected error. Try again, or contact
              the operator if the issue continues.
            </p>
            {error.digest ? (
              <p style={{ color: "#68736f", fontSize: "13px", margin: "0 0 20px" }}>
                Error reference: {error.digest}
              </p>
            ) : null}
            <button
              onClick={reset}
              style={{
                background: "#17211f",
                border: 0,
                borderRadius: "6px",
                color: "#ffffff",
                cursor: "pointer",
                font: "inherit",
                padding: "10px 14px",
              }}
              type="button"
            >
              Try again
            </button>
          </section>
        </main>
      </body>
    </html>
  );
}

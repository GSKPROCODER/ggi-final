'use client';

interface Props {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function GlobalError({ error, reset }: Props) {
  return (
    <html lang="en">
      <body
        style={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: 'system-ui, -apple-system, Segoe UI, Roboto, sans-serif',
          background: '#050505',
          color: '#f8fafc',
          padding: '2rem',
          textAlign: 'center',
          gap: '1rem',
        }}
      >
        <h1 style={{ fontSize: '1.5rem', fontWeight: 600 }}>Application error</h1>
        <p style={{ color: '#94a3b8', maxWidth: 480 }}>
          {error.message || 'A fatal error prevented the page from rendering.'}
        </p>
        <button
          onClick={reset}
          style={{
            padding: '0.6rem 1.25rem',
            borderRadius: '0.75rem',
            background: '#38bdf8',
            color: '#050505',
            fontWeight: 600,
            border: 'none',
            cursor: 'pointer',
          }}
        >
          Try again
        </button>
      </body>
    </html>
  );
}

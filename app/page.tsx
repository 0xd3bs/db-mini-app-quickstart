"use client";
import { useState, useEffect } from "react";
import { useMiniKit } from "@coinbase/onchainkit/minikit";
import { useRouter } from "next/navigation";
import { minikitConfig } from "../minikit.config";
import styles from "./page.module.css";

export default function Home() {
  const { isFrameReady, setFrameReady, context } = useMiniKit();
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();

  // Initialize the miniapp
  useEffect(() => {
    if (!isFrameReady) {
      setFrameReady();
    }
  }, [setFrameReady, isFrameReady]);

  // For a simple waitlist, we use context.user.fid directly
  // The user is automatically authenticated when opening the app from Farcaster/Base
  const isAuthenticated = !!context?.user?.fid;

  // Debug: Log authentication state
  useEffect(() => {
    console.log("Auth State:", {
      isAuthenticated,
      userFid: context?.user?.fid,
      displayName: context?.user?.displayName,
      context: context?.user
    });
  }, [isAuthenticated, context]);

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // Check authentication - user must be authenticated via Farcaster/Base context
    if (!isAuthenticated) {
      setError("Please open this app from Farcaster or Base app");
      return;
    }

    if (!email) {
      setError("Please enter your email address");
      return;
    }

    if (!validateEmail(email)) {
      setError("Please enter a valid email address");
      return;
    }

    // TODO: Save email to database/API with user FID
    console.log("Valid email submitted:", email);
    console.log("User FID:", context?.user?.fid);
    console.log("User display name:", context?.user?.displayName);

    // Navigate to success page
    router.push("/success");
  };

  return (
    <div className={styles.container}>
      <button className={styles.closeButton} type="button">
        ✕
      </button>
      
      <div className={styles.content}>
        <div className={styles.waitlistForm}>
          <h1 className={styles.title}>Join {minikitConfig.miniapp.name.toUpperCase()}</h1>
          
          <p className={styles.subtitle}>
             Hey {context?.user?.displayName || "there"}, Get early access and be the first to experience the future of<br />
            crypto marketing strategy.
          </p>

          {/* Debug panel - only show if not authenticated */}
          {!isAuthenticated && (
            <div style={{
              background: '#fff3cd',
              border: '1px solid #ffc107',
              borderRadius: '4px',
              padding: '0.75rem',
              marginBottom: '1rem',
              fontSize: '0.85rem',
              textAlign: 'left'
            }}>
              <strong>⚠️ Not Authenticated</strong>
              <div style={{ marginTop: '0.5rem' }}>
                <div>Please open this app from Farcaster or Base app</div>
                <div style={{ marginTop: '0.5rem', fontSize: '0.75rem', color: '#666' }}>
                  Debug: User FID = {context?.user?.fid || 'undefined'}
                </div>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className={styles.form}>
            <input
              type="email"
              placeholder="Your amazing email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={styles.emailInput}
            />
            
            {error && <p className={styles.error}>{error}</p>}
            
            <button type="submit" className={styles.joinButton}>
              JOIN WAITLIST
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

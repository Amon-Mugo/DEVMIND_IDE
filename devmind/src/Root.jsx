import { useState, useEffect } from "react";
import App from "./App";
import Login from "./components/Auth/Login";
import { supabase } from "./lib/supabase";

export default function Root() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user ?? null);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  if (loading) {
    return (
      <div
        style={{
          minHeight: "100vh",
          background: "#0f172a",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "#60a5fa",
          fontSize: "24px",
          fontFamily: "sans-serif",
        }}
      >
        ⚡ Loading DevMind...
      </div>
    );
  }

  if (!user) {
    return <Login onLogin={setUser} />;
  }

  return <App user={user} />;
}
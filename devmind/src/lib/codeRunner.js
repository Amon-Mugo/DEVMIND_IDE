const LANGUAGE_VERSIONS = {
  python: "3.11",
  javascript: "20.11.1",
  java: "15.0.2",
  go: "1.16.2",
  php: "8.1.2",
};

export const runCode = async (language, code) => {
  try {
    const response = await fetch("https://api.e2b.dev/sandboxes", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-API-Key": import.meta.env.VITE_E2B_API_KEY,
      },
      body: JSON.stringify({
        template: language === "python" ? "Python3" : "Node",
        timeout: 30,
      }),
    });

    if (!response.ok) throw new Error("Failed to create sandbox");

    const sandbox = await response.json();
    const sandboxId = sandbox.sandboxID;

    // Run the code
    const execResponse = await fetch(
      `https://api.e2b.dev/sandboxes/${sandboxId}/processes`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-API-Key": import.meta.env.VITE_E2B_API_KEY,
        },
        body: JSON.stringify({
          cmd: language === "python" ? "python3" : "node",
          args: ["-c", code],
          timeout: 30,
        }),
      }
    );

    const result = await execResponse.json();

    // Kill sandbox after use
    await fetch(`https://api.e2b.dev/sandboxes/${sandboxId}`, {
      method: "DELETE",
      headers: {
        "X-API-Key": import.meta.env.VITE_E2B_API_KEY,
      },
    });

    return {
      output: result.stdout || "",
      error: result.stderr || "",
    };
  } catch (err) {
    return { output: "", error: err.message };
  }
};
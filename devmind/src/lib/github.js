const GITHUB_TOKEN = import.meta.env.VITE_GITHUB_TOKEN;
const GITHUB_API = "https://api.github.com";

export const getGithubUser = async () => {
  const response = await fetch(`${GITHUB_API}/user`, {
    headers: {
      Authorization: `Bearer ${GITHUB_TOKEN}`,
      Accept: "application/vnd.github.v3+json",
    },
  });
  return response.json();
};

export const createRepo = async (name, description = "") => {
  const response = await fetch(`${GITHUB_API}/user/repos`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${GITHUB_TOKEN}`,
      Accept: "application/vnd.github.v3+json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      name,
      description,
      private: false,
      auto_init: true,
    }),
  });
  return response.json();
};

export const pushFile = async (owner, repo, filename, content, message = "DevMind export") => {
  // Get current file SHA if exists
  let sha = null;
  try {
    const check = await fetch(`${GITHUB_API}/repos/${owner}/${repo}/contents/${filename}`, {
      headers: {
        Authorization: `Bearer ${GITHUB_TOKEN}`,
        Accept: "application/vnd.github.v3+json",
      },
    });
    if (check.ok) {
      const data = await check.json();
      sha = data.sha;
    }
  } catch {}

  const response = await fetch(
    `${GITHUB_API}/repos/${owner}/${repo}/contents/${filename}`,
    {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${GITHUB_TOKEN}`,
        Accept: "application/vnd.github.v3+json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        message,
        content: btoa(unescape(encodeURIComponent(content))),
        ...(sha && { sha }),
      }),
    }
  );
  return response.json();
};
export const config = { runtime: "edge" };

export default async function handler(req) {
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    const { keyword, count = 6 } = await req.json();

    const response = await fetch(
      `https://api.pexels.com/v1/search?query=${encodeURIComponent(keyword)}&per_page=${count}&orientation=landscape`,
      {
        headers: {
          Authorization: process.env.VITE_PEXELS_API_KEY,
        },
      }
    );

    if (!response.ok) throw new Error("Pexels API error");

    const data = await response.json();

    if (!data.photos || data.photos.length === 0) {
      return new Response(JSON.stringify({ photos: [] }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    const photos = data.photos.map((photo) => ({
      url: photo.src.large,
      small: photo.src.medium,
      thumb: photo.src.small,
      alt: photo.alt || keyword,
      photographer: photo.photographer,
    }));

    return new Response(JSON.stringify({ photos }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message, photos: [] }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
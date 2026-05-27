export const fetchImages = async (keyword, count = 6) => {
  try {
    const response = await fetch(
      `https://api.unsplash.com/search/photos?query=${keyword}&per_page=${count}&orientation=landscape`,
      {
        headers: {
          Authorization: `Client-ID ${import.meta.env.VITE_UNSPLASH_ACCESS_KEY}`,
        },
      }
    );
    const data = await response.json();
    if (!data.results) return [];
    return data.results.map((photo) => ({
      url: photo.urls.regular,
      small: photo.urls.small,
      thumb: photo.urls.thumb,
      alt: photo.alt_description || keyword,
      photographer: photo.user.name,
    }));
  } catch (err) {
    console.error("Unsplash fetch failed:", err);
    return [];
  }
};

export const detectKeyword = (prompt) => {
  const keywords = {
    shoe: "sneakers shoes footwear",
    food: "food restaurant meal",
    gaming: "gaming esports controller",
    fitness: "fitness gym workout",
    finance: "finance business money",
    travel: "travel landscape adventure",
    fashion: "fashion clothing style",
    tech: "technology computer code",
    blog: "writing articles journalism",
    music: "music concert headphones",
    health: "healthcare medical doctor",
    education: "education learning student",
    "real estate": "house architecture property",
    dashboard: "business office analytics",
    landing: "business startup office",
    ecommerce: "shopping products retail",
  };

  const lower = prompt.toLowerCase();
  for (const [key, value] of Object.entries(keywords)) {
    if (lower.includes(key)) return value;
  }
  return "business technology";
};
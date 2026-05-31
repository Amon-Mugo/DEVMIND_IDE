export const fetchImages = async (keyword, count = 6) => {
  try {
    const response = await fetch("/api/images", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ keyword, count }),
    });

    if (!response.ok) throw new Error("Image API error");

    const data = await response.json();

    if (!data.photos || data.photos.length === 0) {
      return getFallback(keyword, count);
    }

    return data.photos;
  } catch (err) {
    console.error("Image fetch failed:", err);
    return getFallback(keyword, count);
  }
};

const getFallback = (keyword, count) => {
  return Array.from({ length: count }, (_, i) => ({
    url: `https://loremflickr.com/800/500/${encodeURIComponent(keyword)}?random=${i + 1}`,
    small: `https://loremflickr.com/400/250/${encodeURIComponent(keyword)}?random=${i + 1}`,
    thumb: `https://loremflickr.com/200/150/${encodeURIComponent(keyword)}?random=${i + 1}`,
    alt: keyword,
  }));
};

export const detectKeyword = (prompt) => {
  const keywords = {
    car: "luxury car",
    vehicle: "car",
    automotive: "car dealership",
    shoe: "sneakers",
    food: "restaurant food",
    gaming: "gaming setup",
    fitness: "gym workout",
    finance: "finance business",
    travel: "travel landscape",
    fashion: "fashion clothing",
    tech: "technology",
    blog: "writing desk",
    music: "music concert",
    health: "healthcare",
    education: "education students",
    "real estate": "modern house",
    dashboard: "business office",
    ecommerce: "online shopping",
    restaurant: "restaurant dining",
    hotel: "luxury hotel",
    portfolio: "creative design",
    crypto: "cryptocurrency",
    coffee: "coffee cafe",
    beauty: "beauty cosmetics",
    sport: "sports action",
    dating: "couple lifestyle",
    pet: "pets animals",
    wedding: "wedding ceremony",
  };

  const lower = prompt.toLowerCase();
  for (const [key, value] of Object.entries(keywords)) {
    if (lower.includes(key)) return value;
  }
  return "business modern";
};
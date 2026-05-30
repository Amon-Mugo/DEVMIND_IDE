export const fetchImages = async (keyword, count = 6) => {
  return Array.from({ length: count }, (_, i) => ({
    url: `https://loremflickr.com/800/500/${encodeURIComponent(keyword)}?random=${i + 1}`,
    small: `https://loremflickr.com/400/250/${encodeURIComponent(keyword)}?random=${i + 1}`,
    thumb: `https://loremflickr.com/200/150/${encodeURIComponent(keyword)}?random=${i + 1}`,
    alt: keyword,
  }));
};

export const detectKeyword = (prompt) => {
  const keywords = {
    car: "car",
    vehicle: "car",
    automotive: "car",
    shoe: "shoes",
    food: "food",
    gaming: "gaming",
    fitness: "fitness",
    finance: "finance",
    travel: "travel",
    fashion: "fashion",
    tech: "technology",
    blog: "writing",
    music: "music",
    health: "healthcare",
    education: "education",
    "real estate": "house",
    dashboard: "office",
    ecommerce: "shopping",
    restaurant: "restaurant",
    hotel: "hotel",
    portfolio: "design",
    crypto: "cryptocurrency",
    coffee: "coffee",
    beauty: "beauty",
    sport: "sports",
  };

  const lower = prompt.toLowerCase();
  for (const [key, value] of Object.entries(keywords)) {
    if (lower.includes(key)) return value;
  }
  return "business";
};
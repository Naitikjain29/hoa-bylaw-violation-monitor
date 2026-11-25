
export const titleCase = (value = "") => {
  return String(value)
    .replace(/_/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
};

export const formatDate = (value) => {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "—";

  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

export const formatAddress = (address) => {
  if (!address) return "Address not available";

  if (typeof address === "string") return address;

  return [
    address.street,
    address.city,
    address.state,
    address.zipCode || address.postalCode,
  ]
    .filter(Boolean)
    .join(", ") || "Address not available";
};

export const imageUrl = (image) => {
  if (!image) return "";

  if (image.startsWith("http://") || image.startsWith("https://")) {
    return image;
  }

  const baseURL =
    process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api";

  const serverURL = baseURL.replace(/\/api\/?$/, "");

  return `${serverURL}/${image.replace(/^\/+/, "")}`;
};

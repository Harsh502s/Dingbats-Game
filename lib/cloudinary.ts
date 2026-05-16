export function cloudinaryUrl(baseUrl: string, width = 800) {
  if (!baseUrl) return '';
  if (!baseUrl.includes('cloudinary.com/')) return baseUrl;
  return baseUrl.replace('/upload/', `/upload/f_auto,q_auto,w_${width}/`);
}

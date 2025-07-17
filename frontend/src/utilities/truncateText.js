export const truncateText = (text, maxLength = 15) => {
  return text.length > maxLength ? text.substring(0, maxLength) + "..." : text;
};

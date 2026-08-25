export function formatNTD(amount: number): string {
  return `NT$ ${Math.round(amount).toLocaleString()}`;
}

/**
 * Automatically converts Google Drive links to direct viewable image URLs
 */
export function formatImageUrl(url: string | undefined): string {
  if (!url) return "";
  
  // Google Drive URL conversion
  if (url.includes("drive.google.com") || url.includes("docs.google.com")) {
    const match = url.match(/\/d\/([a-zA-Z0-9_-]+)/) || url.match(/id=([a-zA-Z0-9_-]+)/);
    if (match && match[1]) {
      return `https://lh3.googleusercontent.com/d/${match[1]}`;
    }
  }

  return url;
}


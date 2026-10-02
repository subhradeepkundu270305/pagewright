export function isRestrictedPage(url: string): boolean {
  if (!url) return true;
  
  const lowerUrl = url.toLowerCase();
  
  return (
    lowerUrl.startsWith('chrome://') ||
    lowerUrl.startsWith('chrome-extension://') ||
    lowerUrl.startsWith('edge://') ||
    lowerUrl.startsWith('about:') ||
    lowerUrl.startsWith('data:') ||
    lowerUrl.includes('chrome.google.com/webstore') ||
    lowerUrl.includes('chromewebstore.google.com')
  );
}

export function getRestrictedPageMessage(url: string): string {
  if (!url) return 'Cannot process an empty URL.';
  
  const lowerUrl = url.toLowerCase();
  
  if (lowerUrl.startsWith('chrome://') || lowerUrl.startsWith('edge://') || lowerUrl.startsWith('about:')) {
    return 'Browser system pages cannot be converted due to security restrictions.';
  }
  
  if (lowerUrl.startsWith('chrome-extension://')) {
    return 'Other extension pages cannot be converted.';
  }
  
  if (lowerUrl.startsWith('data:')) {
    return 'Data URLs cannot be converted.';
  }
  
  if (lowerUrl.includes('chrome.google.com/webstore') || lowerUrl.includes('chromewebstore.google.com')) {
    return 'Browser web store pages cannot be converted due to security restrictions.';
  }
  
  return 'This page cannot be converted.';
}

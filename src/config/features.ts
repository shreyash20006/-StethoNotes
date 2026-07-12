export const getDirectDownloadMode = (): boolean => {
  const localVal = localStorage.getItem('direct_download_mode');
  if (localVal !== null) {
    return localVal === 'true';
  }
  // Check environment variable fallback
  return import.meta.env.VITE_DIRECT_DOWNLOAD_MODE === 'true';
};

export const setDirectDownloadMode = (enabled: boolean) => {
  localStorage.setItem('direct_download_mode', String(enabled));
};

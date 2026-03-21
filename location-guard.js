async function checkLocation() {
  const restrictedPath = '/restricted-region.html';
  const homePath = '/index.html';
  const currentPath = window.location.pathname;

  try {
    const res = await fetch('https://ipinfo.io/json');
    const data = await res.json();

    const isAllowedRegion =
      data.country === 'IN' &&
      (data.region === 'Andhra Pradesh' || data.region === 'Telangana');

    if (isAllowedRegion) {
      if (currentPath === restrictedPath) {
        window.location.replace(homePath);
      }
      return;
    }

    if (currentPath !== restrictedPath) {
      window.location.replace(restrictedPath);
    }
  } catch (e) {
    if (currentPath !== restrictedPath) {
      window.location.replace(restrictedPath);
    }
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', checkLocation, { once: true });
} else {
  checkLocation();
}

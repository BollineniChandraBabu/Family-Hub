async function checkLocation() {
  const restrictAccess = (title, message = '') => {
    const body = document.body || document.documentElement;
    if (!body) {
      return;
    }

    body.innerHTML = `<h1>${title}</h1>${message ? `<p>${message}</p>` : ''}`;
  };

  try {
    const res = await fetch('https://ipinfo.io/json');
    const data = await res.json();

    if (
      data.country === 'IN' &&
       (data.region === "Andhra Pradesh" || data.region === "Telangana")
    ) {
      console.log('Access allowed');
    } else {
      restrictAccess('Access Restricted', 'This site is only available in selected regions.');
    }
  } catch (e) {
    restrictAccess('Location check failed');
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', checkLocation, { once: true });
} else {
  checkLocation();
}

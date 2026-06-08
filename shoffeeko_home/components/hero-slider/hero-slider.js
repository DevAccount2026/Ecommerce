SKModules['hero-slider'] = {
  async init(root, data) {

    // If data is a JSON path, load it first
    if (typeof data === 'string') {
      const res = await fetch(data);
      data = await res.json();
    }

    const wrap = root.querySelector('.hero__slides');
    const dots = root.querySelector('.hero__dots');

    if (!wrap || !dots || !data || !Array.isArray(data.slides)) return;

    let i = 0;

    wrap.innerHTML = data.slides.map((s, idx) => {
      const mediaSrc = s.src || s.video || s.image || '';
      const mediaType = s.type || (s.video ? 'video' : 'image');

      return `
        <article class="hero__slide ${idx === 0 ? 'active' : ''}">
          ${
            mediaType === 'video'
             ? `<video class="hero__media" autoplay muted loop playsinline preload="auto">
                  <source src="${mediaSrc}" type="video/mp4">
                </video>`
              : `<img class="hero__media" src="${mediaSrc}" alt="${s.title || ''}">`
          }

          <div class="hero__content">
            <div>
              <h1 class="hero__title">${s.title || ''}</h1>
              ${
                s.buttonText
                  ? `<a class="sk-btn" href="${s.buttonUrl || '#'}">${s.buttonText}</a>`
                  : ''
              }
            </div>
          </div>
        </article>
      `;
    }).join('');

    dots.innerHTML = data.slides.map((_, idx) => `
      <button aria-label="Slide ${idx + 1}" class="${idx === 0 ? 'active' : ''}"></button>
    `).join('');

    const set = (n) => {
      i = n;

      wrap.querySelectorAll('.hero__slide').forEach((slide, k) => {
        const isActive = k === i;
        slide.classList.toggle('active', isActive);

        const video = slide.querySelector('video');

        if (video) {
          if (isActive) {
            video.currentTime = 0;
            video.play().catch(() => {});
          } else {
            video.pause();
          }
        }
      });

  dots.querySelectorAll('button').forEach((dot, k) => {
    dot.classList.toggle('active', k === i);
  });
};

    dots.addEventListener('click', (e) => {
      if (e.target.tagName !== 'BUTTON') return;

      const index = [...dots.children].indexOf(e.target);
      if (index > -1) set(index);
    });

    if (data.autoplay !== false && data.slides.length > 1) {
      setInterval(() => {
        set((i + 1) % data.slides.length);
      }, data.autoplayMs || data.autoplaySpeed || 5000);
    }
  }
};
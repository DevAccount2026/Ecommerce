SKModules['parallax-video'] = {
  init(root, data) {
    const section = root.querySelector('.parallax-video');
    if (!section || !data) return;

    section.innerHTML = '';

    if (data.type === 'video' && data.video) {
      const video = document.createElement('video');
      video.src = data.video;
      video.poster = data.poster || '';
      video.autoplay = true;
      video.muted = true;
      video.loop = true;
      video.playsInline = true;
      video.className = 'parallax-video__media';

      section.appendChild(video);
    } else {
      section.style.backgroundImage = `url("${data.poster}")`;
    }

    const content = document.createElement('div');
    content.className = 'parallax-video__content';

    content.innerHTML = `
      <h2 class="parallax-video-heading">${data.heading || ''}</h2>
      <p class="parallax-video-text">${data.text || ''}</p>
    `;

    section.appendChild(content);

    const heading = content.querySelector('.parallax-video-heading');
    const text = content.querySelector('.parallax-video-text');

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {

        if (entry.isIntersecting) {
          heading.classList.add('animate-in');
          text.classList.add('animate-in');
        } else {
          heading.classList.remove('animate-in');
          text.classList.remove('animate-in');
        }

      });
    }, {
      threshold: 0.3
    });

    observer.observe(section);
  }
};
SKModules['media-flip-cards'] = {
  init(root, data) {
    const grid = root.querySelector('.flip__grid');

    grid.innerHTML = data.items.map(item => {
      const mediaContent = item.type === 'video'
        ? `
          <video autoplay muted loop playsinline>
            <source src="${item.video}" type="video/mp4">
          </video>
        `
        : `
          <img src="${item.image}" alt="${item.title}">
        `;

      return `
        <article class="flip-card reveal">
          ${mediaContent}

          <div class="flip-card__overlay">
            <div class="flip-card__caption">
              <h3>${item.title || ''}</h3>
              <p>${item.caption || ''}</p>
              ${
                item.link
                  ? `<a href="${item.link}">${item.linkText || 'Learn More'}</a>`
                  : ''
              }
            </div>
          </div>
        </article>
      `;
    }).join('');
  }
};
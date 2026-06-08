SKModules['split-feature'] = {
  init(root, data) {
    root.querySelector('.split__media').innerHTML = `
      <img src="${data.image}" alt="${data.title}">
    `;

    root.querySelector('.split__text').innerHTML = `
      <h2>${data.title}</h2>
      <em>${data.subtitle}</em>
      <p>${data.description}</p>
      <div class="split__badges">
        ${data.badges.map(b => `<span>✓ ${b}</span>`).join('')}
      </div>
      <p class="split__price">${data.price}</p>
      <a class="sk-btn" href="${data.buttonUrl}">${data.buttonText}</a>
    `;
  }
};

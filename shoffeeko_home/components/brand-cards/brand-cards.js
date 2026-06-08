SKModules['brand-cards'] = {
  init(root, data) {
    root.querySelector('.brand__grid').innerHTML = data.cards.map(c => 
      `<article class="brand-card reveal">
         <img src="${c.image}" alt="${c.title}">
       </article>`
    ).join('');
  }
};


SKModules['testimonials'] = {
  init(root, data) {
    const grid = root.querySelector('.testimonials__grid');
    if (!grid || !data || !Array.isArray(data.items)) return;

   grid.innerHTML = data.items.map(t => `
  <article class="testimonial-card reveal">

    <div class="testimonial-card__image">
      <img src="${t.image}" alt="${t.name}">

      <div class="testimonial-card__overlay">
       <div class="testimonial-card__content">
               <h3>${t.name}</h3>
               <p>${t.text}</p>
        </div>
      </div>
    </div>  
   

    <div class="testimonial-card__info">
      <div class="testimonial-card__rating">
        ${'★'.repeat(t.rating)}
        ${'☆'.repeat(5 - t.rating)}
              
      </div>

        <h3>${t.name}</h3>  
    </div>

  </article>
`).join('');
  }
};


SKModules['parallax-story'] = {
  init(root, data) {
    const section = root.querySelector('.parallax');
    if (!section || !data) return;

    const background = data.background || '';

    section.style.backgroundImage =
      `linear-gradient(#0008, #0008), url("${background}")`;

    const heading = root.querySelector('h4');
    const text = root.querySelector('p');

    
    if (heading) {
      heading.textContent = data.heading || '';
      heading.classList.add('parallax-heading');
    }

    if (text) {
      text.textContent = data.text || '';
      text.classList.add('parallax-text');
    }

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {

        if (entry.isIntersecting) {
          heading?.classList.add('animate-in');
          text?.classList.add('animate-in');
        } else {
          heading?.classList.remove('animate-in');
          text?.classList.remove('animate-in');
        }

      });
    }, {
      threshold: 0.3
    });

    observer.observe(section);
  }
};
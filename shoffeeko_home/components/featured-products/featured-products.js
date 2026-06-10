SKModules['featured-products'] = {
  init(root, data) {
    const grid = root.querySelector('.products__grid');
    const modal = root.querySelector('.product-modal');

    if (!grid || !modal || !Array.isArray(data.products)) return;

    let currentProduct = null;
    let currentQuestion = 0;
    let answers = [];

    const questions = [
      {
        progress: '1/4',
        title: 'How do you like your coffee?',
        options: [
          { label: '🧁 Sweet & Creamy', value: 'sweet' },
          { label: '⚡ Strong & Bold', value: 'bold' },
          { label: '🍃 Smooth & Balanced', value: 'balanced' },
          { label: '✨ Light & Refreshing', value: 'light' }
        ]
      },
      {
        progress: '2/4',
        title: 'When do you usually drink coffee?',
        options: [
          { label: '☀️ Morning boost', value: 'morning' },
          { label: '💻 Work / Study', value: 'focus' },
          { label: '🚗 Long drive', value: 'drive' },
          { label: '🌙 Relaxing break', value: 'relax' }
        ]
      },
      {
        progress: '3/4',
        title: 'What flavor profile do you prefer?',
        options: [
          { label: '🥜 Nutty', value: 'nutty' },
          { label: '🍫 Chocolatey', value: 'chocolatey' },
          { label: '🍓 Fruity', value: 'fruity' },
          { label: '☕ Classic coffee', value: 'classic' }
        ]
      },
      {
        progress: '4/4',
        title: 'Your perfect match is ready!',
        options: []
      }
    ];

    const recommendations = {
      pistachio: {
        title: 'Pistachio Roast',
        code: 'BREW10',
        image: 'assets/images/Product_Image/Pistachio_Roast.jpg',
        reason: 'Smooth, nutty, and balanced — perfect for your taste.'
      },
      energy: {
        title: 'Premium Arabica Blend',
        code: 'FOCUS10',
        image: 'assets/images/Product_Image/Premium_Arabica.jpg',
        reason: 'Strong and bold — ideal for work, study, and long focus sessions.'
      },
      tiramisu: {
        title: 'Tiramisu & Black Sesame',
        code: 'SWEET10',
        image: 'assets/images/Product_Image/Tiramisu_BlackSesame.jpg',
        reason: 'Sweet, creamy, and dessert-like — perfect for cozy coffee moments.'
      },
      classic: {
        title: 'Pine & Juniper',
        code: 'CLASSIC10',
        image: 'assets/images/Product_Image/Pine_and_Juniper.jpg',
        reason: 'Balanced and classic — a safe everyday coffee choice.'
      }
    };

    modal.hidden = true;

    grid.innerHTML = data.products.map(p => `
      <article class="product-card reveal" data-id="${p.id}">
        <img src="${p.image}" alt="${p.title}">
        <h3>${p.title}</h3>
        <div class="vendor">${p.vendor}</div>
        <p class="price">${p.price}</p>
        <button type="button">${p.button}</button>
      </article>
    `).join('');

    grid.addEventListener('click', e => {
      const button = e.target.closest('button');
      

   if (button) {
        const card = button.closest('.product-card');
        if (!card) return;

        const product = data.products.find(p => p.id === card.dataset.id);
        if (!product) return;

        addToCart(product);
        return;
     }

        const image = e.target.closest('.product-card img');
        if (!image) return;

        const card = image.closest('.product-card');
        if (!card) return;

        const product = data.products.find(p => p.id === card.dataset.id);
        if (!product) return;

        currentProduct = product;
        openIntroModal(product);
      });


    function openIntroModal(product) {
      modal.hidden = false;
      modal.classList.add('is-open');

      modal.innerHTML = `
        <div class="modal-box">

          <button class="modal-close" type="button" data-close>×</button>

          <div class="modal-left">
            <img src="${product.image}" alt="${product.title}">
          </div>

          <div class="modal-right">
            <div class="modal-coffee-icon">☕</div>

            <h2>Ready to enjoy ${product.title}?</h2>

            <p class="modal-intro">
              You can go directly to the product page, or take a quick quiz and get a
              personalized recommendation <strong>+ an exclusive discount!</strong>
            </p>

            <div class="modal-benefits">
              <div>
                <span>⏱️</span>
                <strong>Quick & fun</strong>
                <small>Takes &lt; 30 sec</small>
              </div>

              <div>
                <span>🎯</span>
                <strong>Personalized</strong>
                <small>Just for you</small>
              </div>

              <div>
                <span>🏷️</span>
                <strong>Extra reward</strong>
                <small>Exclusive discount</small>
              </div>
            </div>

            <div class="modal-actions">

              <div class="modal-option">
                <div class="modal-option-icon">🛍️</div>
                <h3>View Product</h3>
                <p>Go directly to the product page to purchase.</p>
                <a class="modal-btn modal-btn-brown" href="pages/product.html?id=${product.id}">
                  View Product →
                </a>
              </div>

              <div class="modal-option">
                <div class="modal-option-icon green">✨</div>
                <h3>Take the Quiz</h3>
                <p><strong>Find your perfect coffee in less than 1 minute.</strong></p>
                <button class="modal-btn modal-btn-green" type="button" data-start-quiz>
                  Take Quiz →
                </button>
              </div>

            </div>
          </div>

        </div>
      `;
    }

    function startQuiz() {
      currentQuestion = 0;
      answers = [];
      renderQuestion();
    }

    function renderQuestion() {
      const q = questions[currentQuestion];

      modal.innerHTML = `
        <div class="modal-box">

          <button class="modal-close" type="button" data-close>×</button>

          <div class="modal-left">
            <img src="${currentProduct.image}" alt="${currentProduct.title}">
          </div>

          <div class="modal-right quiz-panel">
            <div class="modal-coffee-icon">☕</div>

            <p class="quiz-progress">${q.progress}</p>

            <progress class="quiz-progress-bar" max="4" value="${currentQuestion + 1}"></progress>

            <h2>${q.title}</h2>

            <div class="quiz-options">
              ${
                currentQuestion === questions.length - 1
                  ? renderResult()
                  : q.options.map(option => `
                      <button class="quiz-answer" type="button" data-answer="${option.value}">
                        ${option.label}
                      </button>
                    `).join('')
              }
            </div>

            <button class="modal-btn modal-btn-green quiz-next" type="button">
              ${currentQuestion === questions.length - 1 ? 'Close Quiz' : 'Next →'}
            </button>
          </div>

        </div>
      `;
    }

    function renderResult() {
      const result = getRecommendation();

      return `
        <div class="quiz-result-card">
          <img src="${result.image}" alt="${result.title}">
          <h3>Your perfect match is ${result.title}</h3>
          <p>${result.reason}</p>
          <div class="quiz-discount">
            10% OFF<br>
            Use code: <strong>${result.code}</strong>
          </div>
        </div>
      `;
    }

    function getRecommendation() {
      const taste = answers[0];
      const moment = answers[1];
      const flavor = answers[2];

      if (taste === 'sweet' && flavor === 'nutty') {
        return recommendations.pistachio;
      }

      if (taste === 'bold' || moment === 'focus') {
        return recommendations.energy;
      }

      if (taste === 'sweet' && flavor === 'chocolatey') {
        return recommendations.tiramisu;
      }

      return recommendations.classic;
    }

    modal.addEventListener('click', e => {
      if (e.target === modal || e.target.dataset.close !== undefined) {
        modal.hidden = true;
        modal.classList.remove('is-open');
        return;
      }

      if (e.target.dataset.startQuiz !== undefined) {
        startQuiz();
        return;
      }

      if (e.target.dataset.answer) {
        modal.querySelectorAll('.quiz-answer').forEach(btn => {
          btn.classList.remove('selected');
        });

        e.target.classList.add('selected');
        answers[currentQuestion] = e.target.dataset.answer;
        return;
      }

      if (e.target.classList.contains('quiz-next')) {
        if (currentQuestion === questions.length - 1) {
          modal.hidden = true;
          modal.classList.remove('is-open');
          return;
        }

        if (!answers[currentQuestion]) {
          alert('Please choose an answer first.');
          return;
        }

        currentQuestion++;
        renderQuestion();
      }
    });
  }
};
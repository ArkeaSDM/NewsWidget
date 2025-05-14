class NewsWidget extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
  }

  connectedCallback() {
    const baseUrl = this.getAttribute('base-url');
    if (!baseUrl) {
      console.error("NewsWidget: Missing 'base-url' attribute.");
      return;
    }

    this.injectStyles();
    this.fetchNews(baseUrl);
  }

  injectStyles() {
    const style = document.createElement('style');
    style.textContent = `

        @import url("https://fonts.googleapis.com/css2?family=Poppins:ital,wght@0,100;0,200;0,300;0,400;0,500;0,600;0,700;0,800;0,900;1,100;1,200;1,300;1,400;1,500;1,600;1,700;1,800;1,900&display=swap");
        @import url("https://fonts.googleapis.com/css2?family=Poppins:ital,wght@0,100;0,200;0,300;0,400;0,500;0,600;0,700;0,800;0,900;1,100;1,200;1,300;1,400;1,500;1,600;1,700;1,800;1,900&display=swap");

        .news-widget-container {
          display: flex;
          flex-direction: row;
          flex-wrap: wrap;
        }

        .wrapper {
          width: 25%;
          position: relative;
          min-height: 1px;
        }
         
        .link {
          width: 100%;
        }
  
        .public-card {
          display: flex;
          flex-direction: column;
          justify-content: center;
          text-align: center;
          min-width: 25%;
          padding-right: 8px;
          padding-left: 8px;
        }
  
        .public-card__header {
          position: relative;
          width: 100%;
          height: 150px;
          background-size: cover;
          background-position: center;
        }
  
        .public-card__tag-infos {
          position: absolute;
          display: flex;
          flex-direction: column;
          left: 0;
          top: 1rem;
        }
  
        .public-card-tag,
        .public-card__publish-at,
        .public-card__categories {
          display: inline-block;
          margin-bottom: 2px;
          padding: 2px 5px;
          font-size: 0.75rem;
          color: #fff;
          background: #040D1C;
        }
  
        .public-card__body {
          padding: 0.5rem;
          position: relative;
        }
  
        .public-card__title {
          position: relative;
          display: inline-block;
          margin: 0.5rem auto 1rem;
          font-weight: bold;
          z-index: 1;
          color: black;
          font-size: 14px;
          letter-spacing: 0;
          line-height: 24px;
          font-family: 'Poppins', sans-serif !important;
        }
  
        .public-card__title::before {
          content: "";
          position: absolute;
          bottom: 2px;
          left: 0;
          width: 100%;
          height: 8px;
          background: #A0C3FF;
          z-index: -1;
        }
  
        .public-card__content {
          position: relative;
          overflow: hidden;
          height: 100px;
          -webkit-text-size-adjust: 100%;
          -webkit-font-smoothing: antialiased;
          font-weight: 400;
          line-height: 24px;
          color: black;
          font-family: 'Poppins', sans-serif !important;
        }
        
        a {
        color: black;
        }
  
        .public-card__content::after {
          content: "";
          position: absolute;
          left: 0;
          right: 0;
          height: 80px;
          bottom: 0;
          background: linear-gradient(to bottom, rgba(255, 255, 255, 0), #fff 100%);
        }
      `;
    this.shadowRoot.appendChild(style);
  }

  async fetchNews(baseUrl) {
    const params = new URLSearchParams({
      limit: 4,
      offset: 0,
      order_by: 'desc',
      sort_by: 'publish_at',
      is_public: true,
      target_id: null
    });

    try {
      const res = await fetch(`${baseUrl}/news?${params}`,
        {
          method: "GET",
          headers: {
            'Accept': 'application/json',
            'User-Agent': navigator.userAgent,
            'Referer': window.location.href,
            'Origin': window.location.origin
          },
        });
      const json = await res.json();
      const newsList = json.data.newsfeeds.data;

      this.render(newsList, baseUrl);
    } catch (err) {
      console.error("NewsWidget: Failed to fetch news.", err);
    }
  }

  render(newsItems, baseUrl) {
    const container = document.createElement('div');
    container.classList.add('news-widget-container');

    newsItems.forEach(item => {
      const html = this.renderNewsCard(item, baseUrl);
      container.insertAdjacentHTML('beforeend', html);
    });

    this.shadowRoot.appendChild(container);
  }

  renderNewsCard(entity, baseUrl) {
    return `
          <div class="wrapper">
            <a class="link" href="${baseUrl}/app/nos-actualites/${entity.id}/${this.slugify(entity.title)}">
                <div class="public-card">
                    <header
                        class="public-card__header"
                        style="background-image: url('${entity.img_url || "./news-default.jpg"}')"
                    >
                        <div class="public-card__tag-infos">
                            <p class="public-card__publish-at">
                                ${new Date(entity.publish_at).toLocaleDateString()}
                            </p>
                        </div>
                    </header>
                    <section class="public-card__body">
                        <p class="public-card__title">${entity.title}</p>
                        <div class="public-card__content">${entity.message}</div>
                    </section>
                </div>
            </a>
          </div>
        `;
  }

  slugify(text) {
    const from = "ãàáäâẽèéëêìíïîõòóöôùúüûñç·/_,:;";
    const to = "aaaaaeeeeeiiiiooooouuuunc------";
    for (let i = 0; i < from.length; i++) {
      text = text.replace(new RegExp(from.charAt(i), 'g'), to.charAt(i));
    }
    return text.toLowerCase()
      .trim()
      .replace(/\s+/g, '_')
      .replace(/&/g, '-y-')
      .replace(/[^\w\-]+/g, '')
      .replace(/\-\-+/g, '_');
  }
}

customElements.define('news-widget', NewsWidget);

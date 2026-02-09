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
@import url("https://fonts.googleapis.com/css2?family=Barlow+Condensed:ital,wght@0,100;0,200;0,300;0,400;0,500;0,600;0,700;0,800;0,900;1,100;1,200;1,300;1,400;1,500;1,600;1,700;1,800;1,900&display=swap");
@import url("https://fonts.googleapis.com/css2?family=Raleway:ital,wght@0,100..900;1,100..900&display=swap");
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
.link { width: 100%; }
.public-card {
display: flex;
flex-direction: column;
justify-content: center;
text-align: center;
min-width: 25%;
padding-right: 16px;
padding-left: 16px;
position: relative;
}
.public-card__header {
position: relative;
width: 100%;
height: 150px;
background-size: cover;
background-position: center;
overflow: hidden; /* évite les débords des éléments inclinés */
}
/* Conteneur unique des deux bandeaux, ancré en haut à droite */
.public-card__labels {
position: absolute;
top: 0px;
right: 8px;
display: flex;
flex-direction: column;
align-items: flex-end;
gap: 0px; /* espace entre rouge et blanc */
line-height: 1;
z-index: 2;
}
.public-card__publish-date {
position: static;
margin-top: -9px; 
}
.public-card__categories-label {
position: static;
margin-top: -29px; 
}
/* Les <p> portent le texte et le fond via ::before */
.public-card__publish-at,
.public-card__categories {
position: relative; /* pour ::before */
display: inline-block;
white-space: nowrap;
padding: 3px 3px;
font-size: 1.1rem;
font-family: 'Barlow Condensed', sans-serif;
font-weight: 700;
line-height: 1;
text-transform: uppercase;
z-index: 1; /* texte au-dessus du fond */
transform-origin: left center;
}
/* Couleurs du texte */
.public-card__publish-at { color: #fff; }
.public-card__categories { color: #6b6b6b; }
/* Fonds derrière le texte */
.public-card__publish-at::before,
.public-card__categories::before {
content: "";
position: absolute;
z-index: -1;
transform-origin: center;
}
/* Rouge: droit (texte et fond alignés) */
.public-card__publish-at {
transform: rotate(0deg);
}
.public-card__publish-at::before {
background: #da291c;
/* Taille du fond autour du texte */
inset: -2px -10px; /* top/bottom, left/right */
transform: none; /* pas d'angle supplémentaire */
}
/* Blanc: incliné dans l’autre sens, texte et fond alignés */
.public-card__categories {
transform: rotate(-2deg); /* ajuste l’angle ici */
}
.public-card__categories::before {
background: #fff;
border: 1px solid rgba(0,0,0,0.12);
box-shadow: 0 2px 0 rgba(0,0,0,0.08);
inset: -4px -12px; /* débords du fond blanc */
transform: none; /* le fond suit la rotation du parent */
}
.public-card__body {
padding: 0.5rem;
position: relative;
}
.public-card__title {
position: relative;
display: inline-block;
margin: 0.5rem auto 1rem;
z-index: 1;
color: black;
letter-spacing: 0;
line-height: 30px;
font-family: 'Barlow Condensed', sans-serif;
font-weight: 400;
font-style: normal;
font-size: 30px;
}
.public-card__content {
position: relative;
overflow: hidden;
height: 100px;
font-weight: 400;
font-family: 'Raleway';
-webkit-text-size-adjust: 100%;
-webkit-font-smoothing: antialiased;
}
a {
color: black;
text-decoration: none;
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
.public-card__header {
/* Variables pour ajuster facilement tailles/couleurs/angle */
--puce-base-w: 100px; /* largeur du rectangle 2 */
--puce-base-h: 44px; /* hauteur du rectangle 2 */
--puce-top-size: 48px; /* taille du retangle 1 */
--puce-angle1: -6deg; /* inclinaison du retangle 1 */
--puce-angle2: -4deg; /* inclinaison du retangle 2 */
--puce-base-color: RGB(226,6,19); /* rouge foncé du rectangle 1 */
--puce-top-color: RGB(177,15,11); /* rouge plus clair du rectangle 2 */
position: relative;
overflow: hidden; /* pour couper ce qui dépasse */
}
/* Rectangle 1 */
.public-card__header::after {
content: "";
position: absolute;
left: 0; 
bottom: 0;
width: var(--puce-top-size);
height: var(--puce-top-size);
background: var(--puce-top-color);
transform-origin: bottom left;
transform: rotate(var(--puce-angle1)) translateY(10px);
box-shadow: 0 4px 0 rgba(0,0,0,0.12);
z-index: 1; /* derrière les labels */
/* opacity: 0.92; opacité de l'élément */
background: rgb(177 15 11 / 0.94);
}

/* Rectangle 2 */
.public-card__header::before {
content: "";
position: absolute;
left: 0;
bottom: 0;
width: var(--puce-base-w);
height: var(--puce-base-h);
background: var(--puce-base-color);
z-index: 1; /* derrière les labels */
transform: rotate(var(--puce-angle2)) translateY(10px);
}

/* Assure que les bandeaux restent au-dessus de la puce */
.public-card__labels { z-index: 2; }
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
      const url = `${baseUrl}/news?${params}`;
      const res = await fetch(url, {
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
  // Mapping des catégories "pme-*" vers leurs libellés "Flash *"
  mapCategory(input) {
    const MAP = {
      'hebdo': 'Hebdo Eco',
      'pme-change': 'Flash Change',
      'pme-dette': 'Flash Dette',
      'pme-placement': 'Flash Placement'
    };

    if (input == null) return null;

    // Normalise en liste de tokens
    let tokens = [];
    if (Array.isArray(input)) {
      tokens = input;
    } else if (typeof input === 'string') {
      tokens = input.split(/[,\s;]+/).filter(Boolean); // "a,b c;d" => ["a","b","c","d"]
    } else {
      return null;
    }

    // 1) Tente le mapping
    for (const raw of tokens) {
      const key = String(raw).toLowerCase().trim();
      if (MAP[key]) return MAP[key];
    }

    // 2) Fallback: renvoie la première catégorie telle quelle
    return tokens.length ? String(tokens).trim() : null;
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
    // On nettoie le texte de tout balisage html
    let cleanedText = extractParagraphText(entity.message);
    // Mapping de la catégorie; si non reconnue, on ne l'affiche pas
    const categoryLabel = this.mapCategory(entity.category_actu);
    return `
<div class="wrapper">
<a class="link" href="${baseUrl}/app/nos-actualites/${entity.id}/${this.slugify(entity.title)}">
<div class="public-card">
<header
class="public-card__header"
style="background-image: url('${entity.img_url || "./news-default.jpg"}')">
<div class="public-card__labels">
<div class="public-card__publish-date">
<p class="public-card__publish-at">
${new Date(entity.publish_at).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' })}
</p>
</div>
${categoryLabel ? `
<div class="public-card__categories-label">
<p class="public-card__categories">
${categoryLabel}
</p>
</div>` : ``}
</div>
</header>
<section class="public-card__body">
<p class="public-card__title">${entity.title}</p>
<div class="public-card__content">${getFirstNLines(cleanedText, 2)}</div>
</section>
</div>
</a>
</div>
`;
  }
  slugify(text) {
    const from = "ãàáäâẽèéëêìíïîõòóöôùúüûñç·/,:;";
    const to = "aaaaaeeeeeiiiiooooouuuunc------";
    for (let i = 0; i < from.length; i++) {
      text = text.replace(new RegExp(from.charAt(i), 'g'), to.charAt(i));
    }
    return text.toLowerCase()
      .trim()
      .replace(/\s+/g, '')
      .replace(/&/g, '-y-')
      .replace(/[^\w-]+/g, '')
      .replace(/--+/g, '_');
  }
}
function extractParagraphText(html) {
  const tempDiv = document.createElement('div');
  tempDiv.innerHTML = html;
  const paragraphs = tempDiv.getElementsByTagName('p');
  let textContent = '';
  for (let p of paragraphs) {
    textContent += p.innerText.trim() + ' ';
  }
  return textContent.trim();
}
function getFirstNLines(text, n) {
  const lines = text.split('.');
  return lines.slice(0, n).join('.');
}
customElements.define('news-widget', NewsWidget);
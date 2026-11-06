
// =========================================
// QUICK BITES - CATÁLOGO
// =========================================

const products = [
  
  {
    name: "Toy Pegao",
    category: "siumai",
    label: "Classic siumai",
    description: "4 unidades de siumai de puerco al vapor.",
    price: "$1.60",
    image: "images/products/FQ.png"
  },
  {
    name: "Fuera de Quincena",
    category: "siumai",
    label: "Classic siumai",
    description: "4 unidades de siumai de puerco al vapor y 1 soda.",
    price: "$2.75",
    image: "images/products/FQ.png"
  },
  {
    name: "Rompe Dieta",
    category: "siumai",
    label: "Classic siumai",
    description: "4 unidades de siumai de puerco frito.",
    price: "$2.00",
    image: "images/products/RD.png"
  },
  {
    name: "Siumai de Camarón",
    category: "siumai",
    label: "Classic Siumai",
    description: "5 unidades de siumai de camarón. Al vapor o frito.",
    price: "$1.50",
    image: "images/products/Camaron.png"
  },
  {
    name: "Ha Kao",
    category: "Dumpling",
    label: "dumpling",
    description: "4 dumplings al vapor con masa translúcida y relleno de camarón.",
    price: "$3.00",
    image: "images/products/Hakao.png"
  },
  {
    name: "Pecado Americano",
    category: "siumai",
    label: "Siumai premium",
    description: "4 unidades de siumai frito de puerco, envuelto con bacon y bañado en salsa de anguila.",
    price: "$3.25",
    image: "images/products/Pecado.png"
  },
  {
    name: "Trompito Loco",
    category: "siumai",
    label: "Siumai premium",
    description: "4 unidades de siumai de puerco. Al vapor o frito, con queso crema y jalea de ají trompito.",
    price: "$3.25",
    image: "images/products/Trompito.png"
  },

  {
    name: "Sodas",
    category: "bebidas",
    label: "Bebidas",
    description: "Coca-Cola, Coca-Cola Zero, Ginger Ale, Fresca y Malta Vigor.",
    price: "$1.00",
    image: "images/products/Sodas.png"
  },
  {
    name: "Agua Cielo",
    category: "bebidas",
    label: "Bebidas",
    description: "Limón, maracuyá, toronja, manzana y fresa kiwi.",
    price: "$1.00",
    image: "images/products/Aguas.jpeg"
  },
  {
    name: "Raptor",
    category: "bebidas",
    label: "Energizante",
    description: "Bebida energizante.",
    price: "$1.25",
    image: "images/products/Raptor.jpeg"
  }
];

// SALSAS: presentación en lista, sin fotografías
const sauces = [
  "Salsa china",
  "Chombasia",
  "Chispotle",
  "Siracha",
  "Ketchup",
  "Picante",
  "Jalea de ají trompito",
  "Salsa de anguila"
];

const productGrid = document.querySelector("#productGrid");
const filterBar = document.querySelector("#filterBar");

// =========================================
// TARJETAS DE PRODUCTOS
// =========================================

function renderProductCard(product) {
  return `
    <article class="product-card">
      <div class="product-image">
        <img
          src="${product.image}"
          alt="${product.name}"
          loading="lazy"
        >
      </div>

      <div class="product-info">
        <span class="product-category">${product.label}</span>

        <h3>${product.name}</h3>

        <p>${product.description}</p>

        <div class="product-bottom">
          <span class="price">${product.price}</span>
          <span class="price-note">QUICK BITES</span>
        </div>
      </div>
    </article>
  `;
}

// =========================================
// LISTA DE SALSAS
// =========================================

function renderSauces() {
  return `
    <section class="sauces-list-card">

      <div class="sauces-list-heading">
        <span class="product-category">Acompañamientos</span>

        <h3>Nuestras <em>salsas</em></h3>

        <p>El toque especial para acompañar tus favoritos.</p>
      </div>

      <ul class="sauces-list">
        ${sauces.map(sauce => `
          <li>
            <span class="sauce-name">
              <span class="sauce-dot"></span>
              ${sauce}
            </span>
          </li>
        `).join("")}
      </ul>

      <p class="sauces-list-note">
        Máximo 2 salsas por combo.
      </p>

    </section>
  `;
}

// =========================================
// MOSTRAR PRODUCTOS Y FILTROS
// =========================================

function renderProducts(filter = "todos") {
  const visibleProducts = filter === "todos"
    ? products
    : products.filter(product => product.category === filter);

  let content = visibleProducts
    .map(renderProductCard)
    .join("");

  if (filter === "todos" || filter === "salsas") {
    content += renderSauces();
  }

  productGrid.innerHTML = content ||
    '<p class="empty-state">Pronto tendremos más opciones en esta categoría.</p>';
}

filterBar.addEventListener("click", event => {
  const button = event.target.closest("button[data-filter]");

  if (!button) return;

  filterBar.querySelectorAll(".filter-button")
    .forEach(item => item.classList.remove("active"));

  button.classList.add("active");

  renderProducts(button.dataset.filter);
});

// =========================================
// MENÚ PARA CELULARES
// =========================================

const menuToggle = document.querySelector("#menuToggle");
const mainNav = document.querySelector("#mainNav");

menuToggle.addEventListener("click", () => {
  const isOpen = mainNav.classList.toggle("open");

  menuToggle.setAttribute("aria-expanded", String(isOpen));
  menuToggle.setAttribute(
    "aria-label",
    isOpen ? "Cerrar menú" : "Abrir menú"
  );

  menuToggle.textContent = isOpen ? "✕" : "☰";
});

mainNav.querySelectorAll("a").forEach(link => {
  link.addEventListener("click", () => {
    mainNav.classList.remove("open");

    menuToggle.setAttribute("aria-expanded", "false");
    menuToggle.setAttribute("aria-label", "Abrir menú");

    menuToggle.textContent = "☰";
  });
});

// =========================================
// AÑO AUTOMÁTICO
// =========================================

document.querySelector("#year").textContent =
  new Date().getFullYear();

// Mostrar catálogo inicial
renderProducts();

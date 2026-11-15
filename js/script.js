
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// ==========================================
// 1. CONEXIÓN CON SUPABASE
// ==========================================

// Copia estos dos valores desde tu archivo admin.js.
// Utiliza únicamente la Publishable Key, nunca la Secret Key.

const SUPABASE_URL = 'https://oqehsdtzonqaaeokvgjr.supabase.co';
const SUPABASE_KEY = 'sb_publishable_3w814YEUj0CEyGO_m8ENPA_7YMoL4kI';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// ==========================================
// 2. ELEMENTOS Y VARIABLES
// ==========================================

const productGrid = document.getElementById('productGrid');
const filterBar = document.getElementById('filterBar');

let products = [];
let sauces = [];
let activeFilter = 'todos';

// ==========================================
// 3. SEGURIDAD: ESCAPAR TEXTO HTML
// ==========================================

function escapeHTML(value) {
    return String(value ?? '').replace(/[&<>"']/g, char => ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;'
    })[char]);
}

// ==========================================
// 4. CARGAR PRODUCTOS DESDE SUPABASE
// ==========================================

async function loadProducts() {
    const { data, error } = await supabase
        .from('products')
        .select(`
            id,
            name,
            description,
            price,
            image_url,
            is_available,
            display_order,
            categories (
                name,
                slug
            )
        `)
        .eq('is_available', true)
        .order('display_order', { ascending: true });

    if (error) {
        console.error('Error cargando productos:', error);
        throw error;
    }

    products = data || [];
}

// ==========================================
// 5. CARGAR SALSAS DESDE SUPABASE
// ==========================================

async function loadSauces() {
    const { data, error } = await supabase
        .from('sauces')
        .select(`
            id,
            name,
            sauce_type,
            is_available,
            display_order
        `)
        .eq('is_available', true)
        .order('display_order', { ascending: true });

    if (error) {
        console.error('Error cargando salsas:', error);
        throw error;
    }

    sauces = data || [];
}

// ==========================================
// 6. MOSTRAR PRODUCTOS
// ==========================================

function renderProducts() {
    if (!productGrid) return;

    const filteredProducts = products.filter(product => {
        if (activeFilter === 'todos' || activeFilter === 'salsas') {
            return true;
        }

        return product.categories?.slug === activeFilter;
    });

    if (activeFilter === 'salsas') {
        productGrid.innerHTML = '';
        renderSauces();
        return;
    }

    const productsHTML = filteredProducts.map(product => {
        const name = escapeHTML(product.name);
        const description = escapeHTML(product.description);
        const category = escapeHTML(product.categories?.name || 'Quick Bites');
        const image = product.image_url
          ? `${SUPABASE_URL}/storage/v1/object/public/Product%20images/${encodeURIComponent(product.image_url)}`
          : '';
          console.log('Imagen:', product.name, image);
        const price = Number(product.price).toFixed(2);

        return `
            <article class="product-card">
                <div class="product-image">
                    ${
                        image
                            ? `<img src="${image}" alt="${name}" loading="lazy">`
                            : `<div class="empty-state">Imagen no disponible</div>`
                    }
                </div>

                <div class="product-info">
                    <span class="product-category">${category}</span>
                    <h3>${name}</h3>
                    <p>${description}</p>

                    <div class="product-bottom">
                        <span class="price">$${price}</span>
                        <span class="price-note">QUICK BITES</span>
                    </div>
                </div>
            </article>
        `;
    }).join('');

    const saucesHTML = activeFilter === 'todos'
        ? getSaucesHTML()
        : '';

    if (!productsHTML && !saucesHTML) {
        productGrid.innerHTML = `
            <div class="empty-state">
                No hay productos disponibles en esta categoría.
            </div>
        `;
        return;
    }

    productGrid.innerHTML = productsHTML + saucesHTML;
}

// ==========================================
// 7. MOSTRAR LISTA DE SALSAS
// ==========================================

function getSaucesHTML() {
    const classicSauces = sauces.filter(
        sauce => sauce.sauce_type === 'clasica'
    );

    const premiumSauces = sauces.filter(
        sauce => sauce.sauce_type === 'premium'
    );

    if (classicSauces.length === 0 && premiumSauces.length === 0) {
        return '';
    }

    function createSauceItems(list) {
        return list.map(sauce => `
            <li>
                <span class="sauce-dot"></span>
                <span class="sauce-name">${escapeHTML(sauce.name)}</span>
                <span class="sauce-availability">Disponible</span>
            </li>
        `).join('');
    }

    return `
        <section class="sauces-list-card">
            <div class="sauce-groups">

                <div class="sauce-group">
                    <h3>Salsas clásicas</h3>
                    <ul class="sauces-list">
                        ${createSauceItems(classicSauces)}
                    </ul>
                </div>

                <div class="sauce-group">
                    <h3>Salsas premium</h3>
                    <ul class="sauces-list">
                        ${createSauceItems(premiumSauces)}
                    </ul>
                </div>

            </div>

            <p class="sauces-list-note">
                Máximo 2 salsas por combo. Extra: Salsa clasica: $0.10 | Salsa premium: $0.25
            </p>
        </section>
    `;
}

function renderSauces() {
    if (!productGrid) return;

    const html = getSaucesHTML();

    productGrid.innerHTML = html || `
        <div class="empty-state">
            No hay salsas disponibles actualmente.
        </div>
    `;
}

// ==========================================
// 8. FILTROS DEL MENÚ
// ==========================================

if (filterBar) {
    filterBar.addEventListener('click', event => {
        const button = event.target.closest('.filter-button');

        if (!button) return;

        activeFilter = button.dataset.filter;

        filterBar.querySelectorAll('.filter-button').forEach(item => {
            item.classList.remove('active');
        });

        button.classList.add('active');

        renderProducts();
    });
}

// ==========================================
// 9. MENÚ DE NAVEGACIÓN PARA CELULARES
// ==========================================

const menuToggle = document.getElementById('menuToggle');
const mainNav = document.getElementById('mainNav');

if (menuToggle && mainNav) {
    menuToggle.addEventListener('click', () => {
        const isOpen = mainNav.classList.toggle('open');

        menuToggle.setAttribute('aria-expanded', isOpen);
        menuToggle.textContent = isOpen ? '✕' : '☰';
    });

    mainNav.querySelectorAll('a').forEach(link => {
        link.addEventListener('click', () => {
            mainNav.classList.remove('open');
            menuToggle.setAttribute('aria-expanded', 'false');
            menuToggle.textContent = '☰';
        });
    });
}

// ==========================================
// 10. AÑO AUTOMÁTICO DEL FOOTER
// ==========================================

const yearElement = document.getElementById('year');

if (yearElement) {
    yearElement.textContent = new Date().getFullYear();
}

// ==========================================
// 11. INICIAR MENÚ
// ==========================================

async function initializeMenu() {
    if (productGrid) {
        productGrid.innerHTML = `
            <div class="empty-state">
                Cargando el menú de Quick Bites...
            </div>
        `;
    }

    try {
        await Promise.all([
            loadProducts(),
            loadSauces()
        ]);

        renderProducts();
        setupRealtimeSubscriptions();

        console.log('Quick Bites conectado correctamente con Supabase.');
    } catch (error) {
        console.error('No se pudo cargar el menú:', error);

        if (productGrid) {
            productGrid.innerHTML = `
                <div class="empty-state">
                    No pudimos cargar el menú.
                    Intenta actualizar la página.
                </div>
            `;
        }
    }
}

function setupRealtimeSubscriptions() {
    const channel = supabase
        .channel('quick-bites-live-menu')

        // Escuchar cambios en productos
        .on(
            'postgres_changes',
            {
                event: '*',
                schema: 'public',
                table: 'products'
            },
            async (payload) => {
                console.log('Cambio detectado en productos:', payload);

                try {
                    await loadProducts();
                    renderProducts();
                    console.log('Menú de productos actualizado.');
                } catch (error) {
                    console.error('Error actualizando productos:', error);
                }
            }
        )

        // Escuchar cambios en salsas
        .on(
            'postgres_changes',
            {
                event: '*',
                schema: 'public',
                table: 'sauces'
            },
            async (payload) => {
                console.log('Cambio detectado en salsas:', payload);

                try {
                    await loadSauces();
                    renderProducts();
                    console.log('Menú de salsas actualizado.');
                } catch (error) {
                    console.error('Error actualizando salsas:', error);
                }
            }
        )

        .subscribe((status) => {
            console.log('Estado de sincronización:', status);
        });
}

initializeMenu();


import { createClient } from
    'https://esm.sh/@supabase/supabase-js@2';

// ======================================
// CONFIGURACIÓN DE SUPABASE
// ======================================

const SUPABASE_URL = 'https://oqehsdtzonqaaeokvgjr.supabase.co';
const SUPABASE_KEY = 'sb_publishable_3w814YEUj0CEyGO_m8ENPA_7YMoL4kI';

const supabase = createClient(
    SUPABASE_URL,
    SUPABASE_KEY
);

// ======================================
// ELEMENTOS DEL LOGIN
// ======================================

const loginForm = document.getElementById('loginForm');
const loginButton = document.getElementById('loginButton');
const statusMessage = document.getElementById('statusMessage');

function showMessage(message, color = '#851923') {
    statusMessage.textContent = message;
    statusMessage.style.color = color;
}

// ======================================
// COMPROBAR SI ES ADMINISTRADOR
// ======================================

async function verifyAdmin(user) {
    const { data, error } = await supabase
        .from('admin_users')
        .select('user_id')
        .eq('user_id', user.id)
        .maybeSingle();

    if (error) {
        throw error;
    }

    return Boolean(data);
}

// ======================================
// INICIAR SESIÓN
// ======================================

loginForm.addEventListener('submit', async (event) => {
    event.preventDefault();

    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;

    loginButton.disabled = true;
    loginButton.textContent = 'Verificando...';

    showMessage('Comprobando tus credenciales...');

    try {
        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password
        });

        if (error) throw error;

        const isAdmin = await verifyAdmin(data.user);

        if (!isAdmin) {
            await supabase.auth.signOut();
            throw new Error('Esta cuenta no tiene permisos de administrador.');
        }

        showMessage(
            '¡Acceso autorizado! Bienvenido a Quick Bites.',
            '#27865b'
        );

        document.getElementById('loginForm').closest('main').querySelector('form').hidden = true;
        document.getElementById('dashboard').hidden = false;

        await loadDashboard();

        // En el siguiente paso conectaremos el dashboard.
        
    } catch (error) {
        showMessage(error.message);
        loginButton.disabled = false;
        loginButton.textContent = 'Iniciar sesión';
    }
});

// ======================================
// COMPROBAR SESIÓN EXISTENTE
// ======================================

async function checkExistingSession() {
    const { data: { session }, error } = await supabase.auth.getSession();

    if (error) {
        showMessage('No se pudo comprobar la sesión.');
        return;
    }

    if (!session) return;

    try {
        const isAdmin = await verifyAdmin(session.user);

        if (isAdmin) {
            document.getElementById('loginForm').hidden = true;
            document.getElementById('dashboard').hidden = false;

            showMessage('Sesión de administrador activa.', '#27865b');

            await loadDashboard();
        } else {
            await supabase.auth.signOut();
            showMessage('Tu cuenta no tiene permisos de administrador.');
        }
    } catch (error) {
        showMessage('No se pudo verificar la sesión: ' + error.message);
    }
}

checkExistingSession();
async function loadDashboard() {
    await Promise.all([
        loadCategories(),
        loadProducts(),
        loadSauces()
    ]);
}
// CARGAR CATEGORÍAS
async function loadCategories() {
    const categorySelect = document.getElementById('productCategory');

    const { data, error } = await supabase
        .from('categories')
        .select('id, name')
        .order('display_order');

    if (error) {
        console.error('Error al cargar categorías:', error.message);
        return;
    }

    categorySelect.innerHTML =
        '<option value="">Selecciona una categoría</option>';

    data.forEach(category => {
        const option = document.createElement('option');
        option.value = category.id;
        option.textContent = category.name;
        categorySelect.appendChild(option);
    });
}
async function loadProducts() {
    const productsList = document.getElementById('productsList');

    productsList.innerHTML = '<p>Cargando productos...</p>';

    const { data, error } = await supabase
        .from('products')
        .select('*, categories(name)')
        .order('display_order');

    if (error) {
        productsList.textContent = 'Error al cargar productos: ' + error.message;
        return;
    }

    if (!data || data.length === 0) {
        productsList.innerHTML = '<p>No hay productos registrados.</p>';
        return;
    }

    productsList.innerHTML = data.map(product => `
        <article class="product-item">
            <div>
                <h3>${escapeHTML(product.name)}</h3>
                <p>${escapeHTML(product.categories?.name || 'Sin categoría')}</p>
                <strong>$${Number(product.price).toFixed(2)}</strong>
            </div>
            <div class="product-actions">
                <button
                    type="button"
                    class="edit-price-button"
                    data-product-id="${product.id}"
                    data-price="${product.price}"
                >
                    Editar precio
                </button>

                <button
                    type="button"
                    class="availability-toggle ${product.is_available ? 'available' : 'unavailable'}"
                    data-product-id="${product.id}"
                    data-available="${product.is_available}"
                >
                    ${product.is_available ? 'Desactivar' : 'Activar'}
                </button>
                <button
                    type="button"
                    class="delete-product-button"
                    data-product-id="${product.id}"
                    data-product-name="${escapeHTML(product.name)}"
                >
                    Eliminar
                </button>
            </div>
        </article>
    `).join('');
}
async function loadSauces() {
    const saucesList = document.getElementById('saucesList');

    saucesList.innerHTML = '<p>Cargando salsas...</p>';

    const { data, error } = await supabase
        .from('sauces')
        .select('*')
        .order('display_order');

    if (error) {
        saucesList.textContent = 'Error al cargar salsas: ' + error.message;
        return;
    }

    if (!data || data.length === 0) {
        saucesList.innerHTML = '<p>No hay salsas registradas.</p>';
        return;
    }

    saucesList.innerHTML = data.map(sauce => `
        <article class="product-item">
            <div>
                <h3>${escapeHTML(sauce.name)}</h3>
                <p>${sauce.sauce_type === 'clasica' ? 'Clásica' : 'Premium'}</p>
            </div>
            <span class="availability ${sauce.is_available ? 'available' : 'unavailable'}">
                ${sauce.is_available ? 'Disponible' : 'No disponible'}
            </span>
        </article>
    `).join('');
}
function escapeHTML(value) {
    return String(value ?? '').replace(/[&<>"']/g, char => ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;'
    })[char]);
}

// NAVEGACIÓN DEL DASHBOARD
document.querySelectorAll('.nav-button').forEach(button => {
    button.addEventListener('click', () => {
        const sectionId = button.dataset.section;

        document.querySelectorAll('.dashboard-section').forEach(section => {
            section.hidden = section.id !== sectionId;
        });

        document.querySelectorAll('.nav-button').forEach(navButton => {
            navButton.classList.toggle('active', navButton === button);
        });
    });
});

// CERRAR SESIÓN
document.getElementById('logoutButton').addEventListener('click', async () => {
    const { error } = await supabase.auth.signOut();

    if (error) {
        alert('No se pudo cerrar la sesión: ' + error.message);
        return;
    }

    document.getElementById('dashboard').hidden = true;
    document.getElementById('loginForm').hidden = false;

    document.getElementById('loginForm').reset();

    loginButton.disabled = false;
    loginButton.textContent = 'Iniciar sesión';

    showMessage('Sesión cerrada correctamente.');
});
// ACTIVAR Y DESACTIVAR PRODUCTOS
document.getElementById('productsList').addEventListener('click', async (event) => {
    const button = event.target.closest('.availability-toggle');

    if (!button) return;

    const productId = button.dataset.productId;
    const currentStatus = button.dataset.available === 'true';
    const newStatus = !currentStatus;

    const action = newStatus ? 'activar' : 'desactivar';

    const confirmed = confirm(
        `¿Estás seguro de que deseas ${action} este producto?`
    );

    if (!confirmed) return;

    button.disabled = true;
    button.textContent = 'Guardando...';

    const { error } = await supabase
        .from('products')
        .update({ is_available: newStatus })
        .eq('id', productId);

    if (error) {
        alert('No se pudo actualizar el producto: ' + error.message);
        await loadProducts();
        return;
    }

    await loadProducts();
});

// EDITAR PRECIO DE PRODUCTOS
document.getElementById('productsList').addEventListener('click', async (event) => {
    const button = event.target.closest('.edit-price-button');

    if (!button) return;

    const productId = button.dataset.productId;
    const currentPrice = button.dataset.price;

    const newPrice = prompt(
        `Precio actual: $${Number(currentPrice).toFixed(2)}\n\nIntroduce el nuevo precio:`,
        currentPrice
    );

    if (newPrice === null) return;

    const price = Number(newPrice);

    if (newPrice.trim() === '' || !Number.isFinite(price) || price <= 0) {
        alert('Introduce un precio válido mayor que cero.');
        return;
    }

    button.disabled = true;
    button.textContent = 'Guardando...';

    const { error } = await supabase
        .from('products')
        .update({ price: price })
        .eq('id', productId);

    if (error) {
        alert('No se pudo actualizar el precio: ' + error.message);
        await loadProducts();
        return;
    }

    await loadProducts();
    alert('¡Precio actualizado correctamente!');
});
// MOSTRAR FORMULARIO DE PRODUCTO
document.getElementById('addProductButton').addEventListener('click', () => {
    const form = document.getElementById('productForm');

    form.hidden = false;
    form.reset();

    document.getElementById('productFormMessage').textContent = '';
    form.scrollIntoView({ behavior: 'smooth', block: 'center' });
});

// CANCELAR REGISTRO
document.getElementById('cancelProductButton').addEventListener('click', () => {
    document.getElementById('productForm').hidden = true;
    document.getElementById('productForm').reset();
});
// GUARDAR NUEVO PRODUCTO
// GUARDAR NUEVO PRODUCTO
document.getElementById('productForm').addEventListener('submit', async (event) => {
    event.preventDefault();

    const name = document.getElementById('productName').value.trim();
    const description = document.getElementById('productDescription').value.trim();
    const price = Number(document.getElementById('productPrice').value);
    const categoryId = document.getElementById('productCategory').value;
    const file = productImageInput.files[0] || null;

    const message = document.getElementById('productFormMessage');
    const saveButton = document.getElementById('saveProductButton');

    if (!name || !categoryId || !Number.isFinite(price) || price <= 0) {
        message.textContent = 'Completa los campos obligatorios correctamente.';
        return;
    }

    if (file && (
        !['image/jpeg', 'image/png', 'image/webp'].includes(file.type) ||
        file.size > 5 * 1024 * 1024
    )) {
        message.textContent = 'La imagen debe ser JPG, PNG o WEBP y pesar máximo 5 MB.';
        return;
    }

    saveButton.disabled = true;
    saveButton.textContent = 'Guardando...';
    message.textContent = 'Registrando producto...';

    let imagePath = null;

    try {
        let imageUrl = null;

        // SUBIR FOTOGRAFÍA A SUPABASE STORAGE
        if (file) {
            message.textContent = 'Subiendo fotografía...';

            const extension = file.name.split('.').pop().toLowerCase();
            imagePath = `products/${crypto.randomUUID()}.${extension}`;

            const { error: uploadError } = await supabase
                .storage
                .from('product-images')
                .upload(imagePath, file, {
                    contentType: file.type,
                    upsert: false
                });

            if (uploadError) throw uploadError;

            const { data: publicData } = supabase
                .storage
                .from('product-images')
                .getPublicUrl(imagePath);

            imageUrl = publicData.publicUrl;
        }

        // REGISTRAR PRODUCTO EN LA BASE DE DATOS
        const slug = name
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-|-$/g, '') + '-' + Date.now();

        const { error: insertError } = await supabase
            .from('products')
            .insert({
                name,
                slug,
                description: description || null,
                price,
                category_id: categoryId,
                image_url: imageUrl,
                is_available: true,
                display_order: 999
            });

        if (insertError) throw insertError;

        message.textContent = '¡Producto y fotografía registrados correctamente!';

        document.getElementById('productForm').reset();

        imagePreview.hidden = true;
        previewImage.removeAttribute('src');

        if (selectedImageUrl) {
            URL.revokeObjectURL(selectedImageUrl);
            selectedImageUrl = null;
        }

        await loadProducts();

    } catch (error) {
        // Si falla el registro, eliminar la fotografía que se había subido
        if (imagePath) {
            await supabase.storage
                .from('product-images')
                .remove([imagePath]);
        }

        message.textContent = 'Error al guardar: ' + error.message;

    } finally {
        saveButton.disabled = false;
        saveButton.textContent = 'Guardar producto';
    }
});

// ELIMINAR PRODUCTOS
document.getElementById('productsList').addEventListener('click', async (event) => {
    const button = event.target.closest('.delete-product-button');

    if (!button) return;

    const productId = button.dataset.productId;
    const productName = button.dataset.productName;

    const confirmed = confirm(
        `¿Estás seguro de que deseas eliminar "${productName}"?\n\nEsta acción no se puede deshacer.`
    );

    if (!confirmed) return;

    button.disabled = true;
    button.textContent = 'Eliminando...';

    const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', productId);

    if (error) {
        alert('No se pudo eliminar el producto: ' + error.message);
        await loadProducts();
        return;
    }

    await loadProducts();

    alert('Producto eliminado correctamente.');
});
// VISTA PREVIA DE IMAGEN
const productImageInput = document.getElementById('productImage');
const imagePreview = document.getElementById('imagePreview');
const previewImage = document.getElementById('previewImage');

let selectedImageUrl = null;

productImageInput.addEventListener('change', () => {
    const file = productImageInput.files[0];

    if (selectedImageUrl) {
        URL.revokeObjectURL(selectedImageUrl);
        selectedImageUrl = null;
    }

    imagePreview.hidden = true;

    if (!file) return;

    const allowedTypes = [
        'image/jpeg',
        'image/png',
        'image/webp'
    ];

    if (!allowedTypes.includes(file.type)) {
        alert('Selecciona una imagen JPG, PNG o WEBP.');
        productImageInput.value = '';
        return;
    }

    if (file.size > 5 * 1024 * 1024) {
        alert('La imagen no puede superar los 5 MB.');
        productImageInput.value = '';
        return;
    }

    selectedImageUrl = URL.createObjectURL(file);
    previewImage.src = selectedImageUrl;
    imagePreview.hidden = false;
});
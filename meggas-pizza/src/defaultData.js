// src/defaultData.js — MEJORA 2: incluye defaultVariants
export const defaultCategories = [
  { id: "pizzas",       name: "Pizzas",       icon: "🍕", type: "pizza",  order: 1, active: true },
  { id: "hamburguesas", name: "Hamburguesas", icon: "🍔", type: "simple", order: 2, active: true },
  { id: "bebidas",      name: "Bebidas",      icon: "🧃", type: "simple", order: 3, active: true },
  { id: "salchipapas",  name: "Salchipapas",  icon: "🍟", type: "simple", order: 4, active: true },
];

export const defaultProducts = [
  // ── PIZZAS ──
  { id: "p-margarita",  categoryId: "pizzas", name: "Margarita",           description: "Salsa de tomate, queso mozzarella, albahaca fresca",                     active: true, order: 1  },
  { id: "p-pepperoni",  categoryId: "pizzas", name: "Pepperoni",           description: "Salsa artesanal de la casa, pepperoni y queso",                          active: true, order: 2  },
  { id: "p-bbq",        categoryId: "pizzas", name: "Pollo BBQ",           description: "Salsa BBQ, pollo a la plancha, queso, cebolla caramelizada",             active: true, order: 3  },
  { id: "p-hawaina",    categoryId: "pizzas", name: "Hawaiana",            description: "Jamón, piña, queso doble, salsa artesanal",                              active: true, order: 4  },
  { id: "p-4quesos",    categoryId: "pizzas", name: "4 Quesos",            description: "Mozzarella, parmesano, cheddar y queso crema",                           active: true, order: 5  },
  { id: "p-mexicana",   categoryId: "pizzas", name: "Mexicana",            description: "Tocineta, maíz, jalapeño, tostacós y salsa especial",                    active: true, order: 6  },
  { id: "p-carnivora",  categoryId: "pizzas", name: "Carnívora",           description: "Carne molida, tocineta, chorizo, jamón y queso doble",                   active: true, order: 7  },
  { id: "p-veggie",     categoryId: "pizzas", name: "Vegetariana",         description: "Champiñones, pimentón, cebolla, tomate cherry, espinaca y queso",        active: true, order: 8  },
  { id: "p-casa",       categoryId: "pizzas", name: "Especial de la casa", description: "Receta secreta del chef — tocineta, champiñón, queso y salsa artesanal", active: true, order: 9  },
  { id: "p-criolla",    categoryId: "pizzas", name: "Criolla",             description: "Maíz tierno, papa criolla, hogao, queso campesino",                      active: true, order: 10 },

  // ── HAMBURGUESAS ──
  { id: "h-clasica",  categoryId: "hamburguesas", name: "Clásica",       description: "Carne 120g, lechuga, tomate, cebolla, salsa especial",         price: 14000, active: true, order: 1 },
  { id: "h-doble",    categoryId: "hamburguesas", name: "Doble Carne",   description: "Doble carne 240g, queso cheddar, tocineta, papas chip",         price: 20000, active: true, order: 2 },
  { id: "h-pollo",    categoryId: "hamburguesas", name: "Pollo Crispy",  description: "Pechuga apanada, lechuga, tomate, mayonesa de ajo",             price: 16000, active: true, order: 3 },
  { id: "h-bbq",      categoryId: "hamburguesas", name: "BBQ Especial",  description: "Carne, tocineta, cebolla caramelizada, queso, salsa BBQ",       price: 19000, active: true, order: 4 },
  { id: "h-veggie",   categoryId: "hamburguesas", name: "Veggie Burger", description: "Hamburguesa de lentejas, aguacate, tomate, lechuga",            price: 15000, active: true, order: 5 },

  // ── BEBIDAS ──
  { id: "b-gaseosa",    categoryId: "bebidas", name: "Gaseosa 350ml",    description: "Coca-Cola, Sprite, Manzana o Colombiana",  price: 3500,  active: true, order: 1 },
  { id: "b-gaseosa-lt", categoryId: "bebidas", name: "Gaseosa 1.5L",     description: "Coca-Cola, Sprite o Manzana",              price: 7000,  active: true, order: 2 },
  { id: "b-jugo",       categoryId: "bebidas", name: "Jugo Natural",     description: "Lulo, maracuyá, mango, mora o guanábana",  price: 5000,  active: true, order: 3 },
  { id: "b-limonada",   categoryId: "bebidas", name: "Limonada de Coco", description: "Limonada con leche de coco y hielo",       price: 6000,  active: true, order: 4 },
  { id: "b-agua",       categoryId: "bebidas", name: "Agua 600ml",       description: "Con o sin gas",                            price: 2500,  active: true, order: 5 },
  { id: "b-cerveza",    categoryId: "bebidas", name: "Cerveza",          description: "Águila, Club Colombia o Heineken",         price: 5500,  active: true, order: 6 },

  // ── SALCHIPAPAS ──
  { id: "s-sencilla", categoryId: "salchipapas", name: "Sencilla",   description: "Papas fritas, salchicha, mostaza y kétchup",                price: 11000, active: true, order: 1 },
  { id: "s-especial", categoryId: "salchipapas", name: "Especial",   description: "Papas, salchicha, tocineta, queso fundido y salsas",        price: 15000, active: true, order: 2 },
  { id: "s-pollo",    categoryId: "salchipapas", name: "Con Pollo",  description: "Papas, pollo al ajillo, queso parmesano, salsa rosada",     price: 14000, active: true, order: 3 },
  { id: "s-mixta",    categoryId: "salchipapas", name: "Mixta XXL",  description: "Papas, salchicha, pollo, tocineta, 3 salsas y queso doble", price: 22000, active: true, order: 4 },
];

export const defaultSizes = [
  { id: "fam", label: "Familiar", porciones: "10 porciones", price: 55000, allowHalf: true,  order: 1 },
  { id: "med", label: "Mediana",  porciones: "8 porciones",  price: 34000, allowHalf: true,  order: 2 },
  { id: "peq", label: "Pequeña",  porciones: "4 porciones",  price: 16000, allowHalf: true,  order: 3 },
  { id: "por", label: "Porción",  porciones: "1 porción",    price: 5500,  allowHalf: false, order: 4 },
];

// ── VARIANTES ─────────────────────────────────────────────────────────────────
// Estructura: { id, categoryId, productId (null = aplica a toda la categoría),
//               label, required, active, options: [{id, label, active}] }
export const defaultVariants = [
  {
    id: "var-bebida-sabor",
    categoryId: "bebidas",
    productId: "b-gaseosa",          // solo aplica a Gaseosa 350ml
    label: "Sabor",
    required: true,
    active: true,
    options: [
      { id: "opt-coca",       label: "Coca-Cola",   active: true },
      { id: "opt-sprite",     label: "Sprite",      active: true },
      { id: "opt-manzana",    label: "Manzana",     active: true },
      { id: "opt-colombiana", label: "Colombiana",  active: true },
    ],
  },
  {
    id: "var-bebida-sabor-lt",
    categoryId: "bebidas",
    productId: "b-gaseosa-lt",       // solo aplica a Gaseosa 1.5L
    label: "Sabor",
    required: true,
    active: true,
    options: [
      { id: "opt-lt-coca",    label: "Coca-Cola", active: true },
      { id: "opt-lt-sprite",  label: "Sprite",    active: true },
      { id: "opt-lt-manzana", label: "Manzana",   active: true },
    ],
  },
  {
    id: "var-jugo-sabor",
    categoryId: "bebidas",
    productId: "b-jugo",             // solo aplica a Jugo Natural
    label: "Sabor del jugo",
    required: true,
    active: true,
    options: [
      { id: "opt-lulo",       label: "Lulo",      active: true },
      { id: "opt-maracuya",   label: "Maracuyá",  active: true },
      { id: "opt-mango",      label: "Mango",     active: true },
      { id: "opt-mora",       label: "Mora",      active: true },
      { id: "opt-guanabana",  label: "Guanábana", active: true },
    ],
  },
  {
    id: "var-agua-gas",
    categoryId: "bebidas",
    productId: "b-agua",
    label: "Tipo",
    required: true,
    active: true,
    options: [
      { id: "opt-agua-sin", label: "Sin gas", active: true },
      { id: "opt-agua-con", label: "Con gas", active: true },
    ],
  },
  {
    id: "var-cerveza-marca",
    categoryId: "bebidas",
    productId: "b-cerveza",
    label: "Marca",
    required: true,
    active: true,
    options: [
      { id: "opt-aguila",    label: "Águila",       active: true },
      { id: "opt-club",      label: "Club Colombia", active: true },
      { id: "opt-heineken",  label: "Heineken",     active: true },
    ],
  },
  {
    id: "var-hamburguesa-termino",
    categoryId: "hamburguesas",
    productId: null,                  // aplica a TODAS las hamburguesas
    label: "Término de la carne",
    required: false,
    active: true,
    options: [
      { id: "opt-medio",    label: "Término medio", active: true },
      { id: "opt-3cuartos", label: "3/4",           active: true },
      { id: "opt-bien",     label: "Bien cocida",   active: true },
    ],
  },
  {
    id: "var-salchipapa-salsas",
    categoryId: "salchipapas",
    productId: null,                  // aplica a TODAS las salchipapas
    label: "Salsas",
    required: false,
    active: true,
    options: [
      { id: "opt-ketchup",   label: "Kétchup",      active: true },
      { id: "opt-mostaza",   label: "Mostaza",      active: true },
      { id: "opt-mayo",      label: "Mayonesa",     active: true },
      { id: "opt-rosada",    label: "Salsa rosada", active: true },
      { id: "opt-bbq-s",     label: "BBQ",          active: true },
      { id: "opt-pico",      label: "Picante",      active: true },
    ],
  },
];

export const defaultAdditions = [
  { id: "add-queso",     name: "Extra queso",   price: 2000, categoryIds: ["pizzas", "hamburguesas", "salchipapas"], active: true, order: 1 },
  { id: "add-tocineta",  name: "Tocineta extra", price: 3000, categoryIds: ["pizzas", "hamburguesas", "salchipapas"], active: true, order: 2 },
  { id: "add-carne",     name: "Doble carne",   price: 4000, categoryIds: ["hamburguesas", "salchipapas"], active: true, order: 3 },
  { id: "add-borde",     name: "Borde relleno", price: 4000, categoryIds: ["pizzas"], active: true, order: 4 },
  { id: "add-aguacate",  name: "Aguacate",      price: 2000, categoryIds: ["hamburguesas"], active: true, order: 5 },
  { id: "add-papas",     name: "Papas extra",   price: 3000, categoryIds: ["hamburguesas", "salchipapas"], active: true, order: 6 },
];

// NOTA: ya no incluye "adminPassword" — el acceso del dueño ahora es con
// Firebase Auth real (correo + contraseña, ver signupOwner/loginOwner en
// AppContext.js). "kitchenPassword" sigue siendo contraseña simple a propósito.
export const defaultConfig = {
  negocio:          "🍕 Demo — Sistema de Pedidos",
  telefono:         "300 000 0000",
  domicilio:        3000,
  kitchenPassword:  "cocina2024",
  mensaje_whatsapp: "Hola 👋 Bienvenido a nuestro sistema de pedidos. Haz tu pedido aquí 🍕",
};

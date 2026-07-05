// src/defaultData.js — Megga's Pizza (menú real + variantes del demo)

export const defaultCategories = [
  { id: "pizzas",       name: "Pizzas",       icon: "🍕", type: "pizza",  order: 1, active: true },
  { id: "hamburguesas", name: "Hamburguesas", icon: "🍔", type: "simple", order: 2, active: true },
  { id: "bebidas",      name: "Bebidas",      icon: "🧃", type: "simple", order: 3, active: true },
  { id: "salchipapas",  name: "Salchipapas",  icon: "🍟", type: "simple", order: 4, active: true },
];

export const defaultProducts = [
  // PIZZAS — sin precio propio, usan tabla de tamaños
  { id: "jamon",     categoryId: "pizzas", name: "Jamón",              description: "Salsa artesanal de la casa, queso",                                         active: true, order: 1 },
  { id: "carnes",    categoryId: "pizzas", name: "Carnes",             description: "Cavano, jamón, queso",                                                      active: true, order: 2 },
  { id: "chorizo",   categoryId: "pizzas", name: "Chorizo",            description: "Salsa artesanal, tocineta, maíz, chorizo, queso",                           active: true, order: 3 },
  { id: "casa",      categoryId: "pizzas", name: "Pizza de la casa",   description: "Tocineta, jamón ahumado, chorizo, maíz, salsa artesanal",                   active: true, order: 4 },
  { id: "hambur",    categoryId: "pizzas", name: "Hamburguesa",        description: "Carne, salsa artesanal, papas chips, BBQ, queso, tocineta, maíz",           active: true, order: 5 },
  { id: "venezol",   categoryId: "pizzas", name: "Venezolana",         description: "Pepperoni, pimentón, cebolla, jamón, maíz, salsa artesanal",                active: true, order: 6 },
  { id: "dorilocos", categoryId: "pizzas", name: "Dorilocos",          description: "Doritos, maíz, pollo, carne, salsa de maíz, salsa artesanal, BBQ, queso",  active: true, order: 7 },
  { id: "costillas", categoryId: "pizzas", name: "Costillas de cerdo", description: "Tocineta, maíz, queso, salsa artesanal de la casa",                        active: true, order: 8 },
  { id: "mexicana",  categoryId: "pizzas", name: "Mexicana",           description: "Tocineta, maíz, jalapeño, tostacós",                                       active: true, order: 9 },
  { id: "pollobb",   categoryId: "pizzas", name: "Pollo BBQ",          description: "Salsa BBQ, queso, salsa artesanal de la casa",                              active: true, order: 10 },
  { id: "tocineta",  categoryId: "pizzas", name: "Tocineta",           description: "Base de carne, salsa artesanal de la casa, queso",                         active: true, order: 11 },
  { id: "hawaina",   categoryId: "pizzas", name: "Hawaiana",           description: "Piña, jamón, queso, salsa artesanal de la casa",                           active: true, order: 12 },
  { id: "champion",  categoryId: "pizzas", name: "Champiñón",          description: "Pollo, queso",                                                             active: true, order: 13 },
  { id: "criolla",   categoryId: "pizzas", name: "Criolla",            description: "Maíz tierno, queso, salsa artesanal de la casa",                           active: true, order: 14 },
  { id: "paisa",     categoryId: "pizzas", name: "Paisa",              description: "Tocineta, chicharrón, carne de res, carne de cerdo, maíz, salsa artesanal",active: true, order: 15 },
  { id: "peperoni",  categoryId: "pizzas", name: "Pepperoni",          description: "Salsa de la casa y queso",                                                 active: true, order: 16 },

  // HAMBURGUESAS — precio propio
  { id: "hbq-sencilla",  categoryId: "hamburguesas", name: "Hamburguesa Sencilla",  description: "Carne, queso, lechuga, tomate, salsa",           price: 15000, active: true, order: 1 },
  { id: "hbq-especial",  categoryId: "hamburguesas", name: "Hamburguesa Especial",  description: "Doble carne, tocineta, queso, papas chips",       price: 22000, active: true, order: 2 },
  { id: "hbq-pollo",     categoryId: "hamburguesas", name: "Hamburguesa de Pollo",  description: "Pechuga, queso, lechuga, tomate, mayonesa",       price: 18000, active: true, order: 3 },

  // BEBIDAS — precio propio
  { id: "beb-gaseosa",   categoryId: "bebidas", name: "Gaseosa 350ml",   description: "Coca-Cola, Sprite, Manzana",  price: 3500,  active: true, order: 1 },
  { id: "beb-jugo",      categoryId: "bebidas", name: "Jugo Natural",    description: "Lulo, maracuyá, mango",       price: 5000,  active: true, order: 2 },
  { id: "beb-agua",      categoryId: "bebidas", name: "Agua 600ml",      description: "Con o sin gas",               price: 2500,  active: true, order: 3 },
  { id: "beb-cerveza",   categoryId: "bebidas", name: "Cerveza",         description: "Águila, Club Colombia",       price: 5500,  active: true, order: 4 },

  // SALCHIPAPAS — precio propio
  { id: "salchi-senc",   categoryId: "salchipapas", name: "Salchipapa Sencilla",  description: "Papas, salchicha, salsas",                  price: 12000, active: true, order: 1 },
  { id: "salchi-esp",    categoryId: "salchipapas", name: "Salchipapa Especial",  description: "Papas, salchicha, tocineta, queso, salsas", price: 16000, active: true, order: 2 },
  { id: "salchi-pollo",  categoryId: "salchipapas", name: "Salchipapa con Pollo", description: "Papas, pollo, queso, salsas",               price: 15000, active: true, order: 3 },
];

export const defaultSizes = [
  { id: "fam", label: "Familiar", porciones: "10 porciones", price: 55000, allowHalf: true,  order: 1 },
  { id: "med", label: "Mediana",  porciones: "8 porciones",  price: 34000, allowHalf: true,  order: 2 },
  { id: "peq", label: "Pequeña",  porciones: "4 porciones",  price: 16000, allowHalf: false, order: 3 },
  { id: "por", label: "Porción",  porciones: "1 porción",    price: 5500,  allowHalf: false, order: 4 },
];

export const defaultVariants = [
  {
    id: "var-bebida-sabor",
    categoryId: "bebidas",
    productId: "beb-gaseosa",
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
    id: "var-jugo-sabor",
    categoryId: "bebidas",
    productId: "beb-jugo",
    label: "Sabor del jugo",
    required: true,
    active: true,
    options: [
      { id: "opt-lulo",     label: "Lulo",     active: true },
      { id: "opt-maracuya", label: "Maracuyá", active: true },
      { id: "opt-mango",    label: "Mango",    active: true },
    ],
  },
  {
    id: "var-agua-gas",
    categoryId: "bebidas",
    productId: "beb-agua",
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
    productId: "beb-cerveza",
    label: "Marca",
    required: true,
    active: true,
    options: [
      { id: "opt-aguila", label: "Águila",       active: true },
      { id: "opt-club",   label: "Club Colombia", active: true },
    ],
  },
  {
    id: "var-hamburguesa-termino",
    categoryId: "hamburguesas",
    productId: null,
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
    productId: null,
    label: "Salsas",
    required: false,
    active: true,
    options: [
      { id: "opt-ketchup", label: "Kétchup",      active: true },
      { id: "opt-mostaza", label: "Mostaza",      active: true },
      { id: "opt-mayo",    label: "Mayonesa",     active: true },
      { id: "opt-rosada",  label: "Salsa rosada", active: true },
      { id: "opt-bbq-s",   label: "BBQ",          active: true },
      { id: "opt-pico",    label: "Picante",      active: true },
    ],
  },
];

export const defaultConfig = {
  negocio:          "Megga's Pizza",
  telefono:         "310 578 05 03",
  domicilio:        3000,
  adminPassword:    "meggas2024",
  kitchenPassword:  "",
  mensaje_whatsapp: "Hola 👋 Bienvenido a Megga's Pizza. Haz tu pedido aquí 🍕",
};

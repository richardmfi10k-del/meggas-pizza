// src/defaultData.js
// Datos iniciales del menú — se cargan en Firebase la primera vez

export const defaultSizes = [
  { id: "fam", label: "Familiar", porciones: "10 porciones", price: 55000, order: 1 },
  { id: "med", label: "Mediana",  porciones: "8 porciones",  price: 34000, order: 2 },
  { id: "peq", label: "Pequeña",  porciones: "4 porciones",  price: 16000, order: 3 },
  { id: "por", label: "Porción",  porciones: "1 porción",    price: 5500,  order: 4 },
];

export const defaultFlavors = [
  { id: "jamon",     name: "Jamón",              ing: "Salsa artesanal de la casa, queso",                                          active: true },
  { id: "carnes",    name: "Carnes",             ing: "Cavano, jamón, queso",                                                       active: true },
  { id: "chorizo",   name: "Chorizo",            ing: "Salsa artesanal, tocineta, maíz, chorizo, queso",                            active: true },
  { id: "casa",      name: "Pizza de la casa",   ing: "Tocineta, jamón ahumado, chorizo, maíz, salsa artesanal",                    active: true },
  { id: "hambur",    name: "Hamburguesa",        ing: "Carne, salsa artesanal, papas chips, BBQ, queso, tocineta, maíz",            active: true },
  { id: "venezol",   name: "Venezolana",         ing: "Pepperoni, pimentón, cebolla, jamón, maíz, salsa artesanal",                 active: true },
  { id: "dorilocos", name: "Dorilocos",          ing: "Doritos, maíz, pollo, carne, salsa de maíz, salsa artesanal, BBQ, queso",   active: true },
  { id: "costillas", name: "Costillas de cerdo", ing: "Tocineta, maíz, queso, salsa artesanal de la casa",                         active: true },
  { id: "mexicana",  name: "Mexicana",           ing: "Tocineta, maíz, jalapeño, tostacós",                                        active: true },
  { id: "pollobb",   name: "Pollo BBQ",          ing: "Salsa BBQ, queso, salsa artesanal de la casa",                               active: true },
  { id: "tocineta",  name: "Tocineta",           ing: "Base de carne, salsa artesanal de la casa, queso",                          active: true },
  { id: "hawaina",   name: "Hawaiana",           ing: "Piña, jamón, queso, salsa artesanal de la casa",                            active: true },
  { id: "champion",  name: "Champiñón",          ing: "Pollo, queso",                                                              active: true },
  { id: "criolla",   name: "Criolla",            ing: "Maíz tierno, queso, salsa artesanal de la casa",                            active: true },
  { id: "paisa",     name: "Paisa",              ing: "Tocineta, chicharrón, carne de res, carne de cerdo, maíz, salsa artesanal", active: true },
  { id: "peperoni",  name: "Pepperoni",          ing: "Salsa de la casa y queso",                                                  active: true },
];

export const defaultConfig = {
  negocio: "Megga's Pizza",
  telefono: "310 578 05 03",
  domicilio: 3000,
  adminPassword: "meggas2024",
  mensaje_whatsapp: "Hola 👋 Bienvenido a Megga's Pizza. Haz tu pedido aquí 🍕",
};

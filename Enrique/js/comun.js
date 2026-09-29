const CLAVE_CARRITO = "donkikin_carrito";
const EXTENSIONES_FOTO = ["jpg","jpeg","png","webp"];

function formatearPrecio(n){
  return "$" + Number(n).toLocaleString("es-MX", {maximumFractionDigits:0}) + " MXN";
}

function tonoColor(hex, porcentaje){
  const c = hex.replace("#","");
  let r = parseInt(c.substr(0,2),16), g = parseInt(c.substr(2,2),16), b = parseInt(c.substr(4,2),16);
  r = Math.min(255, Math.max(0, r + Math.round(2.55*porcentaje)));
  g = Math.min(255, Math.max(0, g + Math.round(2.55*porcentaje)));
  b = Math.min(255, Math.max(0, b + Math.round(2.55*porcentaje)));
  return "#" + [r,g,b].map(v=>v.toString(16).padStart(2,"0")).join("");
}
function estiloMiniatura(hex){
  return `background: linear-gradient(155deg, ${hex} 0%, ${tonoColor(hex,-18)} 100%); color:#fff; text-shadow:0 1px 4px rgba(0,0,0,.75);`;
}

function buscarProducto(id){
  return PRODUCTOS.find(p => p.id === id);
}
function buscarColor(producto, nombreColor){
  return producto.colores.find(c => c.nombre === nombreColor) || producto.colores[0];
}

function aSlug(texto){
  return texto.toLowerCase()
    .replace(/\+/g, "-plus")
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function rutaFoto(producto, numero, color){
  const base = "fotos/" + aSlug(producto.nombre);
  const general = `${base}-${numero}`;
  if(!color) return general;
  return `${base}-${aSlug(color.nombre)}-${numero}|${general}`;
}

function probarFoto(elemento, clave, candidatos, indiceBase, indiceExtension){
  if(indiceBase >= candidatos.length) return;
  const ruta = `${candidatos[indiceBase]}.${EXTENSIONES_FOTO[indiceExtension]}`;
  const prueba = new Image();
  prueba.onload = ()=>{
    if(elemento.dataset.rutaFoto !== clave) return;
    elemento.style.background = `url("${ruta}") center/cover no-repeat`;
    elemento.querySelectorAll(".texto-respaldo").forEach(t => t.remove());
  };
  prueba.onerror = ()=>{
    if(indiceExtension + 1 < EXTENSIONES_FOTO.length) probarFoto(elemento, clave, candidatos, indiceBase, indiceExtension + 1);
    else probarFoto(elemento, clave, candidatos, indiceBase + 1, 0);
  };
  prueba.src = ruta;
}

function cargarFotos(raiz){
  (raiz || document).querySelectorAll("[data-ruta-foto]").forEach(el => {
    const clave = el.dataset.rutaFoto;
    probarFoto(el, clave, clave.split("|"), 0, 0);
  });
}

function obtenerCarrito(){
  try{ return JSON.parse(localStorage.getItem(CLAVE_CARRITO)) || []; }
  catch(e){ return []; }
}
function guardarCarrito(carrito){
  localStorage.setItem(CLAVE_CARRITO, JSON.stringify(carrito));
  actualizarInsigniaCarrito();
}
function agregarAlCarrito(idProducto, color, cantidad){
  const carrito = obtenerCarrito();
  const existente = carrito.find(i => i.idProducto === idProducto && i.color === color);
  if(existente) existente.cantidad += cantidad;
  else carrito.push({idProducto, color, cantidad});
  guardarCarrito(carrito);
}
function quitarDelCarrito(idProducto, color){
  guardarCarrito(obtenerCarrito().filter(i => !(i.idProducto === idProducto && i.color === color)));
}
function cambiarCantidadCarrito(idProducto, color, cantidad){
  const carrito = obtenerCarrito();
  const item = carrito.find(i => i.idProducto === idProducto && i.color === color);
  if(item){
    item.cantidad = cantidad;
    if(item.cantidad <= 0) return quitarDelCarrito(idProducto, color);
  }
  guardarCarrito(carrito);
}
function totalArticulosCarrito(){
  return obtenerCarrito().reduce((a,i)=>a+i.cantidad, 0);
}
function actualizarInsigniaCarrito(){
  document.querySelectorAll("[data-insignia-carrito]").forEach(el=>{
    const n = totalArticulosCarrito();
    el.textContent = n;
    el.style.display = n > 0 ? "flex" : "none";
  });
}

function renderizarTarjeta(producto){
  const color = producto.colores[0];
  const puntos = producto.colores.map(c => `<span class="punto-color" style="background:${c.hex}" title="${c.nombre}"></span>`).join("");
  return `
  <article class="tarjeta">
    <a href="producto.html?id=${producto.id}" style="display:flex;flex-direction:column;gap:8px;flex:1;">
      <div class="miniatura" style="${estiloMiniatura(color.hex)}" data-ruta-foto="${rutaFoto(producto, 1, color)}"><span class="texto-respaldo">${producto.nombre}</span></div>
      <div class="marca">${producto.marca}</div>
      <h3>${producto.modelo}</h3>
      <div class="puntos-color">${puntos}<span class="cantidad-colores">${producto.colores.length} colores</span></div>
    </a>
    <div class="fila-precio">
      <span class="precio">${formatearPrecio(producto.precio)}</span>
      <button class="boton-agregar" data-agregar-rapido="${producto.id}">Agregar</button>
    </div>
  </article>`;
}

function activarAgregadoRapido(contenedor){
  contenedor.querySelectorAll("[data-agregar-rapido]").forEach(boton=>{
    boton.addEventListener("click", (e)=>{
      e.preventDefault();
      const producto = buscarProducto(boton.dataset.agregarRapido);
      const color = producto.colores[0];
      agregarAlCarrito(producto.id, color.nombre, 1);
      mostrarAviso(`${producto.nombre} (${color.nombre}) agregado al carrito`);
    });
  });
}

function renderizarCuadricula(contenedor, productos, textoVacio){
  if(!productos.length){
    contenedor.innerHTML = `<div class="mensaje-vacio">${textoVacio || "No se encontraron productos con esos filtros."}</div>`;
    return;
  }
  contenedor.innerHTML = productos.map(renderizarTarjeta).join("");
  cargarFotos(contenedor);
  activarAgregadoRapido(contenedor);
}

function mostrarAviso(mensaje, conEnlaceCarrito){
  let aviso = document.querySelector(".aviso");
  if(!aviso){
    aviso = document.createElement("div");
    aviso.className = "aviso";
    document.body.appendChild(aviso);
  }
  aviso.innerHTML = mensaje + (conEnlaceCarrito !== false ? ` &middot; <a href="carrito.html">Ver carrito</a>` : "");
  aviso.classList.add("mostrar");
  clearTimeout(aviso._temporizador);
  aviso._temporizador = setTimeout(()=> aviso.classList.remove("mostrar"), 2600);
}

function renderizarEncabezado(){
  const encabezado = document.getElementById("encabezado-sitio");
  if(!encabezado) return;

  const parametros = new URLSearchParams(location.search);
  const marcaActual = parametros.get("marca") || "";
  const busquedaActual = parametros.get("q") || "";

  const marcas = ["Samsung","Apple","Xiaomi","Motorola","Google","Huawei"];
  const botonesMarca = [`<button data-filtro-marca="" class="${!marcaActual ? 'activo' : ''}">Todos</button>`]
    .concat(marcas.map(m => `<button data-filtro-marca="${m}" class="${marcaActual===m ? 'activo' : ''}">${m}</button>`))
    .join("");

  encabezado.innerHTML = `
    <div class="barra-superior">
      <a href="index.html" class="logo"><span class="punto"></span><span class="logo-caja">Celulares</span>Don Kikin</a>
      <form class="buscador" id="formulario-busqueda" role="search">
        <input type="search" id="entrada-busqueda" placeholder="Buscar celulares, marcas, modelos..." autocomplete="off" value="${busquedaActual}">
        <button type="button" class="boton-filtros" data-boton-filtros>Filtros</button>
        <button type="submit" class="ir">Buscar</button>
      </form>
      <a href="carrito.html" class="enlace-carrito">
        🛒 Carrito
        <span class="insignia-carrito" data-insignia-carrito>0</span>
      </a>
    </div>
    <nav class="submenu"><div class="contenedor">${botonesMarca}</div></nav>
    <div class="panel-filtros" id="panel-filtros">
      <div class="grupo-filtro">
        <label for="f-orden">Ordenar por</label>
        <select id="f-orden">
          <option value="relevancia">Relevancia</option>
          <option value="precio-asc">Precio: menor a mayor</option>
          <option value="precio-desc">Precio: mayor a menor</option>
        </select>
      </div>
      <div class="grupo-filtro">
        <label for="f-precio-max">Precio máximo</label>
        <input type="range" id="f-precio-max" min="1500" max="30000" step="500" value="30000">
        <span class="valor-rango" id="f-precio-max-val">Hasta $30,000</span>
      </div>
      <button class="limpiar-filtros" id="f-limpiar">Limpiar filtros</button>
    </div>
  `;

  document.getElementById("formulario-busqueda").addEventListener("submit", (e)=>{
    e.preventDefault();
    const q = document.getElementById("entrada-busqueda").value.trim();
    location.href = "index.html" + (q ? ("?q=" + encodeURIComponent(q)) : "");
  });
  document.querySelectorAll("[data-filtro-marca]").forEach(boton=>{
    boton.addEventListener("click", ()=>{
      const marca = boton.dataset.filtroMarca;
      location.href = "index.html" + (marca ? ("?marca=" + encodeURIComponent(marca)) : "");
    });
  });
  const alternarFiltros = document.querySelector("[data-boton-filtros]");
  const panelFiltros = document.getElementById("panel-filtros");
  if(alternarFiltros && panelFiltros){
    alternarFiltros.addEventListener("click", ()=> panelFiltros.classList.toggle("abierto"));
  }

  actualizarInsigniaCarrito();
}

document.addEventListener("DOMContentLoaded", renderizarEncabezado);

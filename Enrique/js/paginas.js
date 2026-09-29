function iniciarBanner(){
  const pista = document.getElementById("pista-banner");
  const puntos = document.getElementById("puntos-banner");
  if(!pista) return;

  const seleccion = PRODUCTOS.slice().sort(()=> Math.random()-0.5).slice(0,6);

  pista.innerHTML = seleccion.map((p,i) => `
    <div class="diapositiva ${i===0?'activa':''}" data-diapositiva="${i}">
      <div class="texto-diapositiva">
        <div class="etiqueta">${p.marca}</div>
        <h2>${p.nombre}</h2>
        <span class="precio">${formatearPrecio(p.precio)}</span>
        <br>
        <a href="producto.html?id=${p.id}" class="cta">Ver producto</a>
      </div>
      <div class="visual-diapositiva" style="${estiloMiniatura(p.colores[0].hex)}" data-ruta-foto="${rutaFoto(p, 1, p.colores[0])}"><span class="texto-respaldo">${p.nombre}</span></div>
    </div>`).join("");
  cargarFotos(pista);

  puntos.innerHTML = seleccion.map((_,i) => `<button data-punto="${i}" class="${i===0?'activo':''}"></button>`).join("");

  let actual = 0;
  const total = seleccion.length;
  function irA(indice){
    actual = (indice + total) % total;
    pista.querySelectorAll(".diapositiva").forEach(el => el.classList.toggle("activa", Number(el.dataset.diapositiva)===actual));
    puntos.querySelectorAll("button").forEach(el => el.classList.toggle("activo", Number(el.dataset.punto)===actual));
  }
  puntos.querySelectorAll("button").forEach(boton=>{
    boton.addEventListener("click", ()=>{ irA(Number(boton.dataset.punto)); reiniciarTemporizador(); });
  });
  let temporizador;
  function reiniciarTemporizador(){
    clearInterval(temporizador);
    temporizador = setInterval(()=> irA(actual+1), 4000);
  }
  reiniciarTemporizador();
}

function aplicarFiltrosInicio(){
  const parametros = new URLSearchParams(location.search);
  const q = (parametros.get("q") || "").toLowerCase().trim();
  const marca = parametros.get("marca") || "";

  const selOrden = document.getElementById("f-orden");
  const inputPrecioMax = document.getElementById("f-precio-max");
  const valPrecioMax = document.getElementById("f-precio-max-val");

  let lista = PRODUCTOS.slice();

  if(q){
    lista = lista.filter(p => p.nombre.toLowerCase().includes(q) || p.marca.toLowerCase().includes(q) || p.modelo.toLowerCase().includes(q));
  }
  if(marca){
    lista = lista.filter(p => p.marca === marca);
  }
  if(inputPrecioMax){
    const max = Number(inputPrecioMax.value);
    valPrecioMax.textContent = "Hasta " + formatearPrecio(max);
    lista = lista.filter(p => p.precio <= max);
  }
  if(selOrden){
    if(selOrden.value === "precio-asc") lista.sort((a,b)=> a.precio - b.precio);
    else if(selOrden.value === "precio-desc") lista.sort((a,b)=> b.precio - a.precio);
  }

  const titulo = document.getElementById("titulo-cuadricula");
  if(q) titulo.textContent = `Resultados para "${q}"`;
  else if(marca) titulo.textContent = marca;
  else titulo.textContent = "Todos los celulares";

  document.getElementById("conteo-resultados").textContent = `${lista.length} producto(s)`;
  renderizarCuadricula(document.getElementById("cuadricula-productos"), lista);
}

function iniciarPaginaInicio(){
  iniciarBanner();
  setTimeout(()=>{
    ["f-orden","f-precio-max"].forEach(id=>{
      const el = document.getElementById(id);
      if(el) el.addEventListener("input", aplicarFiltrosInicio);
    });
    const limpiar = document.getElementById("f-limpiar");
    if(limpiar){
      limpiar.addEventListener("click", ()=>{
        document.getElementById("f-orden").value = "relevancia";
        document.getElementById("f-precio-max").value = 30000;
        history.replaceState({}, "", "index.html");
        aplicarFiltrosInicio();
      });
    }
    aplicarFiltrosInicio();
  }, 0);
}

let productoActual = null;
let cantidadSeleccionada = 1;
let colorSeleccionado = null;
let fotoSeleccionada = 0;
const TOTAL_FOTOS = 3;

function renderizarCantidad(){
  document.getElementById("cantidad-valor").textContent = cantidadSeleccionada;
}

function renderizarImagenPrincipal(){
  const marco = document.getElementById("marco-imagen-principal");
  const imagen = document.getElementById("imagen-principal");
  imagen.setAttribute("style", estiloMiniatura(colorSeleccionado.hex));
  imagen.innerHTML = `<span class="texto-respaldo">${productoActual.nombre}</span>`;
  imagen.dataset.rutaFoto = rutaFoto(productoActual, fotoSeleccionada + 1, colorSeleccionado);
  cargarFotos(marco);
  const esUltimaFoto = fotoSeleccionada === TOTAL_FOTOS - 1;
  marco.classList.toggle("con-zoom", esUltimaFoto);
  if(!esUltimaFoto) imagen.style.transform = "scale(1)";
}

function renderizarMiniaturasFoto(){
  const contenedor = document.getElementById("miniaturas-foto");
  let html = "";
  for(let i=0; i<TOTAL_FOTOS; i++){
    const esZoom = i === TOTAL_FOTOS - 1;
    html += `<div class="miniatura-foto ${i===fotoSeleccionada?'activa':''}" data-foto="${i}" style="${estiloMiniatura(colorSeleccionado.hex)}" data-ruta-foto="${rutaFoto(productoActual, i + 1, colorSeleccionado)}">
      ${esZoom ? '<span class="etiqueta-zoom">zoom</span>' : ''}
    </div>`;
  }
  contenedor.innerHTML = html;
  cargarFotos(contenedor);
  contenedor.querySelectorAll("[data-foto]").forEach(el=>{
    el.addEventListener("click", ()=>{
      fotoSeleccionada = Number(el.dataset.foto);
      renderizarMiniaturasFoto();
      renderizarImagenPrincipal();
    });
  });
}

function renderizarColores(){
  const contenedor = document.getElementById("muestras-color");
  document.getElementById("etiqueta-color-actual").textContent = colorSeleccionado.nombre;
  contenedor.innerHTML = productoActual.colores.map(c => `
    <div class="muestra-color ${c.nombre===colorSeleccionado.nombre?'seleccionada':''}" data-color="${c.nombre}" style="background:${c.hex}" title="${c.nombre}"></div>
  `).join("");
  contenedor.querySelectorAll("[data-color]").forEach(el=>{
    el.addEventListener("click", ()=>{
      colorSeleccionado = productoActual.colores.find(c => c.nombre === el.dataset.color);
      renderizarColores();
      renderizarMiniaturasFoto();
      renderizarImagenPrincipal();
    });
  });
}

function iniciarZoomImagen(){
  const marco = document.getElementById("marco-imagen-principal");
  const imagen = document.getElementById("imagen-principal");
  marco.addEventListener("mousemove", (e)=>{
    if(!marco.classList.contains("con-zoom")) return;
    const rect = marco.getBoundingClientRect();
    const porcentajeX = ((e.clientX - rect.left) / rect.width) * 100;
    const porcentajeY = ((e.clientY - rect.top) / rect.height) * 100;
    imagen.style.transformOrigin = `${porcentajeX}% ${porcentajeY}%`;
    imagen.style.transform = "scale(2)";
  });
  marco.addEventListener("mouseleave", ()=>{
    imagen.style.transform = "scale(1)";
  });
}

function renderizarPaginaProducto(){
  const p = productoActual;
  document.getElementById("dp-marca").textContent = p.marca;
  document.getElementById("dp-titulo").textContent = p.nombre;
  document.getElementById("dp-precio").textContent = formatearPrecio(p.precio);
  document.getElementById("esp-pantalla").textContent = p.pantalla;
  document.getElementById("esp-ram").textContent = p.ram;
  document.getElementById("esp-camara").textContent = p.camara;
  document.getElementById("esp-bateria").textContent = p.bateria;
  renderizarColores();
  renderizarMiniaturasFoto();
  renderizarImagenPrincipal();
  renderizarCantidad();
}

function renderizarRelacionados(){
  const mismaMarca = PRODUCTOS.filter(p => p.marca === productoActual.marca && p.id !== productoActual.id);
  const disponibles = mismaMarca.length >= 4 ? mismaMarca : PRODUCTOS.filter(p => p.id !== productoActual.id);
  const seleccion = disponibles.slice().sort(()=> Math.random()-0.5).slice(0,6);
  const franja = document.getElementById("franja-relacionados");
  franja.innerHTML = seleccion.map(renderizarTarjeta).join("");
  cargarFotos(franja);
  activarAgregadoRapido(franja);
}

function iniciarPaginaProducto(){
  const parametros = new URLSearchParams(location.search);
  productoActual = buscarProducto(parametros.get("id")) || PRODUCTOS[0];
  cantidadSeleccionada = 1;
  colorSeleccionado = productoActual.colores[0];
  fotoSeleccionada = 0;

  document.getElementById("migas-actual").textContent = productoActual.nombre;
  document.title = productoActual.nombre + " — Celulares Don Kikin";

  renderizarPaginaProducto();
  renderizarRelacionados();
  iniciarZoomImagen();

  document.getElementById("cantidad-menos").addEventListener("click", ()=>{
    cantidadSeleccionada = Math.max(1, cantidadSeleccionada - 1);
    renderizarCantidad();
  });
  document.getElementById("cantidad-mas").addEventListener("click", ()=>{
    cantidadSeleccionada = Math.min(10, cantidadSeleccionada + 1);
    renderizarCantidad();
  });
  document.getElementById("boton-agregar-carrito").addEventListener("click", ()=>{
    agregarAlCarrito(productoActual.id, colorSeleccionado.nombre, cantidadSeleccionada);
    mostrarAviso(`${productoActual.nombre} (${colorSeleccionado.nombre}) agregado al carrito`);
  });
}

function renderizarCarrito(){
  const carrito = obtenerCarrito();
  const contenedor = document.getElementById("items-carrito");

  if(!carrito.length){
    contenedor.innerHTML = `<div class="mensaje-vacio">
      Tu carrito está vacío.<br><br>
      <a href="index.html" class="boton-secundario" style="display:inline-block;">Ir a comprar</a>
    </div>`;
    actualizarResumenCarrito(carrito);
    return;
  }

  contenedor.innerHTML = carrito.map(item => {
    const producto = buscarProducto(item.idProducto);
    if(!producto) return "";
    const color = buscarColor(producto, item.color);
    const totalLinea = producto.precio * item.cantidad;
    return `
    <div class="item-carrito" data-linea="${item.idProducto}|${color.nombre}">
      <div class="miniatura-carrito" style="${estiloMiniatura(color.hex)}" data-ruta-foto="${rutaFoto(producto, 1, color)}"><span class="texto-respaldo">${producto.marca}</span></div>
      <div>
        <a href="producto.html?id=${producto.id}"><h4>${producto.nombre}</h4></a>
        <div class="detalle-color"><span class="punto-color" style="background:${color.hex}"></span>Color: ${color.nombre}</div>
        <div class="precio">${formatearPrecio(totalLinea)} <span style="color:var(--tenue);font-weight:400;font-size:.8rem;">(${formatearPrecio(producto.precio)} c/u)</span></div>
      </div>
      <div class="item-carrito-derecha">
        <div class="control-cantidad">
          <button type="button" data-cantidad-menos>−</button>
          <span>${item.cantidad}</span>
          <button type="button" data-cantidad-mas>+</button>
        </div>
        <button class="boton-eliminar" data-eliminar type="button">Eliminar</button>
      </div>
    </div>`;
  }).join("");
  cargarFotos(contenedor);

  contenedor.querySelectorAll("[data-linea]").forEach(lineaEl => {
    const [idProducto, nombreColor] = lineaEl.dataset.linea.split("|");
    const item = carrito.find(i => i.idProducto === idProducto && i.color === nombreColor);
    lineaEl.querySelector("[data-cantidad-mas]").addEventListener("click", ()=>{
      cambiarCantidadCarrito(idProducto, nombreColor, Math.min(10, item.cantidad+1));
      renderizarCarrito();
    });
    lineaEl.querySelector("[data-cantidad-menos]").addEventListener("click", ()=>{
      cambiarCantidadCarrito(idProducto, nombreColor, item.cantidad-1);
      renderizarCarrito();
    });
    lineaEl.querySelector("[data-eliminar]").addEventListener("click", ()=>{
      quitarDelCarrito(idProducto, nombreColor);
      renderizarCarrito();
    });
  });

  actualizarResumenCarrito(carrito);
}

function actualizarResumenCarrito(carrito){
  let subtotal = 0, cuenta = 0;
  carrito.forEach(item => {
    const producto = buscarProducto(item.idProducto);
    if(!producto) return;
    subtotal += producto.precio * item.cantidad;
    cuenta += item.cantidad;
  });
  document.getElementById("resumen-conteo").textContent = `${cuenta} artículo(s)`;
  document.getElementById("resumen-subtotal").textContent = formatearPrecio(subtotal);
  document.getElementById("resumen-total").textContent = formatearPrecio(subtotal);
  const botonPagar = document.getElementById("boton-pagar");
  botonPagar.disabled = cuenta === 0;
  botonPagar.style.opacity = cuenta === 0 ? .5 : 1;
}

function iniciarPaginaCarrito(){
  renderizarCarrito();
  document.getElementById("boton-pagar").addEventListener("click", ()=>{
    if(!obtenerCarrito().length) return;
    alert("¡Gracias por tu compra! (simulación) Tu pedido ha sido registrado.");
    localStorage.removeItem(CLAVE_CARRITO);
    renderizarCarrito();
    actualizarInsigniaCarrito();
  });
}

document.addEventListener("DOMContentLoaded", ()=>{
  const pagina = document.body.dataset.pagina;
  if(pagina === "inicio") iniciarPaginaInicio();
  else if(pagina === "producto") iniciarPaginaProducto();
  else if(pagina === "carrito") iniciarPaginaCarrito();
});

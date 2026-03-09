// 1. CONFIGURACIÓN DE EMAILJS
(function() {
    emailjs.init("38CGCx_AeybsMLgtu"); 
})();

// 2. CONFIGURACIÓN DE CUPOS (unidades de 350g)
const MAX_PUNTOS = { "lunes": 2, "viernes": 2, "sabado": 4 };

// 3. CARGAR RESERVAS
let reservas = JSON.parse(localStorage.getItem('reservas_pan')) || {
    "lunes": 0, "viernes": 0, "sabado": 0, "lastUpdate": new Date().getTime()
};

// 4. REINICIO DOMINGOS
function checkReset() {
    const ahora = new Date();
    const ultimaReserva = new Date(reservas.lastUpdate);
    const inicioSemanaActual = new Date(ahora);
    inicioSemanaActual.setDate(ahora.getDate() - ahora.getDay());
    inicioSemanaActual.setHours(0, 0, 0, 0);

    if (ultimaReserva.getTime() < inicioSemanaActual.getTime()) {
        reservas = { "lunes": 0, "viernes": 0, "sabado": 0, "lastUpdate": ahora.getTime() };
        localStorage.setItem('reservas_pan', JSON.stringify(reservas));
    }
}

// 5. ACTUALIZAR INTERFAZ Y PRECIO
function actualizarInterfaz() {
    const selectDia = document.getElementById('day-select');
    const selectSize = document.getElementById('size-select');
    const opciones = selectDia.getElementsByTagName('option');
    const puntosPedido = parseInt(selectSize.value);
    
    // Actualizar visualización del precio
    const precio = selectSize.options[selectSize.selectedIndex].getAttribute('data-price');
    document.getElementById('price-display').innerText = `Total: ${precio}€`;

    for (let i = 0; i < opciones.length; i++) {
        const dia = opciones[i].value;
        if (dia) {
            const puntosLibres = MAX_PUNTOS[dia] - reservas[dia];
            if (puntosPedido > puntosLibres) {
                opciones[i].disabled = true;
                opciones[i].innerText = `${dia.toUpperCase()} (SIN CUPO)`;
            } else {
                opciones[i].disabled = false;
                opciones[i].innerText = `${dia.charAt(0).toUpperCase() + dia.slice(1)} (Disponible)`;
            }
        }
    }
}

document.getElementById('size-select').addEventListener('change', actualizarInterfaz);
checkReset();
actualizarInterfaz();

// 6. FORMULARIO
const form = document.getElementById('reservation-form');
const statusMsg = document.getElementById('status-msg');

form.addEventListener('submit', function(event) {
    event.preventDefault();
    checkReset();

    const selectSize = document.getElementById('size-select');
    const diaSeleccionado = document.getElementById('day-select').value;
    const puntosPedido = parseInt(selectSize.value);
    const nombre = document.getElementById('user_name').value;
    const email = document.getElementById('user_email').value;
    
    const tamañoTexto = puntosPedido === 2 ? "700g" : "350g";
    const precioFinal = selectSize.options[selectSize.selectedIndex].getAttribute('data-price');

    if (reservas[diaSeleccionado] + puntosPedido <= MAX_PUNTOS[diaSeleccionado]) {
        
        const templateParams = {
            name: nombre,
            date: `${diaSeleccionado.toUpperCase()} (${tamañoTexto})`,
            to_email: email,
            // Nueva variable para tu plantilla de EmailJS
            price: `${precioFinal}€` 
        };

        const btn = document.getElementById('submit-btn');
        btn.innerText = "Enviando...";
        btn.disabled = true;

        emailjs.send('service_2k4qntk', 'template_0j8dha9', templateParams)
            .then(function() {
                reservas[diaSeleccionado] += puntosPedido;
                reservas.lastUpdate = new Date().getTime();
                localStorage.setItem('reservas_pan', JSON.stringify(reservas));
                
                statusMsg.style.color = "green";
                statusMsg.innerText = `¡Éxito! Reserva de ${tamañoTexto} por ${precioFinal}€.`;
                
                form.reset();
                actualizarInterfaz();
                btn.innerText = "Reservar ahora";
                btn.disabled = false;
            }, function(error) {
                statusMsg.style.color = "red";
                statusMsg.innerText = "Error al enviar.";
                btn.disabled = false;
            });
    } else {
        statusMsg.style.color = "red";
        statusMsg.innerText = "No queda espacio suficiente para ese tamaño.";
    }
});
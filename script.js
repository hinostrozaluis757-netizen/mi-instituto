const scriptURL = 'https://script.google.com/macros/s/AKfycbzaz4JWrmsM1w0SEfxQMBot7kPzuDreAPqTON9edH3EOFtUJ-lQD-LEmBh-3bncyRai/exec';

/**
 * INSTITUTO TECNOLÓGICO INNOVA
 * script.js - Lógica de interactividad, validación y conexión con Google Sheets
 */

async function cargarDatosCarreras() {
  // Busca el contenedor por ID o por la clase de la grilla
  const contenedor = document.getElementById('contenedorProgramas') || document.querySelector('.row.g-4');
  const selectCarrera = document.getElementById('carrera');
  
  if(contenedor) contenedor.innerHTML = '<div class="col-12 text-center py-4"><p style="color:#6b7785;">Cargando carreras...</p></div>';
  if(selectCarrera) selectCarrera.innerHTML = '<option value="">Cargando carreras...</option>';

  try {
    const respuesta = await fetch(scriptURL); // Asegúrate de que esta variable coincida con la declarada arriba
    const carreras = await respuesta.json();

    if(selectCarrera) selectCarrera.innerHTML = '<option value="">Selecciona una carrera</option>';
    if(contenedor) contenedor.innerHTML = '';

    if (carreras.error) {
      if(contenedor) contenedor.innerHTML = '<p class="text-center w-100 text-danger">Error: ' + carreras.error + '</p>';
      return;
    }

    let tarjetasHTML = '';
    carreras.forEach((carrera) => {
      if(selectCarrera) {
        const option = document.createElement('option');
        option.value = carrera.nombre;
        option.textContent = carrera.nombre;
        selectCarrera.appendChild(option);
      }

      // Lógica experta para detectar Base64 o URL
      let urlImagen = 'https://placehold.co/1200x800/0f1419/3b82f6?text=Sin+Imagen';
      if (carrera.imagen) {
        if (/^(https?:|data:)/.test(carrera.imagen)) {
            urlImagen = carrera.imagen;
        } else {
            urlImagen = 'img/' + carrera.imagen; 
        }
      }

      tarjetasHTML += `
        <div class="col-lg-4 col-md-6 mb-4"> 
          <div class="career-card h-100 border-0 shadow-sm transition-card" style="background: var(--card-bg, #fff); border-radius: 12px; overflow: hidden;">
            <div class="career-img-container position-relative overflow-hidden" style="height: 200px;">
              <img src="${urlImagen}" class="career-card-img card-img-top w-100 h-100 object-fit-cover" alt="${carrera.nombre}" style="object-fit: cover;">
            </div>
            <div class="card-body p-4 d-flex flex-column">
              <h5 class="card-title fw-bold mb-3">${carrera.nombre}</h5>
              <p class="card-text text-muted mb-4 flex-grow-1">${carrera.descripcion || 'Descripción no disponible.'}</p>
              <a href="#registro" class="btn btn-outline-primary w-100 rounded-pill px-4" onclick="if(document.getElementById('carrera')) document.getElementById('carrera').value = '${carrera.nombre}'">Postular a esta carrera →</a>
            </div>
          </div>
        </div>
      `;
    });
    
    if(contenedor) contenedor.innerHTML = tarjetasHTML;

  } catch (error) {
    console.error('Error:', error);
    if(contenedor) contenedor.innerHTML = '<p class="text-center w-100 text-danger">Error de conexión.</p>';
  }
}

// Asegurar que se ejecute al cargar
document.addEventListener('DOMContentLoaded', cargarDatosCarreras);

document.addEventListener('DOMContentLoaded', () => {

  // ==========================================================
  // 2. REFERENCIAS A ELEMENTOS DEL DOM
  // ==========================================================
  const form = document.getElementById('registroForm');
  const inputNombre = document.getElementById('nombre');
  const inputEmail = document.getElementById('email');
  const inputTelefono = document.getElementById('telefono');
  const selectCarrera = document.getElementById('carrera');
  const selectModalidad = document.getElementById('modalidad');
  const checkTerminos = document.getElementById('terminos');
  const btnSubmit = document.getElementById('btnSubmit');
  const btnScrollTop = document.getElementById('btnScrollTop');

  // Modal de éxito y sus campos de resumen
  const successModalElement = document.getElementById('successModal');
  const successModal = new bootstrap.Modal(successModalElement);
  const summaryNombre = document.getElementById('summaryNombre');
  const summaryEmail = document.getElementById('summaryEmail');
  const summaryTelefono = document.getElementById('summaryTelefono');
  const summaryCarrera = document.getElementById('summaryCarrera');
  const summaryModalidad = document.getElementById('summaryModalidad');

  // ==========================================================
  // 3. EXPRESIONES REGULARES Y FUNCIONES DE VALIDACIÓN
  // ==========================================================

  // Valida que el nombre tenga al menos 3 caracteres y contenga solo letras y espacios
  const validarNombre = (valor) => {
    const trimmed = valor.trim();
    if (trimmed.length === 0) {
      return { valido: false, mensaje: 'El nombre completo es obligatorio.' };
    }
    if (trimmed.length < 3) {
      return { valido: false, mensaje: 'El nombre debe tener al menos 3 caracteres.' };
    }
    // Permite letras (incluyendo tildes y ñ) y espacios
    const regexLetras = /^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s]+$/;
    if (!regexLetras.test(trimmed)) {
      return { valido: false, mensaje: 'El nombre solo debe contener letras y espacios.' };
    }
    return { valido: true };
  };

  // Valida formato de correo estándar
  const validarEmail = (valor) => {
    const trimmed = valor.trim();
    if (trimmed.length === 0) {
      return { valido: false, mensaje: 'El correo electrónico es obligatorio.' };
    }
    // Regex estándar para validación de formato email
    const regexEmail = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!regexEmail.test(trimmed)) {
      return { valido: false, mensaje: 'Ingresa un formato de correo válido (ej: nombre@dominio.com).' };
    }
    return { valido: true };
  };

  // Valida teléfono: dígitos entre 9 y 12 caracteres (admite prefijo +)
  const validarTelefono = (valor) => {
    const trimmed = valor.trim();
    if (trimmed.length === 0) {
      return { valido: false, mensaje: 'El número telefónico es obligatorio.' };
    }
    // Eliminar posibles guiones o espacios para verificar dígitos
    const cleanNumber = trimmed.replace(/[\s-]/g, '');
    const regexTel = /^\+?[0-9]{9,12}$/;
    if (!regexTel.test(cleanNumber)) {
      return { valido: false, mensaje: 'Ingresa un número telefónico válido (entre 9 y 12 dígitos numéricos).' };
    }
    return { valido: true };
  };

  // Valida selección de carrera
  const validarCarrera = (valor) => {
    if (!valor || valor.trim() === '') {
      return { valido: false, mensaje: 'Debes seleccionar una carrera de interés.' };
    }
    return { valido: true };
  };

  // Valida selección de modalidad
  const validarModalidad = (valor) => {
    if (!valor || valor.trim() === '') {
      return { valido: false, mensaje: 'Debes seleccionar la modalidad de estudio.' };
    }
    return { valido: true };
  };

  // Valida checkbox de términos
  const validarTerminos = (checked) => {
    if (!checked) {
      return { valido: false, mensaje: 'Debes aceptar los términos y condiciones para continuar.' };
    }
    return { valido: true };
  };

  // ==========================================================
  // 4. CONTROL VISUAL DE ERRORES (FEEDBACK EN TIEMPO REAL)
  // ==========================================================
  const aplicarFeedback = (input, resultado, feedbackId) => {
    const feedbackElement = document.getElementById(feedbackId);

    if (resultado.valido) {
      input.classList.remove('is-invalid');
      input.classList.add('is-valid');
      if (feedbackElement) {
        feedbackElement.textContent = '';
      }
      return true;
    } else {
      input.classList.remove('is-valid');
      input.classList.add('is-invalid');
      if (feedbackElement) {
        feedbackElement.textContent = resultado.mensaje;
      }
      return false;
    }
  };

  // Listeners para validación en tiempo real (input / change)
  inputNombre.addEventListener('input', () => {
    aplicarFeedback(inputNombre, validarNombre(inputNombre.value), 'nombreFeedback');
  });

  inputEmail.addEventListener('input', () => {
    aplicarFeedback(inputEmail, validarEmail(inputEmail.value), 'emailFeedback');
  });

  inputTelefono.addEventListener('input', () => {
    aplicarFeedback(inputTelefono, validarTelefono(inputTelefono.value), 'telefonoFeedback');
  });

  selectCarrera.addEventListener('change', () => {
    aplicarFeedback(selectCarrera, validarCarrera(selectCarrera.value), 'carreraFeedback');
  });

  selectModalidad.addEventListener('change', () => {
    aplicarFeedback(selectModalidad, validarModalidad(selectModalidad.value), 'modalidadFeedback');
  });

  checkTerminos.addEventListener('change', () => {
    aplicarFeedback(checkTerminos, validarTerminos(checkTerminos.checked), 'terminosFeedback');
  });

  // ==========================================================
  // 5. SUBMIT DEL FORMULARIO Y ENVÍO A GOOGLE SHEETS
  // ==========================================================
  form.addEventListener('submit', (event) => {
    event.preventDefault();
    event.stopPropagation();

    // Validar cada campo individualmente
    const resNombre = validarNombre(inputNombre.value);
    const resEmail = validarEmail(inputEmail.value);
    const resTelefono = validarTelefono(inputTelefono.value);
    const resCarrera = validarCarrera(selectCarrera.value);
    const resModalidad = validarModalidad(selectModalidad.value);
    const resTerminos = validarTerminos(checkTerminos.checked);

    const esNombreValido = aplicarFeedback(inputNombre, resNombre, 'nombreFeedback');
    const esEmailValido = aplicarFeedback(inputEmail, resEmail, 'emailFeedback');
    const esTelefonoValido = aplicarFeedback(inputTelefono, resTelefono, 'telefonoFeedback');
    const esCarreraValida = aplicarFeedback(selectCarrera, resCarrera, 'carreraFeedback');
    const esModalidadValida = aplicarFeedback(selectModalidad, resModalidad, 'modalidadFeedback');
    const esTerminosValido = aplicarFeedback(checkTerminos, resTerminos, 'terminosFeedback');

    const formularioValido = esNombreValido && esEmailValido && esTelefonoValido &&
                             esCarreraValida && esModalidadValida && esTerminosValido;

    if (!formularioValido) {
      // Enfocar el primer campo con error
      const primerError = form.querySelector('.is-invalid');
      if (primerError) {
        primerError.focus();
      }
      return;
    }

    // Capturar valores ingresados antes de limpiar el formulario
    const datosIngresados = {
      nombre: inputNombre.value.trim(),
      email: inputEmail.value.trim(),
      telefono: inputTelefono.value.trim(),
      carrera: selectCarrera.value,
      modalidad: selectModalidad.value
    };

    // Estado visual de carga en el botón
    const btnText = btnSubmit.querySelector('.btn-text');
    const btnSpinner = btnSubmit.querySelector('.spinner-border');
    btnSubmit.disabled = true;
    btnSpinner.classList.remove('d-none');
    btnText.textContent = ' Enviando a Google Sheets...';

    // Envío de datos al Web App de Google Apps Script (Google Sheets)
    fetch(scriptURL, {
      method: 'POST',
      body: new FormData(form)
    })
      .then((response) => {
        // Cargar datos en el Modal de Resumen
        summaryNombre.textContent = datosIngresados.nombre;
        summaryEmail.textContent = datosIngresados.email;
        summaryTelefono.textContent = datosIngresados.telefono;
        summaryCarrera.textContent = datosIngresados.carrera;
        summaryModalidad.textContent = datosIngresados.modalidad;

        // Mostrar Modal de confirmación
        successModal.show();

        // Limpiar formulario y resetear estados visuales
        form.reset();
        [inputNombre, inputEmail, inputTelefono, selectCarrera, selectModalidad, checkTerminos].forEach((el) => {
          el.classList.remove('is-valid', 'is-invalid');
        });
      })
      .catch((error) => {
        console.error('Error al registrar en Google Sheets:', error);
        alert('Hubo un inconveniente al conectar con Google Sheets. Por favor, revisa tu conexión o intenta nuevamente.');
      })
      .finally(() => {
        // Restaurar estado del botón
        btnSubmit.disabled = false;
        btnSpinner.classList.add('d-none');
        btnText.innerHTML = '<i class="bi bi-send-check me-2"></i> Completar Registro de Admisión';
      });
  });

  // ==========================================================
  // 6. INTERACCIÓN DESDE LAS CARDS DE CARRERAS HACIA EL FORMULARIO
  // ==========================================================
  const selectCareerButtons = document.querySelectorAll('.select-career-btn');
  selectCareerButtons.forEach((btn) => {
    btn.addEventListener('click', () => {
      const carreraElegida = btn.getAttribute('data-career');
      if (carreraElegida) {
        // Seleccionar automáticamente en el select
        selectCarrera.value = carreraElegida;
        aplicarFeedback(selectCarrera, validarCarrera(selectCarrera.value), 'carreraFeedback');

        // Scroll suave hacia el formulario
        const seccionRegistro = document.getElementById('registro');
        if (seccionRegistro) {
          seccionRegistro.scrollIntoView({ behavior: 'smooth' });
        }

        // Enfocar el primer input (Nombre) tras un pequeño retraso
        setTimeout(() => {
          inputNombre.focus();
        }, 400);
      }
    });
  });

  // ==========================================================
  // 7. CERRAR MENÚ MÓVIL AL HACER CLIC EN UN ENLACE
  // ==========================================================
  const navLinks = document.querySelectorAll('.navbar-nav .nav-link');
  const navbarCollapse = document.getElementById('navbarContent');
  navLinks.forEach((link) => {
    link.addEventListener('click', () => {
      if (navbarCollapse.classList.contains('show')) {
        const bsCollapse = bootstrap.Collapse.getInstance(navbarCollapse);
        if (bsCollapse) {
          bsCollapse.hide();
        }
      }
    });
  });

  // ==========================================================
  // 8. BOTÓN FLOTANTE "VOLVER ARRIBA"
  // ==========================================================
  window.addEventListener('scroll', () => {
    if (window.scrollY > 350) {
      btnScrollTop.classList.add('show');
    } else {
      btnScrollTop.classList.remove('show');
    }
  });

  btnScrollTop.addEventListener('click', () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  });
});

// ==========================================
// SUSCRIPCIÓN AL BOLETÍN INFORMATIVO (FOOTER)
// ==========================================
const formSuscripcion = document.getElementById('formSuscripcion');
if (formSuscripcion) {
  formSuscripcion.addEventListener('submit', async function (e) {
    e.preventDefault();
    
    const inputCorreo = document.getElementById('correoSuscripcion');
    const btnSuscribir = document.getElementById('btnSuscribir');
    const mensajeSub = document.getElementById('mensajeSuscripcion');
    
    const correo = inputCorreo ? inputCorreo.value.trim() : '';
    if (!correo) return;
    
    const textoOriginal = btnSuscribir ? btnSuscribir.textContent : 'Suscribirme';
    if (btnSuscribir) {
      btnSuscribir.disabled = true;
      btnSuscribir.textContent = 'Enviando...';
    }
    if (mensajeSub) mensajeSub.textContent = '';

    try {
      const resp = await fetch(scriptURL, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({
          tipo: 'suscripcion',
          correo: correo
        })
      });

      const resultado = await resp.text();

      if (resultado.trim() === 'OK') {
        if (mensajeSub) {
          mensajeSub.textContent = '¡Gracias por suscribirte!';
          mensajeSub.className = 'small mt-1 text-success fw-bold';
        }
        formSuscripcion.reset();
      } else {
        throw new Error(resultado);
      }
    } catch (err) {
      console.error('Error al suscribir:', err);
      if (mensajeSub) {
        mensajeSub.textContent = 'Error al suscribirse. Reintenta.';
        mensajeSub.className = 'small mt-1 text-danger fw-bold';
      }
    } finally {
      if (btnSuscribir) {
        btnSuscribir.disabled = false;
        btnSuscribir.textContent = textoOriginal;
      }
    }
  });
}


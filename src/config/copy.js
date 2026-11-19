// Baraja de textos de Plato & Co. (voz y tono: docs/brand/voz-y-tono.md).
// Un solo lugar para lo que el sitio le dice a quien lo visita. Español de Panamá, siempre de «usted».
// Sin dependencias. El objeto sale congelado; use t('area.clave', { var }) para leerlo.
//
// Marcas:
//  - OBLIGATORIOS: textos que no se pueden cambiar (aviso de demo, pago simulado, etc.).
//  - Los textos del bot viven en src/bot/texts.js; aquí solo se repiten las etiquetas que la interfaz muestra.
//  - Cifras y reseñas son ficticias y así se rotulan.

const profundo = (o) => {
  if (o && typeof o === 'object' && !Object.isFrozen(o)) {
    Object.values(o).forEach(profundo);
    Object.freeze(o);
  }
  return o;
};

const COPY = {
  // ---------------------------------------------------------------- marca y navegación
  marca: {
    nombre: 'Plato & Co.',
    lema: 'Mesa de barrio con ganas',
    lemaAlternos: [
      'Hecho al momento. Servido con ganas.',
      'Buen plato, sin vueltas.',
      'Su mesa ya lo está esperando.',
      'Cocina de barrio, pedido sin vueltas.',
      'Usted pide, nosotros cocinamos.',
    ],
    asistente: 'el asistente de Plato & Co.',
    creador: 'Panacea Logic AI',
  },

  nav: {
    inicio: 'Inicio',
    carta: 'Carta',
    asistente: 'Asistente',
    suPedido: 'Su pedido',
    seguimiento: 'Seguimiento',
    reservar: 'Reservar',
    pedir: 'Pedir',
    demo: 'Demo',
    admin: 'Entrar como administrador',
    reiniciar: 'Reiniciar demo',
    presentacion: 'Presentación guiada',
    volverCliente: 'Volver a la vista de cliente',
    abrirMenu: 'Menú',
    cerrar: 'Cerrar',
    carrito: 'Carrito, {n} productos',
    irInicio: '{marca}, ir al inicio',
  },

  // ---------------------------------------------------------------- portada
  portada: {
    eyebrow: 'Hamburguesas · pastas · parrilla · bowls',
    heroTitulo: 'Hecho al momento.',
    heroLead: 'Servido con ganas: platos generosos, ingredientes frescos y su mesa lista cuando llegue.',
    heroAlt: 'Hamburguesa con papas fritas y tomates cherry sobre una pizarra oscura',
    ctaPedir: 'Pedir ahora',
    ctaReservar: 'Reservar mesa',
    valoracion: '2.140 reseñas · cifras ficticias',
    sucursales: {
      eyebrow: 'Pedir o reservar',
      titulo: 'Elija su sucursal',
      subtitulo: 'Cada cocina le muestra lo que tiene hoy, si está abierta y cuánto tarda.',
    },
    masPedidos: {
      eyebrow: 'Los favoritos de la casa',
      titulo: 'Lo que más se pide',
      subtitulo: 'Los cuatro que la mesa repite.',
      verTodo: 'Ver toda la carta',
      region: 'Platos destacados',
    },
    comoFunciona: {
      eyebrow: 'Cómo funciona',
      frase: 'Su cliente escribe como a un amigo.',
      fraseCola: 'La cocina lo recibe sola y la factura sale por el mismo chat.',
      parrafo: 'Así trabaja Plato & Co. con un asistente de pedidos: el chat toma el pedido, la cocina lo ve al instante y la gerencia compara sus sucursales. En esta demo el chat simula WhatsApp y la factura es de ejemplo.',
      cta: 'Probar el asistente',
      pasos: [
        { icono: 'chat', titulo: 'Pide por WhatsApp', texto: 'Como le escribe a un amigo: «dos clásicas sin cebolla y una limonada». El asistente confirma platos, precio y dirección.' },
        { icono: 'cocina', titulo: 'La cocina lo recibe', texto: 'El pedido entra solo a la pantalla de cocina de la sucursal, con tiempos y alérgenos a la vista. Nadie lo copia a mano.' },
        { icono: 'pedido', titulo: 'Sale con su factura', texto: 'Pago con Yappy, tarjeta o efectivo, y la factura electrónica por el mismo chat (simulada en esta demo).' },
      ],
      rolesAria: 'Una mesa, tres personas',
      roles: [
        { rol: 'Quien pide', titulo: 'Pide por WhatsApp en un minuto', cta: 'Ver el chat' },
        { rol: 'Quien cocina', titulo: 'Ve cada pedido en pantalla, con alérgenos', cta: 'Ver la cocina' },
        { rol: 'Quien gerencia', titulo: 'Compara ventas y tiempos entre sucursales', cta: 'Ver indicadores' },
      ],
    },
    cifras: {
      titulo: 'Plato & Co. en cifras',
      sucursales: 'sucursales en Ciudad de Panamá',
      cocina: 'en cocina, en promedio',
      platos: 'platos en la carta',
      resenas: 'de 5 en 2.140 reseñas',
      nota: 'Cifras ficticias de la demostración.',
    },
    menuDia: {
      titulo: 'Menú del día',
      subtitulo: 'De lunes a viernes, de 11:00 a 15:00. Entrada, plato fuerte y bebida.',
      disponible: 'Disponible ahora',
      fuera: 'Solo almuerzo · lun a vie',
    },
    combos: {
      eyebrow: 'Para resolver rápido',
      titulo: 'Combos que ya vienen pensados',
      subtitulo: 'Platos que se llevan bien, listos en un solo toque.',
      verEnCarta: 'Ver en la carta',
      pedir: 'Pedir combo',
      porSeparado: 'Por separado',
      nota: 'En esta demo cada combo se agrega plato por plato, al precio de lista de la carta.',
    },
    resenas: {
      eyebrow: 'Lo que dicen en la mesa',
      titulo: '4,8 de 5',
      nota: 'Reseñas, nombres y cifras ficticias de la demostración.',
      aria: 'Reseñas',
      lista: [
        { estrellas: 5, texto: 'Pedí por WhatsApp a la hora del almuerzo y en media hora tenía la hamburguesa doble en la oficina, caliente y con la factura en el chat.', autor: 'Mariela R.', sucursal: 'Sucursal Centro' },
        { estrellas: 5, texto: 'El fettuccine es de los que uno repite. La reserva para ocho salió en un minuto y la mesa estaba lista al llegar.', autor: 'Jorge A.', sucursal: 'Sucursal Costa' },
        { estrellas: 4, texto: 'Porciones generosas y buen precio. El menú del día le arregla cualquier martes, y el brownie con helado no se negocia.', autor: 'Ana Lucía P.', sucursal: 'Sucursal Norte' },
      ],
    },
    cta: {
      titulo: '¿Con hambre?',
      lead: 'Pida en línea para entrega o retiro, o escríbale al asistente y él arma su pedido.',
      enLinea: 'Pedir en línea',
      porChat: 'Pedir por chat',
    },
    pie: {
      contacto: 'Contacto',
      telefonoNota: '(número ficticio)',
      horario: 'Todos los días, {abre} a {cierra}',
      entregas: 'Entregas en {zonas}',
      reservarAsistente: 'Reservar con el asistente',
      legal: '{marca} es un restaurante ficticio. Esta página es una demostración creada por {creador}: los platos, precios, direcciones, teléfonos, reseñas y pedidos son de ejemplo y no se procesa ninguna información real.',
      fotos: 'Fotografías: Unsplash (licencia Unsplash).',
    },
  },

  // ---------------------------------------------------------------- sucursal (estados que se repiten en varias pantallas)
  sucursal: {
    abierto: 'Abierto',
    abiertoAhora: 'Abierto ahora',
    cerrado: 'Cerrado',
    cierraA: 'Cierra a las {hora}',
    cierraPronto: 'Cierra pronto ({hora})',
    abreHoy: 'Abre hoy a las {hora}',
    abreManana: 'Abre mañana a las {hora}',
    horarioHoy: 'Hoy de {abre} a {cierra}',
    horarioNoDisponible: 'Horario no disponible',
    suSucursal: 'Su sucursal',
    elegir: 'Elegir',
    listoEn: 'Listo en {desde}–{hasta} min',
    llegaEn: 'llega en unos {min} min',
  },

  // ---------------------------------------------------------------- carta
  menu: {
    titulo: 'La carta',
    rotuloPlatos: '{n} platos',
    rotuloSucursales: '{n} sucursales',
    subtitulo: 'Elija su sucursal: solo verá lo que esa cocina tiene hoy.',
    categoriasAria: 'Categorías de la carta',
    categorias: {
      'Entradas': 'Para abrir la mesa y compartir mientras llega lo demás.',
      'Hamburguesas': 'Pan tostado y salsas de la casa. En las de carne, elija el término.',
      'Pastas': 'Pasta al dente, salsa caliente y porción para quedar contento.',
      'Platos fuertes': 'Parrilla, pescado y mariscos para cuando el hambre va en serio.',
      'Ensaladas y bowls': 'Frescos, completos y armados al momento.',
      'Postres': 'El final que la mesa siempre pide.',
      'Bebidas': 'Frías o calientes, para acompañar el plato o el rato.',
      'Combos': 'Platos que se llevan bien, listos en un solo toque.',
    },
    agrandarNota: 'Agrandar no tiene cargo adicional en esta demo.',
    siguiente: 'Siguiente',
    listo: 'Listo',
    verPedidoPagar: 'Ver mi pedido y pagar',
    pedir: 'Pedir',
    agregar: 'Agregar',
    agregarAlPedido: 'Agregar al pedido',
    agregarA: 'Agregar {nombre}',
    agregado: 'Agregado: {nombre}',
    agotado: 'Agotado hoy',
    agotadoCorto: 'Agotado',
    disponible: 'Disponible',
    picante: 'Picante',
    vegetariano: 'Vegetariano',
    alergenos: {
      contiene: 'Contiene: {lista}',
      ninguno: 'Sin alérgenos declarados',
      consulte: 'Consulte alérgenos',
      consultePersona: 'Consulte alérgenos con una persona',
    },
    personalizar: 'Personalice a su gusto',
    termino: 'Término de la carne',
    cantidad: 'Cantidad',
    cancelar: 'Cancelar',
    vacioCategoria: 'Por ahora no hay platos disponibles en esta sucursal.',
    carritoBarra: 'Ver carrito · {cuenta}',
    carritoVacioTitulo: 'Aún no ha agregado nada.',
    carritoVacio: 'Toque + en cualquier plato y lo verá aquí.',
    carritoTitulo: 'Su pedido',
    continuarPago: 'Continuar al pago',
    eliminar: 'Eliminar',
    subtotal: 'Subtotal',
    total: 'Total',
  },

  // ---------------------------------------------------------------- carrito y pago
  carrito: {
    vacio: {
      titulo: 'Aún está vacío',
      lead: 'Todavía no ha elegido nada. La carta tiene {n} platos hechos al momento.',
      cta: 'Ver la carta',
    },
    titulo: 'Su pedido',
    eyebrow: 'Paso final · {cuenta}',
    pasos: {
      tipo: '¿Cómo lo quiere?',
      direccion: '¿A dónde lo llevamos?',
      retiro: '¿Dónde lo retira?',
      pago: 'Forma de pago',
    },
    tipos: {
      entrega: 'Entrega a domicilio',
      retiro: 'Retiro en sucursal',
      retiroAyuda: 'Sin costo y sin espera de ruta',
    },
    direccion: {
      etiqueta: 'Dirección de entrega',
      marcador: 'Calle, casa o edificio y barrio',
      ayuda: 'Incluya su barrio. Zonas de ejemplo: {zonas}.',
    },
    chip: {
      atiende: 'Le atiende {sucursal} · llega en unos {min} min',
      sinZona: 'No encontramos esa zona en nuestra cobertura',
      retiroListo: 'Listo en unos {desde} a {hasta} min en {sucursal}',
    },
    metodos: {
      yappy: { nombre: 'Yappy', ayuda: 'Pago desde su celular' },
      tarjeta: { nombre: 'Tarjeta', ayuda: 'Débito o crédito' },
      efectivo: { nombre: 'Efectivo', ayuda: 'Pague al recibir o al retirar' },
    },
    // OBLIGATORIO: texto exacto de la demo (la interfaz pone «Pago simulado» en negrita).
    pagoSimulado: 'Pago simulado · Datos ficticios · No ingrese información real',
    pagoSimuladoCorto: 'Pago simulado',
    confirmar: 'Confirmar pedido · {total}',
    seguir: 'Seguir pidiendo',
    resumen: 'Resumen',
    cerrada: '{sucursal} está cerrada ahora ({detalle}). Puede enviar su pedido igualmente: quedará programado para cuando abra.',
    errores: {
      agotadoTitulo: 'Algo se agotó en esa sucursal.',
      agotadoItem: '“{nombre}” no está disponible ahora.',
      agotadoCambiar: 'Puede cambiarlo por:',
      agotadoQuitar: 'Quitarlo del pedido',
      sinZonaTitulo: 'Todavía no llegamos a esa dirección.',
      sinZonaCuerpo: 'Puede retirar su pedido en la sucursal que elija.',
      sinZonaCta: 'Cambiar a retiro',
      sinDireccion: 'Escriba la dirección de entrega o cambie a retiro en sucursal.',
      vacio: 'Su pedido está vacío.',
      generico: 'No pudimos procesar el pedido. Revise las cantidades e intente de nuevo.',
      pago: 'No pudimos registrar el pago simulado. Intente de nuevo.',
    },
    exito: 'Pedido {id} recibido. La cocina ya lo tiene en pantalla.',
  },

  // ---------------------------------------------------------------- seguimiento del pedido
  pedido: {
    eyebrow: 'Seguimiento',
    titulo: 'Pedido {id} · {tipo}',
    tipoEntrega: 'Entrega a domicilio',
    tipoRetiro: 'Retiro en sucursal',
    seguirCarta: 'Seguir en la carta',
    pasosAria: 'Estado del pedido',
    nombres: {
      Recibido: 'Recibido',
      EnCocina: 'En cocina',
      Listo: 'Listo',
      EnCamino: 'En camino',
      Entregado: 'Entregado',
    },
    estados: {
      Recibido: 'Lo recibimos. La cocina ya lo tiene en pantalla.',
      EnCocina: 'Lo estamos preparando, al momento.',
      Listo: 'Ya está listo y sale en breve.',
      EnCamino: 'Va en camino hacia usted.',
      Entregado: '¡Buen provecho! Su pedido fue entregado.',
    },
    estadosRetiro: {
      Listo: 'Ya está listo: puede pasar a retirarlo.',
      Entregado: '¡Buen provecho! Ya retiró su pedido.',
    },
    marcas: { hecho: 'Hecho', actual: 'Ahora', pendiente: 'Pendiente', completado: 'Completado' },
    etaConTiempo: 'Tiempo estimado: unos {min} min.',
    etaEtiqueta: 'tiempo estimado · prepara {sucursal}',
    entregadoA: 'entregado a las {hora} · hora de Panamá',
    retiradoA: 'retirado a las {hora} · hora de Panamá',
    retireEn: 'retire en · {direccion}',
    pedidoA: 'pedido a las {hora} · hora de Panamá · prepara {sucursal}',
    detalles: 'Detalles',
    prepara: 'Prepara',
    retiraEn: 'Retiro en',
    entregaEn: 'Entrega en',
    tiempoEstimado: 'Tiempo estimado',
    tiempoValor: 'unos {min} min',
    pago: 'Pago',
    pagoPendiente: 'Pendiente',
    factura: {
      titulo: 'Factura electrónica',
      sello: 'Simulada',
      nota: 'Documento de demostración: no tiene validez fiscal ni se envió a la DGI.',
      pendiente: 'La factura electrónica se emite cuando su pedido se entrega (simulada en esta demo).',
    },
    noEncontrado: {
      titulo: 'No encontramos ese pedido',
      lead: 'Puede que el enlace esté incompleto o que la demo se haya reiniciado y ese pedido ya no exista. Sus pedidos nuevos aparecen aquí apenas los confirma.',
      carta: 'Ir a la carta',
      asistente: 'Pedir por el asistente',
    },
  },

  // ---------------------------------------------------------------- asistente (chat)
  chat: {
    eyebrow: 'Demo en vivo · WhatsApp',
    frase: 'Lo que escribe su cliente.',
    fraseCola: 'Lo que ve su equipo, al instante.',
    pista: 'Para quien presenta: escriba «Quiero 2 hamburguesas clásicas sin cebolla y una limonada para Obarrio» y siga con las respuestas rápidas; a la derecha aparece, al instante, lo que ve el equipo.',
    columnaCliente: 'Cliente · lo que ve quien escribe',
    columnaPanel: 'Panel · lo que ve el restaurante',
    // OBLIGATORIOS (se muestran tal cual en el teléfono y bajo él).
    equipoRevisa: 'Una persona del equipo revisa los casos importantes',
    pasarPersona: 'Pasar a una persona',
    notaSimulado: 'Chat simulado · No se conecta a WhatsApp real',
    modoIA: 'Modo IA real (opcional)',
    modoIAAyuda: 'Si no está disponible, la demo vuelve al modo guion automáticamente.',
    marcador: 'Escriba un mensaje',
    etiquetaEntrada: 'Escriba su mensaje',
    respuestasAria: 'Respuestas rápidas',
    // Etiquetas idénticas a las que el bot ofrece hoy (src/core/chat-view.js y src/bot/texts.js).
    respuestas: {
      inicio: ['Hacer un pedido', 'Reservar mesa', 'Horarios y ubicación', 'Alérgenos', 'Pasar a una persona'],
      tipo: ['Entrega a domicilio', 'Retiro en sucursal'],
      pago: ['Yappy', 'Tarjeta', 'Efectivo contra entrega'],
      ocasion: ['No', 'Cumpleaños', 'Aniversario'],
      confirmar: 'Sí, confirmar',
      cancelar: 'Cancelar',
    },
    archivoRecibido: 'Recibimos su archivo. En esta demo no se guarda nada; una persona del equipo lo revisaría.',
    live: {
      titulo: 'En vivo',
      descripcion: 'Lo que hace la automatización mientras el cliente chatea: pedidos, reservas y avisos al equipo.',
      verCocina: 'Ver en cocina',
      verReservas: 'Ver reservas',
      listaAria: 'Actividad reciente, lo más nuevo primero',
      vacio: 'Aún no hay actividad. Haga un pedido o una reserva en el chat y aparecerá aquí al instante.',
      pie: 'Se actualiza solo, sin recargar la página.',
      pedidoCreado: 'Pedido {id} creado',
      pedidoPaso: 'Pedido {id} pasó a {estado}',
      avisoCliente: 'El cliente recibe el aviso en su chat.',
      requierePersona: 'Conversación marcada: Requiere persona',
      requierePersonaDetalle: 'El equipo la ve en el panel y responde por el chat.',
    },
  },

  // ---------------------------------------------------------------- panel del restaurante
  admin: {
    marcaEtiqueta: 'Administración',
    sucursal: 'Sucursal',
    todas: 'Todas',
    todasSucursales: 'Todas las sucursales',
    cocina: {
      titulo: 'Cocina',
      rol: 'Vista por rol · Cocina',
      sinPedidos: 'Sin pedidos',
      sinEntregas: 'Todavía no hay entregas.',
      avanzar: 'Avanzar a {estado}',
      retiro: 'Retiro en local',
      entrega: 'Entrega: {direccion}',
      sinDireccion: 'sin dirección',
      atencion: 'Atención',
      retrasado: 'Retrasado',
      yaNoExiste: 'El pedido ya no existe',
      canalWhatsApp: 'WhatsApp',
      canalWeb: 'Web',
    },
    reservas: {
      titulo: 'Reservas',
      rol: 'Vista por rol · Anfitrión',
      fecha: 'Fecha',
      franja: 'Franja horaria',
      lista: 'Reservas del día',
      plano: 'Plano de mesas',
      vacio: 'No hay reservas para esta fecha. Cuando alguien reserve por el chat, aparecerá aquí.',
      sinHorario: 'Esta sucursal no tiene horario de atención.',
      pendiente: 'Pendiente',
      confirmada: 'Confirmada',
      sinMesa: 'Sin mesa',
      sinOcasion: 'Sin ocasión especial',
      todasConMesa: 'Todas tienen mesa.',
      necesitanAtencion: '{n} necesitan atención (pendientes o sin mesa).',
      elija: 'Elija una reserva y luego una mesa del plano.',
      asignada: 'Listo: la mesa {mesa} quedó asignada a la reserva {reserva}.',
      errores: {
        mesa_ocupada: 'Esa mesa ya está ocupada en ese horario.',
        capacidad: 'La mesa no tiene capacidad suficiente.',
        no_encontrada: 'No se encontró la reserva o la mesa. Actualice la pantalla e intente de nuevo.',
        generico: 'No se pudo asignar la mesa.',
      },
    },
    menu: {
      titulo: 'Carta',
      rol: 'Vista por rol · Gerente',
      buscar: 'Buscar plato',
      buscarMarcador: 'Ej.: hamburguesa',
      todos: 'Todas',
      soloAgotados: 'Solo agotados ({n})',
      precio: 'Precio (US$)',
      agotado: 'Agotado',
      disponible: 'Disponible',
      vacio: 'No hay platos que coincidan con la búsqueda.',
    },
    indicadores: {
      titulo: 'Indicadores',
      rol: 'Vista por rol · Gerente',
      subtitulo: '{ambito} · pedidos del día',
      pedidos: 'Pedidos del día',
      ticket: 'Ticket promedio',
      ticketNota: 'ITBMS incluido',
      preparacion: 'Tiempo de preparación',
      preparacionNota: 'promedio hasta “Listo”',
      sinListos: 'sin pedidos listos',
      canalLider: 'Canal con más pedidos',
      comparativa: 'Comparativa entre sucursales',
      masVendidos: 'Platos más vendidos',
      canales: 'Web y WhatsApp',
      resumenCorreo: 'Resumen diario por correo',
      sinDatos: 'Sin datos',
      empate: 'Empate',
      simulado: 'Simulado',
      correoPie: 'Enviado automáticamente a {para} (ficticio). Es una simulación: no se envía ningún correo real.',
    },
    // Cuerpo del correo diario (src/core/metrics.js: dailySummary).
    resumenDiario: {
      asunto: '{marca} · Resumen diario · {dia}',
      saludo: 'Estimado equipo de gerencia:',
      intro: 'Este es el resumen de {dia}. El detalle completo está en el panel.',
      sinPedidos: '{sucursal}: sin pedidos registrados hoy.',
      linea: '{sucursal}: {n} pedidos ({web} web, {whatsapp} WhatsApp), ticket promedio {ticket}.',
      cierre: 'Quedamos a la orden.',
      firma: '{marca}',
    },
  },

  // ---------------------------------------------------------------- presentación (recorrido guiado de 6 pasos)
  presentacion: {
    boton: 'Presentación',
    botonAria: 'Iniciar el modo Presentación (recorrido guiado)',
    barraAria: 'Modo Presentación',
    anterior: 'Anterior',
    siguiente: 'Siguiente',
    hacerPorMi: 'Hacer por mí',
    pausar: 'Pausar',
    continuar: 'Continuar',
    salir: 'Salir',
    terminar: 'Terminar',
    cta: 'Agende su diagnóstico gratis',
    mensajeFinal: 'Cero pedidos copiados a mano, en todas sus sucursales',
    reiniciado: 'Datos reiniciados para la presentación',
    pausado: 'En pausa. Pulse «Continuar» para seguir.',
    siguaMano: 'No se pudo completar este paso solo. Puede seguir a mano: pulse «Siguiente».',
    terminada: 'Presentación terminada.',
    terminadaRestaurada: 'Presentación terminada. El plato agotado volvió a estar disponible.',
    // Mismos ids y mismo orden que STEPS en src/core/tour.js.
    pasos: {
      pedido: {
        titulo: 'El cliente pide por WhatsApp',
        nota: 'Su cliente escribe como habla. El asistente arma el pedido, pide dirección y forma de pago, muestra el resumen con el total y el cliente confirma. Con Yappy, el comprobante llega por el chat. El pedido entra solo y va a la sucursal que atiende esa zona.',
        auto: 'Hacer el pedido por mí',
      },
      envivo: {
        titulo: 'El restaurante lo ve al instante',
        nota: 'Mientras el cliente chatea, el panel En vivo muestra el pedido y el aviso al equipo. Nadie lo copia a mano ni contesta mensajes uno por uno.',
        auto: null,
      },
      cocina: {
        titulo: 'La cocina avanza el pedido',
        nota: 'La cocina lo ve en su pantalla, con el pago ya confirmado, y lo mueve de etapa con un toque. Cada cambio le llega al cliente por el chat; la factura simulada sale en cuanto se confirma el pago (o al entregar, si paga en efectivo).',
        auto: 'Avanzar el pedido por mí',
      },
      agotado: {
        titulo: 'Un plato se agota',
        nota: 'Marcar un plato como agotado toma un toque. Si un cliente lo pide, el asistente no promete lo que no hay y le ofrece alternativas del mismo tipo.',
        auto: 'Agotar el plato por mí',
      },
      reserva: {
        titulo: 'Una reserva para 4',
        nota: 'La reserva se pide con una sola frase. El sistema asigna la mesa según la capacidad y la anfitriona la ve de inmediato en el plano.',
        auto: 'Reservar por mí',
      },
      cierre: {
        titulo: 'Todo medido, sin papeles',
        nota: 'Cero pedidos copiados a mano, en todas sus sucursales. Los indicadores se arman solos con cada pedido y cada reserva.',
        auto: null,
      },
    },
  },

  // ---------------------------------------------------------------- ticket y factura simulada
  ticket: {
    pedido: 'Pedido',
    cliente: 'Cliente',
    sucursal: 'Sucursal',
    fecha: 'Fecha',
    hora: 'Hora',
    tipo: 'Tipo',
    pago: 'Pago',
    subtotal: 'Subtotal',
    itbms: 'ITBMS 7%',
    total: 'Total',
    gracias: 'Gracias por su pedido',
    despedida: 'Buen provecho. Aquí estamos cuando vuelva.',
    factura: 'Factura simulada · sin validez fiscal',
    cufe: 'CUFE (ficticio)',
    demo: 'Documento de demostración · datos ficticios',
  },

  // ---------------------------------------------------------------- sistema
  sistema: {
    // OBLIGATORIO: el aviso de demo no se reescribe.
    bannerDemo: 'Demo de Panacea Logic AI · Datos ficticios · No ingrese información real',
    bannerAria: 'Aviso de demostración',
    bannerCorto: 'Demo · datos ficticios',
    bannerCta: 'Agende un diagnóstico gratis de 15 minutos',
    bannerCtaCorto: 'Agendar diagnóstico',
    noEncontrado: {
      eyebrow: 'Error 404',
      titulo: 'Esa mesa no está en el salón.',
      lead: 'El enlace no lleva a ninguna página de {marca}. Vuelva al inicio o abra la carta.',
      inicio: 'Volver al inicio',
      carta: 'Ver la carta',
    },
    sinConexion: {
      titulo: 'Sin conexión',
      lead: 'La demo sigue con los datos que ya cargó. Cuando vuelva la conexión, todo se actualiza.',
    },
    cargando: {
      titulo: 'Preparando su mesa',
      lead: 'Un momento, ya casi.',
    },
    error: {
      titulo: 'Algo no salió como esperábamos',
      lead: 'Intente de nuevo. Si sigue igual, reinicie la demo y vuelva a empezar.',
      reintentar: 'Intentar de nuevo',
    },
    reiniciar: {
      titulo: '¿Desea reiniciar la demo?',
      confirmacion: '¿Desea reiniciar la demo? Se borrarán los cambios y volverán los datos de ejemplo.',
      confirmar: 'Reiniciar',
      cancelar: 'Mantener',
      hecho: 'Demo reiniciada. Volvieron los datos de ejemplo.',
    },
    toasts: {
      agregado: 'Agregado: {nombre}',
      quitado: 'Quitado: {nombre}',
      precioGuardado: 'Precio guardado: {nombre}',
      agotado: '{nombre} quedó agotado',
      disponible: '{nombre} volvió a estar disponible',
    },
    vacios: {
      carrito: 'Aún no ha agregado nada. Toque + en cualquier plato y lo verá aquí.',
      pedidos: 'Todavía no hay pedidos. Cuando llegue el primero, aparecerá aquí.',
      reservas: 'Todavía no hay reservas. Cuando alguien reserve por el chat, aparecerá aquí.',
      busqueda: 'No encontramos nada con esa búsqueda. Pruebe con otra palabra.',
      actividad: 'Aún no hay actividad. Haga un pedido o una reserva en el chat y aparecerá aquí.',
    },
    cerrar: 'Cerrar',
    cancelar: 'Cancelar',
    volver: 'Volver',
  },

  // ---------------------------------------------------------------- metadatos
  meta: {
    titulo: 'Plato & Co. · Mesa de barrio con ganas',
    descripcion: 'Pida por WhatsApp o en línea, reserve su mesa y siga el pedido. Demo de pedidos y reservas para restaurantes, con datos ficticios.',
    ogTitulo: 'Plato & Co. · Mesa de barrio con ganas',
    ogDescripcion: 'Pida por WhatsApp o en línea, reserve su mesa y siga el pedido. Una demo de pedidos, cocina y reservas para restaurantes.',
    paginas: {
      inicio: 'Inicio',
      menu: 'Carta',
      carrito: 'Su pedido',
      chat: 'Asistente',
      pedido: 'Seguimiento de pedido',
      'admin-cocina': 'Cocina',
      'admin-reservas': 'Reservas',
      'admin-menu': 'Carta',
      'admin-indicadores': 'Indicadores',
    },
  },
};

export const copy = profundo(COPY);

// Textos que no se pueden cambiar: aviso de demo, pago simulado, chat simulado y ayuda humana.
// tests/copy.test.js comprueba que el texto exacto exista aquí y en la interfaz.
export const OBLIGATORIOS = Object.freeze({
  'sistema.bannerDemo': 'Demo de Panacea Logic AI · Datos ficticios · No ingrese información real',
  'carrito.pagoSimulado': 'Pago simulado · Datos ficticios · No ingrese información real',
  'chat.equipoRevisa': 'Una persona del equipo revisa los casos importantes',
  'chat.notaSimulado': 'Chat simulado · No se conecta a WhatsApp real',
  'chat.pasarPersona': 'Pasar a una persona',
  'chat.modoIA': 'Modo IA real (opcional)',
});

const dev = () => {
  try { return !(import.meta.env && import.meta.env.PROD); } catch { return true; }
};
const avisar = (msg) => { if (dev() && typeof console !== 'undefined') console.warn(msg); };

// Lee un texto por ruta: t('pedido.estados.EnCocina'), t('carrito.confirmar', { total: 'US$ 8.95' }).
// Reemplaza {nombre}. Si falta la clave devuelve '' y avisa en desarrollo; si falta una variable deja {nombre} visible.
export function t(ruta, vars = {}) {
  const valor = String(ruta).split('.').reduce((o, k) => (o != null && Object.prototype.hasOwnProperty.call(Object(o), k) ? o[k] : undefined), copy);
  if (typeof valor !== 'string') {
    avisar(`[copy] Falta el texto «${ruta}»${valor === undefined ? '' : ' (no es un texto)'}`);
    return '';
  }
  return valor.replace(/\{(\w+)\}/g, (m, k) => {
    if (vars[k] === undefined || vars[k] === null) { avisar(`[copy] «${ruta}» necesita {${k}}`); return m; }
    return String(vars[k]);
  });
}

// Marca → texto de otra sucursal, etc.: valores globales que casi todo texto puede usar.
export const MARCA = Object.freeze({ marca: COPY.marca.nombre, creador: COPY.marca.creador });
export const tm = (ruta, vars = {}) => t(ruta, { ...MARCA, ...vars });

// «1 plato», «3 platos».
export const plural = (n, uno, varios) => `${n} ${n === 1 ? uno : varios}`;

// «US$ 8.95» (punto decimal, como en el resto de la app).
export const usd = (n) => `US$ ${Number(n).toFixed(2)}`;

// 'En cocina' → 'EnCocina' (clave de pedido.estados / pedido.nombres).
export const claveEstado = (estado) => String(estado ?? '').split(/\s+/).filter(Boolean).map((p) => p.charAt(0).toUpperCase() + p.slice(1)).join('');

export default copy;

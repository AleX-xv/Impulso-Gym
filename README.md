# IMPULSO — Tu espacio de entrenamiento

Proyecto con HTML, CSS y JavaScript y un pequeño servidor Node.js, preparado para Azure App Service en Linux con Node 24 LTS. El servidor no tiene dependencias externas y no requiere compilación. Los archivos de la página también pueden alojarse como contenido estático.

## Desplegar en Azure App Service (opción actual)
1. En Crear aplicación web selecciona Publicar: Código; pila: Node 24 LTS; sistema operativo: Linux.
2. Selecciona una región con disponibilidad para tu suscripción y el plan Gratis F1 para esta demostración.
3. No añadas base de datos: rutinas e historial siguen guardándose en el navegador.
4. Sube todos los archivos de esta carpeta a la raíz de tu repositorio GitHub, incluidos package.json, package-lock.json y server.cjs.
5. En el recurso de Azure, abre Centro de implementación y conecta el repositorio y la rama de GitHub.
6. Configura el comando de inicio del recurso como `npm start`. El script ejecuta `node server.cjs` y escucha en el puerto que proporciona Azure mediante PORT.
7. Espera a que el despliegue de GitHub Actions termine correctamente y abre la URL del recurso.

Para probar con Node.js instalado: abre una terminal en la carpeta del proyecto, ejecuta `npm start` y abre http://localhost:8080. No necesitas instalar paquetes. El servidor publica únicamente los siete archivos públicos de la web; no expone su configuración ni este README.

Guía oficial: https://learn.microsoft.com/azure/app-service/quickstart-nodejs

## Funciones
- Panel con sesiones y minutos de la semana actual, de lunes a domingo.
- Objetivo semanal editable y calendario de actividad.
- Biblioteca de seis rutinas de demostración con filtros por fuerza, cardio y movilidad.
- Mis rutinas: crear, editar y eliminar hasta 100 rutinas propias.
- Editor con nombre, categoría, lugar, duración estimada y descripción opcional.
- Entre 1 y 20 ejercicios por rutina, con series/repeticiones o tiempo; se pueden reordenar y quitar.
- Entrenar con tus rutinas y registrar los minutos realmente realizados.
- Historial con una copia del nombre y tipo de la sesión: se conserva aunque edites o elimines su rutina.
- Detalle de rutina con ejercicios marcables y registro de minutos realmente realizados.
- Historial persistente en este navegador; eliminación de registros.
- Temporizador de descanso de 30, 60 o 90 segundos, con pausa y reinicio.
- Diseño adaptable a móviles y uso con teclado.
- Página Ideas y videos: buscador por tema, nueve plantillas de ejemplo y enlaces a búsquedas de YouTube.
- Consulta real de ejercicios relacionados mediante la API pública de wger, con créditos y enlaces a la técnica en YouTube.
- Abrir una idea en el editor como borrador, completar sus series o duración y guardarla como rutina propia.

No hay cuentas ni sincronización. Los registros se guardan en localStorage del navegador. Las rutinas son ejemplos de contenido para la demo, no una prescripción personalizada. Los minutos de las tarjetas son orientativos y el usuario registra su duración real.

## Crear tu rutina
1. Abre **Mis rutinas** y pulsa **Crear rutina**.
2. Escribe el nombre, elige tipo, lugar y duración estimada (1–300 minutos).
3. Añade ejercicios. En el segundo campo puedes escribir, por ejemplo, `3 × 12, descanso de 60 s` o `5 minutos`.
4. Usa las flechas para cambiar el orden y la × para quitar un ejercicio. Siempre debe quedar al menos uno.
5. Guarda. En la tarjeta puedes entrenar con ella, editarla o eliminarla.

El formulario es un borrador hasta que guardas: Cancelar o Escape descarta sus cambios. Eliminar una rutina requiere confirmación y conserva los entrenamientos anteriores. Al actualizar desde la versión anterior se conserva el historial y el objetivo semanal.

Las tipografías se cargan desde Google Fonts. Si no hay conexión, se usan las fuentes de respaldo del sistema. No se necesitan claves para esta integración ni imágenes externas.

## Ideas, API y YouTube
1. Entra a **Ideas y videos** desde el menú o el acceso en el panel.
2. Busca, por ejemplo, `piernas`, `espalda`, `abdomen`, `cardio` o `en casa`.
3. Las plantillas locales se filtran por palabras relacionadas. **Usar esta idea** abre un borrador en Mis rutinas; no lo guarda sin que completes los campos y pulses Guardar.
4. El catálogo externo consulta `https://wger.de/api/v2/exerciseinfo/` con un filtro de categoría o equipo. Se priorizan traducciones al español y se muestran hasta seis ejercicios con autor y fuente. La consulta tiene cancelación al cambiar la búsqueda, tiempo de espera de 15 segundos, caché en memoria durante la visita y botón Reintentar.
5. Los botones de YouTube abren otra pestaña con la búsqueda correspondiente a la rutina o al ejercicio. No se usa la API de YouTube, no se descargan videos ni se presentan resultados como videos seleccionados o verificados.

Las nueve plantillas son contenido de ejemplo de IMPULSO. El catálogo de wger se consulta en vivo; no es el origen de esas plantillas. Si no hay una plantilla para el término, el enlace general a YouTube sigue disponible. Si falla la API, la página informa el error y permite reintentar sin bloquear las ideas locales.

La API externa necesita conexión a Internet. Los endpoints públicos de ejercicios de wger no requieren autenticación; documentación: https://wger.readthedocs.io/en/latest/api/api.html. Las fichas muestran la atribución y la licencia de la fuente cuando está disponible. No se copian imágenes ni instrucciones de la API.

Archivos nuevos: `ideas.html` es la segunda página; `ideas-data.js` contiene las plantillas; `ideas.js` controla búsqueda, consulta de la API y enlaces; `ideas.css` define su presentación.

## Probar
Abre index.html con Chrome o Edge. Para una prueba más fiel al despliegue, sirve esta carpeta con un servidor HTTP local. El almacenamiento de archivos file:// depende del navegador; al publicar, los datos pertenecerán al dominio de Azure y no se trasladarán desde la vista local.

## Alternativa: publicar en Static Web Apps desde GitHub
1. Crea un repositorio nuevo en GitHub, por ejemplo impulso-gym.
2. Sube todos los archivos de esta carpeta directamente a la raíz: index.html, styles.css, app.js, ideas.html, ideas.css, ideas.js, ideas-data.js y README.md. No subas el ZIP como un solo archivo.
3. En Azure crea un recurso Static Web Apps.
4. Selecciona tu suscripción, grupo de recursos y plan Free.
5. Conecta GitHub y selecciona el repositorio y su rama (normalmente main).
6. Build preset: Custom; App location: /; API location: vacío; Output location: vacío.
7. Crea el recurso y espera el resultado del despliegue en GitHub > Actions.
8. Abre la URL del recurso en Azure. Los siguientes cambios en la rama conectada se desplegarán automáticamente.

Azure genera el workflow y configura la conexión. No hace falta agregar un archivo de GitHub Actions por adelantado.
La ubicación API de Azure queda vacía porque wger es una API externa consultada desde el navegador, no un backend desplegado en este proyecto.

## Comprobación manual
- Abre Rutinas y prueba cada filtro.
- En Mis rutinas crea una sesión con dos ejercicios, cambia el orden y guarda. Recarga y comprueba que se conserve.
- Entrena con una rutina propia; edítala y elimínala después. El registro anterior debe conservar su nombre original incluso al recargar.
- Comprueba que Cancelar no guarde cambios y que el editor exija nombre, duración válida y al menos un ejercicio completo.
- Abre una rutina: Registrar debe estar deshabilitado hasta marcar todos los ejercicios.
- Completa la rutina, ajusta minutos y registra. Comprueba panel e historial y recarga.
- Modifica el objetivo semanal. Borra el registro y comprueba que el panel se actualice.
- Prueba iniciar, pausar, continuar y reiniciar el temporizador; cambia su duración.
- Revisa el diseño en móvil y el recorrido con teclado.
- En Ideas y videos busca piernas, verifica ejercicios del catálogo y revisa que los enlaces de YouTube correspondan al tema.
- Usa una idea, completa sus series y guarda como rutina propia. Comprueba que Cancelar no cree ninguna rutina.
- Busca un tema sin plantilla: debe ofrecer la búsqueda en YouTube, sin inventar ejercicios de la API.

# PitWall F1 Hub

Creá una aplicación web para fans de la Fórmula 1 llamada "PitWall" (nombre provisorio). Toda la interfaz en español. Diseño moderno, oscuro, inspirado en la estética de la F1: fondo casi negro, rojo como color de acento, tipografía deportiva y limpia, esquinas redondeadas, responsive (pensado primero para celular y que se vea bien en escritorio).

Estructura y rutas:

1. Landing page pública ("/")

   - Hero con título, subtítulo y botones "Iniciar sesión" y "Crear cuenta".

   - Sección con 4 tarjetas que muestran las funciones: Calendario y resultados, Tablas de pilotos y constructores, Pilotos favoritos, Predicciones (esta última con la etiqueta "Próximamente").

   - Footer simple.

2. Autenticación ("/login" y "/registro")

   - Formularios de email y contraseña, con validación y mensajes de error claros.

   - Por ahora solo maquetá los formularios; la conexión con Supabase la hago yo después.

3. Zona privada (layout con barra lateral en escritorio y menú inferior en celular)

   - "/inicio": resumen con la próxima carrera (nombre, circuito, fecha) y un acceso rápido a cada sección.

   - "/calendario": lista de todos los Grandes Premios de la temporada, con fecha, país y estado (finalizado o próximo).

   - "/campeonato": dos pestañas, "Pilotos" y "Constructores", cada una con una tabla de posiciones (posición, nombre, equipo, puntos, victorias).

   - "/ajustes": pestañas "Perfil", "Privacidad" y "Notificaciones" con formularios de ejemplo (nombre de usuario, avatar, switches de privacidad). Solo maquetados.

Importante:

- Usá datos de ejemplo (mock data) guardados en un archivo separado, por ejemplo src/data/mockData.ts, para que después pueda reemplazarlos por datos reales.

- Código ordenado: componentes reutilizables, una carpeta por tipo (components, pages, data, lib) y tipos de TypeScript para piloto, equipo y gran premio.

- No agregues todavía funciones de favoritos, fondos de pantalla ni predicciones. Solo la estructura descripta.

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/37e13342-624d-4b8e-b513-2a1d6c355cdd).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```

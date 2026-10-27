# nuevaweb_tallerAWS_Kiro

Una nueva web (taller AWS_Kiro): un juego de **Bingo** hecho con HTML, CSS y JavaScript puros.

**Web publicada:** https://rubenlopez2002.github.io/nuevaweb_tallerAWS_Kiro/

## Qué hace

- Saca los números del 1 al 90, sin repetir.
- Cada número sale con una animación de bola.
- Modo automático: sale un número nuevo solo, cuando la voz termina de hablar.
- Botón "Sacar número" para sacar uno a mano.
- Un tablero del 1 al 90 donde se tachan los números que ya salieron.
- Lista de los números que ya salieron.
- Colores vivos: cada decena (1-10, 11-20...) tiene su color.
- Voz de hombre que dice cada número en 4 idiomas, en este orden: español, inglés, francés y alemán.
- Botón "Voz" para apagar o encender la voz.
- Una línea muestra qué idiomas tiene tu equipo (✅ o ❌).
- Botón "Nuevo juego" para empezar de cero.

## Archivos

| Archivo | Para qué sirve |
|---|---|
| `index.html` | La página |
| `style.css` | Colores y animaciones |
| `script.js` | El juego y la voz |
| `Bingo.exe` | Programa para Windows: abre el juego en tu navegador, sin internet |
| `launcher/Launcher.cs` | Código del programa `Bingo.exe` |
| `build-exe.bat` | Vuelve a crear `Bingo.exe` si cambias la web |

## Cómo usarlo

- **En internet:** abre la web publicada de arriba.
- **En tu PC:** haz doble clic en `Bingo.exe` (solo Windows). También vale abrir `index.html`.

## La voz

La voz viene de tu navegador y de Windows. Si falta un idioma, el juego lo salta.

Para añadir voces en Windows: Configuración → Hora e idioma → Voz → Agregar voces. Después cierra el navegador y ábrelo otra vez.

## Versiones

Rama actual: `v0.1`. GitHub Pages publica desde esa rama.

- **v0.1.1** – Etiqueta de versión y actualización de caché.
- **v0.1** – Bingo con animación, modo automático, colores, voz en 4 idiomas y `Bingo.exe`.

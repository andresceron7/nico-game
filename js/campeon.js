/* =========================================================
   Campeón del 1er torneo (21 nov 2026) como personaje invitado
   ---------------------------------------------------------
   Mientras activo = true:
     - En el intro aparece junto a Nico y dice
       "HOLA, SOY {nombre} Y GANÉ EL PRIMER TORNEO."
     - En el partido reemplaza al segundo Nico (mismas reglas: aparece
       a las 0:20 con 70 puntos o más, ataja igual y los puntos valen x2),
       con el aviso "¡LLEGÓ {nombre}!".
   El nombre se toma del 1º del podio del 1er torneo (js/torneo1.js).
   El personaje se dibuja en js/sprites.js (Sprites.champ), con el rostro
   basado en su foto y uniforme de fútbol rojo.

   PARA RETIRARLO ("Retira al ganador del primer torneo"):
   cambia activo a false. Todo vuelve a la versión con los dos Nicos.
   ========================================================= */
window.CAMPEON = {
  activo: true,
  nombre: (window.TORNEO1 && window.TORNEO1[0] && window.TORNEO1[0].name) || 'EL CAMPEÓN',
};

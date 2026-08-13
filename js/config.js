/**
 * Configuración pública de Schedio para la web.
 *
 * Estos dos valores NO son secretos: las claves de cliente de Firebase
 * identifican el proyecto, no dan acceso. La seguridad real está en
 * `firestore.rules` (ver el bloque `betaSignups` del README). Van en todos los
 * bundles web de Firebase que existen, este incluido.
 *
 * Cópialos de `schedio-mobile/.env.local`:
 *   apiKey    <- EXPO_PUBLIC__FIREBASE_API_KEY
 *   projectId <- EXPO_PUBLIC__FIREBASE_PROJECT_ID
 *
 * Mientras estén sin rellenar, el formulario detecta que no hay backend y
 * ofrece enviar los datos por correo, en lugar de fallar en silencio.
 */
window.SCHEDIO_CONFIG = {
  apiKey: 'AIzaSyCZbNOQ8Q_ns69iPG7t27zTohiI8p3RuZE',
  projectId: 'schedio-b3958',

  /** Colección donde caen las altas de la beta. */
  collection: 'betaSignups',

  /** Vía de respaldo si Firestore no está configurado o falla. */
  contactEmail: 'schedio.contacto@gmail.com',
};

export const metadata = { title: "Política de privacidad — OpenGig" };

export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-12 prose prose-neutral dark:prose-invert">
      <h1>Política de privacidad</h1>

      <h2>Responsable del tratamiento</h2>
      <p>
        <strong>OpenGig</strong> — proyecto académico de Alberto Fernández Azcoaga, Escuela de
        Ingeniería Informática, Universidad de Oviedo.
      </p>

      <h2>Datos que recogemos</h2>
      <ul>
        <li>
          <strong>Cuenta de usuario:</strong> dirección de correo electrónico y contraseña cifrada,
          necesarias para el registro y la autenticación.
        </li>
        <li>
          <strong>Perfil público:</strong> nombre de usuario, nombre para mostrar, biografía e
          imagen de perfil que el usuario añade voluntariamente.
        </li>
        <li>
          <strong>Contenido generado:</strong> conciertos publicados, likes, entradas de calendario
          y notificaciones.
        </li>
      </ul>

      <h2>Finalidad y base jurídica</h2>
      <p>
        Los datos se tratan exclusivamente para prestar el servicio de calendario colaborativo de
        conciertos (ejecución de un contrato, art. 6.1.b RGPD). No se ceden a terceros ni se usan
        con fines publicitarios.
      </p>

      <h2>Conservación</h2>
      <p>
        Los datos se conservan mientras la cuenta esté activa. El usuario puede solicitar la
        eliminación de su cuenta en cualquier momento desde su perfil.
      </p>

      <h2>Derechos</h2>
      <p>
        Puedes ejercer tus derechos de acceso, rectificación, supresión, portabilidad y limitación
        del tratamiento contactando a través del repositorio del proyecto.
      </p>

      <h2>Seguridad</h2>
      <p>
        Las contraseñas se almacenan cifradas con bcrypt. Las comunicaciones se realizan sobre
        HTTPS. El acceso a la base de datos está protegido por Row Level Security (RLS).
      </p>

      <p className="text-sm text-muted-foreground mt-8">Última actualización: junio de 2026.</p>
    </div>
  );
}

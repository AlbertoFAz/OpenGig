export const metadata = { title: "Aviso legal — OpenGig" };

export default function LegalPage() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-12 prose prose-neutral dark:prose-invert">
      <h1>Aviso legal</h1>

      <h2>Titular del sitio web</h2>
      <p>
        <strong>OpenGig</strong> es un proyecto académico desarrollado como Trabajo de Fin de Grado
        en la Escuela de Ingeniería Informática de la Universidad de Oviedo por Alberto Fernández
        Azcoaga.
      </p>

      <h2>Objeto y ámbito de aplicación</h2>
      <p>
        El presente aviso legal regula el uso del sitio web OpenGig (en adelante, «el sitio»), cuya
        finalidad es ofrecer un calendario colaborativo de conciertos y eventos musicales en vivo.
      </p>

      <h2>Propiedad intelectual</h2>
      <p>
        Los contenidos del sitio —código fuente, diseño, textos e imágenes propias— son propiedad de
        su autor salvo indicación expresa en contrario. Los contenidos publicados por los usuarios
        son responsabilidad exclusiva de quienes los generan.
      </p>

      <h2>Responsabilidad</h2>
      <p>
        OpenGig no garantiza la exactitud ni la vigencia de los eventos publicados por terceros. El
        uso del sitio es responsabilidad del propio usuario.
      </p>

      <h2>Legislación aplicable</h2>
      <p>
        Este aviso legal se rige por la legislación española vigente, en particular la Ley 34/2002
        de Servicios de la Sociedad de la Información y Comercio Electrónico (LSSI-CE).
      </p>

      <p className="text-sm text-muted-foreground mt-8">Última actualización: junio de 2026.</p>
    </div>
  );
}

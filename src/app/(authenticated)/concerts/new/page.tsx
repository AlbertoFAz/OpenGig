import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ConcertForm } from "@/components/concert/ConcertForm";

export default function NewConcertPage() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <Card>
        <CardHeader>
          <CardTitle>Publicar concierto</CardTitle>
          <CardDescription>
            Completa el formulario para añadir un concierto al calendario público.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ConcertForm />
        </CardContent>
      </Card>
    </div>
  );
}

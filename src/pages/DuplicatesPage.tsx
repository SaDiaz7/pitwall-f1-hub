import { AlbumNav } from "@/components/AlbumNav";
import { PageHeader } from "@/components/PageHeader";
import { RecyclePanel } from "@/components/RecyclePanel";
import { TradesPanel } from "@/components/TradesPanel";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export function DuplicatesPage() {
  return (
    <>
      <PageHeader title="Repetidas" subtitle="Reciclá las que te sobran o intercambialas con tus amigos." />
      <AlbumNav />

      <Tabs defaultValue="reciclar">
        <TabsList className="mb-4">
          <TabsTrigger value="reciclar">Reciclar</TabsTrigger>
          <TabsTrigger value="intercambios">Intercambios</TabsTrigger>
        </TabsList>

        <TabsContent value="reciclar">
          <RecyclePanel />
        </TabsContent>
        <TabsContent value="intercambios">
          <TradesPanel />
        </TabsContent>
      </Tabs>
    </>
  );
}
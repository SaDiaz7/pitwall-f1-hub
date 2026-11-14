import { useEffect, useState } from "react";
import { AlbumNav } from "@/components/AlbumNav";
import { PageHeader } from "@/components/PageHeader";
import { RecyclePanel } from "@/components/RecyclePanel";
import { TradesPanel } from "@/components/TradesPanel";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export function DuplicatesPage() {
  const [tab, setTab] = useState("reciclar");

  // Las notificaciones de intercambio abren esta página con #intercambios.
  useEffect(() => {
    if (window.location.hash === "#intercambios") setTab("intercambios");
  }, []);

  return (
    <>
      <PageHeader title="Repetidas" subtitle="Reciclá las que te sobran o intercambialas con tus amigos." />
      <AlbumNav />

      <Tabs value={tab} onValueChange={setTab}>
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
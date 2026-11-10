import { createFileRoute } from "@tanstack/react-router";
import { DataError } from "@/components/DataError";
import { NoticiasPage } from "@/pages/NoticiasPage";
import { DEFAULT_NEWS_LANG, getF1News, type F1NewsItem } from "@/lib/f1-news";

export const Route = createFileRoute("/_privado/noticias")({
  head: () => ({
    meta: [{ title: "Noticias — PitWall" }],
  }),
  loader: async () => {
    const news = await getF1News({ data: { lang: DEFAULT_NEWS_LANG } }).catch((): F1NewsItem[] | null => null);
    return { news };
  },
  errorComponent: DataError,
  component: NoticiasPage,
});
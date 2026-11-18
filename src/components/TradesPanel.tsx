import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { StickerCard } from "@/components/StickerCard";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAlbum } from "@/hooks/useAlbum";
import { getInitials } from "@/hooks/useProfile";
import { supabase } from "@/integrations/supabase/client";
import {
  albumError,
  type FriendDuplicate,
  type TradeCard,
  type TradeFriend,
  type TradeItem,
} from "@/lib/album-trades";
import { cn } from "@/lib/utils";

type Message = { type: "ok" | "error"; text: string } | null;

// Cartelitos debajo de una carta: te avisan quién la tiene y qué versión es.
type TileNote = { text: string; tone: "new" | "foil" | "owned" | "info" };

const NOTE_STYLES: Record<TileNote["tone"], string> = {
  new: "bg-primary text-primary-foreground",
  foil: "border border-primary/60 text-primary",
  owned: "text-muted-foreground",
  info: "bg-secondary text-secondary-foreground",
};

type FriendCardStatus = { has_card: boolean; has_foil: boolean };

const keyOf = (card: { card_id: string; foil: boolean }) => `${card.card_id}|${card.foil ? 1 : 0}`;
const nameOf = (user: { username: string | null; display_name: string | null }) =>
  user.display_name || user.username || "Sin nombre";

const dateFormatter = new Intl.DateTimeFormat("es-AR", { day: "numeric", month: "short" });

const STATUS_LABEL: Record<TradeItem["status"], string> = {
  pending: "Pendiente",
  accepted: "Aceptada",
  declined: "Rechazada",
  cancelled: "Cancelada",
};

// "Foil · te sobra 1" / "Normal · le sobran 2"
function spareNote(card: { foil: boolean; spare: number }, who: "you" | "friend"): TileNote {
  const verb =
    who === "you" ? (card.spare === 1 ? "te sobra" : "te sobran") : card.spare === 1 ? "le sobra" : "le sobran";
  return { text: `${card.foil ? "Foil" : "Normal"} · ${verb} ${card.spare}`, tone: "info" };
}

function Tile({
  card,
  quantity,
  selected,
  onClick,
  notes,
}: {
  card: TradeCard;
  quantity?: number | undefined;
  selected?: boolean | undefined;
  onClick?: (() => void) | undefined;
  notes?: (TileNote | undefined)[] | undefined;
}) {
  const face = <StickerCard card={card} foil={card.foil} quantity={quantity} />;
  const visible = (notes ?? []).filter((note): note is TileNote => note !== undefined);

  return (
    <div className="w-24 shrink-0 sm:w-28">
      {onClick ? (
        <button
          type="button"
          onClick={onClick}
          aria-pressed={selected}
          className={cn(
            "block w-full rounded-[7%] transition active:scale-95 motion-reduce:transition-none motion-reduce:active:scale-100",
            selected && "ring-2 ring-primary ring-offset-2 ring-offset-background",
          )}
        >
          {face}
        </button>
      ) : (
        face
      )}
      {visible.length > 0 && (
        <div className="mt-1.5 flex flex-col items-center gap-1">
          {visible.map((note) => (
            <span
              key={note.text}
              className={cn(
                "block w-fit max-w-full rounded px-1.5 py-0.5 text-center text-[10px] font-bold uppercase leading-tight tracking-wide",
                NOTE_STYLES[note.tone],
              )}
            >
              {note.text}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

function PersonAvatar({ user }: { user: { username: string | null; display_name: string | null; avatar_url: string | null } }) {
  const name = nameOf(user);
  return (
    <Avatar className="h-8 w-8">
      {user.avatar_url && <AvatarImage src={user.avatar_url} alt="" />}
      <AvatarFallback className="bg-secondary text-xs font-bold">{getInitials(name)}</AvatarFallback>
    </Avatar>
  );
}

function OfferRow({
  item,
  index,
  busy,
  onRespond,
  onCancel,
  getNote,
}: {
  item: TradeItem;
  index: number;
  busy: boolean;
  onRespond: (id: string, accept: boolean) => void;
  onCancel: (id: string) => void;
  getNote?: ((card: TradeCard) => TileNote | undefined) | undefined;
}) {
  const incoming = item.direction === "in";
  const pending = item.status === "pending";

  return (
    <li className="fade-up space-y-3 rounded-2xl border bg-card p-4" style={{ "--i": Math.min(index, 8) } as CSSProperties}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <PersonAvatar user={item.other} />
          <p className="text-sm">
            <span className="font-semibold">{nameOf(item.other)}</span>{" "}
            <span className="text-muted-foreground">
              {incoming ? "te propone un cambio" : "recibió tu oferta"}
            </span>
          </p>
        </div>
        <p className="text-xs text-muted-foreground">
          {pending ? `Vence el ${dateFormatter.format(new Date(item.expires_at))}` : STATUS_LABEL[item.status]}
        </p>
      </div>

      <div className="flex flex-wrap items-end gap-4">
        <div className="space-y-1">
          <p className="text-xs text-muted-foreground">{incoming ? "Recibís" : "Recibirías"}</p>
          <Tile card={item.you_get} notes={incoming && pending ? [getNote?.(item.you_get)] : undefined} />
        </div>
        <span aria-hidden="true" className="pb-12 text-2xl text-muted-foreground">
          ⇄
        </span>
        <div className="space-y-1">
          <p className="text-xs text-muted-foreground">{incoming ? "Das" : "Darías"}</p>
          <Tile card={item.you_give} />
        </div>

        {pending && (
          <div className="flex flex-wrap gap-2 pb-1">
            {incoming ? (
              <>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => onRespond(item.trade_id, true)}
                  className="rounded-lg bg-gradient-primary px-4 py-2 text-sm font-bold text-primary-foreground transition active:scale-95 disabled:opacity-50 motion-reduce:transition-none motion-reduce:active:scale-100"
                >
                  Aceptar
                </button>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => onRespond(item.trade_id, false)}
                  className="rounded-lg border px-4 py-2 text-sm font-semibold transition hover:bg-accent/40 active:scale-95 disabled:opacity-50 motion-reduce:transition-none motion-reduce:active:scale-100"
                >
                  Rechazar
                </button>
              </>
            ) : (
              <button
                type="button"
                disabled={busy}
                onClick={() => onCancel(item.trade_id)}
                className="rounded-lg border px-4 py-2 text-sm font-semibold transition hover:bg-accent/40 active:scale-95 disabled:opacity-50 motion-reduce:transition-none motion-reduce:active:scale-100"
              >
                Cancelar oferta
              </button>
            )}
          </div>
        )}
      </div>
    </li>
  );
}

export function TradesPanel() {
  const { entries, loading: albumLoading, reload: reloadAlbum } = useAlbum();

  const [trades, setTrades] = useState<TradeItem[] | null>(null);
  const [friends, setFriends] = useState<TradeFriend[] | null>(null);
  const [friendId, setFriendId] = useState<string | null>(null);
  const [friendDups, setFriendDups] = useState<FriendDuplicate[] | null>(null);
  const [friendStatus, setFriendStatus] = useState<Map<string, FriendCardStatus> | null>(null);
  const [give, setGive] = useState<string | null>(null);
  const [get, setGet] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<Message>(null);
  const currentFriend = useRef<string | null>(null);

  const loadTrades = useCallback(async () => {
    const { data, error } = await supabase.rpc("album_list_trades");
    if (error) {
      console.error("Cargar intercambios:", error);
      setMessage({ type: "error", text: "No pudimos cargar tus intercambios." });
      return;
    }
    setTrades(data as unknown as TradeItem[]);
  }, []);

  useEffect(() => {
    void loadTrades();
    supabase.rpc("album_get_trade_friends").then(({ data, error }) => {
      if (error) {
        console.error("Cargar amigos:", error);
        setFriends([]);
        return;
      }
      setFriends(data ?? []);
    });
  }, [loadTrades]);

  // Mis repetidas. En cada carta te guardás una copia (si tenés foil, esa es la foil):
  // sobran las normales de más y las foil de más.
  const myDups = useMemo(
    () =>
      entries.flatMap((entry) => {
        const list: (TradeCard & { quantity: number; spare: number })[] = [];
        const normals = entry.quantity;
        const foils = entry.foil_quantity;
        const spareNormal = foils >= 1 ? normals : Math.max(0, normals - 1);
        const spareFoil = Math.max(0, foils - 1);
        if (spareNormal >= 1) list.push({ ...entry, foil: false, quantity: normals, spare: spareNormal });
        if (spareFoil >= 1) list.push({ ...entry, foil: true, quantity: foils, spare: spareFoil });
        return list;
      }),
    [entries],
  );

  // Lo que tengo de cada carta, para avisar cuáles me faltan.
  const owned = useMemo(() => new Map(entries.map((entry) => [entry.card_id, entry])), [entries]);

  const noteFor = (card: TradeCard): TileNote | undefined => {
    if (albumLoading) return undefined;
    const mine = owned.get(card.card_id);
    if (!mine || (mine.quantity <= 0 && mine.foil_quantity <= 0)) return { text: "¡No la tenés!", tone: "new" };
    if (card.foil && mine.foil_quantity <= 0) return { text: "Te falta la foil ✨", tone: "foil" };
    return { text: "Ya la tenés", tone: "owned" };
  };

  // Cuando elegís un amigo, se le pregunta si ya tiene mis cartas repetidas.
  const myDupIds = useMemo(() => [...new Set(myDups.map((card) => card.card_id))].sort(), [myDups]);

  useEffect(() => {
    if (!friendId || myDupIds.length === 0) {
      setFriendStatus(null);
      return;
    }

    let cancelled = false;
    setFriendStatus(null);

    supabase.rpc("album_friend_card_status", { p_friend: friendId, p_cards: myDupIds }).then(({ data, error }) => {
      if (cancelled) return;
      if (error) {
        console.error("Cartas del amigo:", error);
        return;
      }
      setFriendStatus(
        new Map((data ?? []).map((row) => [row.card_id, { has_card: row.has_card, has_foil: row.has_foil }])),
      );
    });

    return () => {
      cancelled = true;
    };
  }, [friendId, myDupIds]);

  const friendNoteFor = (card: TradeCard): TileNote | undefined => {
    if (!friendStatus) return undefined;
    const theirs = friendStatus.get(card.card_id);
    if (!theirs || !theirs.has_card) return { text: "¡No la tiene!", tone: "new" };
    if (card.foil && !theirs.has_foil) return { text: "Le falta la foil ✨", tone: "foil" };
    return { text: "Ya la tiene", tone: "owned" };
  };

  const selectFriend = async (id: string) => {
    currentFriend.current = id;
    setFriendId(id);
    setGet(null);
    setFriendDups(null);
    setMessage(null);

    const { data, error } = await supabase.rpc("album_get_friend_duplicates", { p_friend: id });
    if (currentFriend.current !== id) return;
    if (error) {
      console.error("Repetidas del amigo:", error);
      setMessage({ type: "error", text: albumError(error, "No pudimos ver las repetidas de tu amigo.") });
      setFriendDups([]);
      return;
    }
    setFriendDups(data as unknown as FriendDuplicate[]);
  };

  const myGive = myDups.find((card) => keyOf(card) === give);
  const theirGet = friendDups?.find((card) => keyOf(card) === get);

  const propose = async () => {
    if (!friendId || !myGive || !theirGet) return;
    setBusy(true);
    setMessage(null);

    const { error } = await supabase.rpc("album_propose_trade", {
      p_to: friendId,
      p_give_card: myGive.card_id,
      p_give_foil: myGive.foil,
      p_get_card: theirGet.card_id,
      p_get_foil: theirGet.foil,
    });
    setBusy(false);

    if (error) {
      console.error("Proponer intercambio:", error);
      setMessage({ type: "error", text: albumError(error, "No pudimos enviar la oferta. Probá de nuevo.") });
      return;
    }

    setMessage({ type: "ok", text: "Oferta enviada. Tu amigo la ve en su pestaña Intercambios." });
    setGive(null);
    setGet(null);
    await loadTrades();
  };

  const respond = async (id: string, accept: boolean) => {
    setBusy(true);
    setMessage(null);

    const { error } = await supabase.rpc("album_respond_trade", { p_trade_id: id, p_accept: accept });
    setBusy(false);

    if (error) {
      console.error("Responder oferta:", error);
      setMessage({ type: "error", text: albumError(error, "No pudimos responder la oferta.") });
    } else {
      setMessage({ type: "ok", text: accept ? "¡Intercambio hecho! Las cartas ya están en tu álbum." : "Oferta rechazada." });
    }
    await Promise.all([loadTrades(), reloadAlbum()]);
  };

  const cancel = async (id: string) => {
    setBusy(true);
    setMessage(null);

    const { error } = await supabase.rpc("album_cancel_trade", { p_trade_id: id });
    setBusy(false);

    if (error) {
      console.error("Cancelar oferta:", error);
      setMessage({ type: "error", text: "No pudimos cancelar la oferta." });
    }
    await loadTrades();
  };

  const incoming = (trades ?? []).filter((item) => item.direction === "in" && item.status === "pending");
  const outgoing = (trades ?? []).filter((item) => item.direction === "out" && item.status === "pending");
  const history = (trades ?? []).filter((item) => item.status !== "pending");
  const friend = friends?.find((item) => item.user_id === friendId);

  return (
    <div className="space-y-8">
      {message && (
        <p
          className={cn(
            "rounded-md p-2 text-sm",
            message.type === "ok" ? "bg-success/15 text-success" : "bg-destructive/15 text-destructive",
          )}
        >
          {message.text}
        </p>
      )}

      {incoming.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-xl font-bold uppercase">Ofertas que recibiste</h2>
          <ul className="space-y-3">
            {incoming.map((item, index) => (
              <OfferRow
                key={item.trade_id}
                item={item}
                index={index}
                busy={busy}
                onRespond={respond}
                onCancel={cancel}
                getNote={noteFor}
              />
            ))}
          </ul>
        </section>
      )}

      <section className="space-y-4">
        <h2 className="text-xl font-bold uppercase">Nueva oferta</h2>

        {friends === null ? (
          <div className="skeleton h-12 max-w-xl" />
        ) : friends.length === 0 ? (
          <p className="max-w-xl rounded-2xl border bg-card p-5 text-sm text-muted-foreground">
            Para intercambiar necesitás amigos en PitWall. Buscalos en la sección Amigos.
          </p>
        ) : (
          <>
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">1. Elegí a un amigo</p>
              <div className="flex flex-wrap gap-2">
                {friends.map((item) => (
                  <button
                    key={item.user_id}
                    type="button"
                    onClick={() => void selectFriend(item.user_id)}
                    aria-pressed={friendId === item.user_id}
                    className={cn(
                      "flex items-center gap-2 rounded-full border py-1 pl-1 pr-3 text-sm font-semibold transition active:scale-95 motion-reduce:transition-none motion-reduce:active:scale-100",
                      friendId === item.user_id
                        ? "border-primary/60 bg-primary/15 text-primary"
                        : "bg-secondary/40 text-muted-foreground hover:text-foreground",
                    )}
                  >
                    <PersonAvatar user={item} />
                    {nameOf(item)}
                    <span className="text-xs font-normal">({item.duplicates} con repetidas)</span>
                  </button>
                ))}
              </div>
            </div>

            {friend && (
              <div className="fade-up space-y-5">
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">2. Elegí una repetida tuya para dar</p>
                  {myDups.length === 0 ? (
                    <p className="text-sm text-muted-foreground">Todavía no tenés repetidas para ofrecer.</p>
                  ) : (
                    <ul className="flex flex-wrap gap-3">
                      {myDups.map((card) => (
                        <li key={keyOf(card)}>
                          <Tile
                            card={card}
                            quantity={card.quantity}
                            selected={give === keyOf(card)}
                            onClick={() => setGive(keyOf(card))}
                            notes={[spareNote(card, "you"), friendNoteFor(card)]}
                          />
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">
                    3. Elegí una repetida de {nameOf(friend)} que quieras
                  </p>
                  {friendDups === null ? (
                    <div className="skeleton h-36 max-w-md" />
                  ) : friendDups.length === 0 ? (
                    <p className="text-sm text-muted-foreground">{nameOf(friend)} no tiene repetidas para intercambiar.</p>
                  ) : (
                    <ul className="flex flex-wrap gap-3">
                      {friendDups.map((card) => (
                        <li key={keyOf(card)}>
                          <Tile
                            card={card}
                            quantity={card.quantity}
                            selected={get === keyOf(card)}
                            onClick={() => setGet(keyOf(card))}
                            notes={[spareNote(card, "friend"), noteFor(card)]}
                          />
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => void propose()}
                  disabled={busy || !myGive || !theirGet}
                  className="rounded-lg bg-gradient-primary px-5 py-2.5 text-sm font-bold text-primary-foreground transition active:scale-95 disabled:opacity-40 motion-reduce:transition-none motion-reduce:active:scale-100"
                >
                  {busy ? "Enviando…" : myGive && theirGet ? `Ofrecer ${myGive.name} por ${theirGet.name}` : "Enviar oferta"}
                </button>
              </div>
            )}
          </>
        )}
      </section>

      {outgoing.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-xl font-bold uppercase">Ofertas que enviaste</h2>
          <ul className="space-y-3">
            {outgoing.map((item, index) => (
              <OfferRow key={item.trade_id} item={item} index={index} busy={busy} onRespond={respond} onCancel={cancel} />
            ))}
          </ul>
        </section>
      )}

      {history.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-xl font-bold uppercase">Últimos intercambios</h2>
          <ul className="space-y-3">
            {history.map((item, index) => (
              <OfferRow key={item.trade_id} item={item} index={index} busy={busy} onRespond={respond} onCancel={cancel} />
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
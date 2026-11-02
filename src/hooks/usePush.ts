import { useCallback, useEffect, useState } from "react";
import {
  disablePush,
  enablePush,
  getCurrentSubscription,
  getPushSupport,
  type PushResult,
  type PushSupport,
} from "@/lib/push";

export function usePush() {
  const [support, setSupport] = useState<PushSupport>("unsupported");
  const [permission, setPermission] = useState<NotificationPermission>("default");
  const [subscribed, setSubscribed] = useState(false);
  const [busy, setBusy] = useState(false);

  const refresh = useCallback(async () => {
    const current = getPushSupport();
    setSupport(current);
    if (current !== "supported") return;

    setPermission(Notification.permission);
    const subscription = await getCurrentSubscription();
    setSubscribed(subscription !== null && Notification.permission === "granted");
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const run = useCallback(
    async (action: () => Promise<PushResult>): Promise<PushResult> => {
      setBusy(true);
      const result = await action();
      await refresh();
      setBusy(false);
      return result;
    },
    [refresh],
  );

  const enable = useCallback(() => run(enablePush), [run]);
  const disable = useCallback(() => run(disablePush), [run]);

  return { support, permission, subscribed, busy, enable, disable };
}
import { AsyncLocalStorage } from 'async_hooks';

type ContextType = {
  userId?: string;
  profileId?: string;

  name?: string;
  email?: string;
  mobile?: string;

  roleId?: string;
  roleName?: string;
  permissions?: string[];

  userType?: string;
  isActive?: boolean;
  roleStatus?: string;

  deviceId?: string;
  sessionId?: string;

  [key: string]: any;
};

class RequestContext {
  private static als = new AsyncLocalStorage<Map<string, unknown>>();

  /* ======================================================
   * RUN CONTEXT
   * ====================================================== */
  static run<T>(callback: () => T): T {
    return this.als.run(new Map<string, unknown>(), callback);
  }

  /* ======================================================
   * SET DATA
   * ====================================================== */
  static set(data: ContextType): void {
    const store = this.als.getStore();
    if (!store) return;

    Object.entries(data).forEach(([key, value]) => {
      store.set(key, value);
    });
  }

  /* ======================================================
   * GET CONTEXT
   * ====================================================== */
  static get(): ContextType;
  static get<K extends keyof ContextType>(key: K): ContextType[K];
  static get(key?: keyof ContextType) {
    const store = this.als.getStore();

    if (!store) return {} as ContextType;

    if (key) {
      return store.get(key as string) as ContextType[typeof key];
    }

    return Object.fromEntries(store.entries()) as ContextType;
  }

  /* ======================================================
   * CLEAR (optional)
   * ====================================================== */
  static clear(): void {
    const store = this.als.getStore();
    store?.clear();
  }
}

export const RequestContextStore = RequestContext;

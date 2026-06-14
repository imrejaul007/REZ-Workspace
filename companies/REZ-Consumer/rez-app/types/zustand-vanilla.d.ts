/**
 * Minimal type declarations for zustand/vanilla.
 * Zustand v5 ships zustand/vanilla as zustand/esm/vanilla.mjs but provides no
 * .d.mts for this subpath. These declarations allow stores to import
 * SetState / GetState / StoreApi for explicit type annotations without
 * triggering implicit-unknown errors under strict: true.
 */
declare module 'zustand/vanilla' {
  export interface StoreApi<T extends object> {
    getState(): T;
    setState: SetState<T>;
    subscribe(listener: (state: T, prevState: T) => void): () => void;
    destroy(): void;
  }

  export type SetState<T extends object> = (
    partial: T | Partial<T> | ((state: T) => T | Partial<T>),
    replace?: boolean
  ) => void;

  export type GetState<T extends object> = () => T;

  export type StateCreator<T extends object, Mos extends [StoreMutatorIdentifier, unknown][] = []> = (
    set: SetState<T>,
    get: GetState<T>,
    api: StoreApi<T>
  ) => T | Partial<T> | void;

  export type StoreMutatorIdentifier = string | [string, unknown];
  export type Mutate<S, M> = S;
}

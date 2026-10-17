import { ChannelItem } from './types';

const DB_NAME = 'arrjs_iptv_db';
const DB_VERSION = 1;
const STORE_NAME = 'channels_store';
const KEY_CHANNELS = 'iptv_channels_cache';

const openDb = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      return reject(new Error('IndexedDB is not supported'));
    }
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
};

/**
 * Saves channels to IndexedDB with automatic fallback to localStorage if needed.
 * Allows storing 20,000+ channels without hitting the 5MB browser localStorage limit.
 */
export const saveStoredChannels = async (channels: ChannelItem[]): Promise<void> => {
  try {
    const db = await openDb();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const req = store.put(channels, KEY_CHANNELS);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.warn('IndexedDB write failed, trying localStorage fallback:', err);
    try {
      localStorage.setItem('iptv_channels', JSON.stringify(channels.slice(0, 1500)));
    } catch (lsErr) {
      console.warn('LocalStorage quota exceeded on channel fallback:', lsErr);
    }
  }
};

/**
 * Loads cached channels from IndexedDB, or fallback localStorage if present.
 */
export const loadStoredChannels = async (): Promise<ChannelItem[] | null> => {
  try {
    const db = await openDb();
    const result = await new Promise<ChannelItem[] | null>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.get(KEY_CHANNELS);
      req.onsuccess = () => resolve((req.result as ChannelItem[]) || null);
      req.onerror = () => reject(req.error);
    });

    if (result && Array.isArray(result) && result.length > 0) {
      return result;
    }
  } catch (err) {
    console.warn('IndexedDB read failed, checking localStorage fallback:', err);
  }

  // Fallback to localStorage
  try {
    const ls = localStorage.getItem('iptv_channels');
    if (ls) {
      const parsed = JSON.parse(ls);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (err) {
    console.warn('Error reading fallback channels from localStorage:', err);
  }

  return null;
};

/**
 * Clears stored channels from both IndexedDB and localStorage.
 */
export const clearStoredChannels = async (): Promise<void> => {
  try {
    const db = await openDb();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const req = store.delete(KEY_CHANNELS);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch {
    // ignore
  }

  try {
    localStorage.removeItem('iptv_channels');
  } catch {
    // ignore
  }
};

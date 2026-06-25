import { useSyncExternalStore } from 'react';
import { getStoreVersion, subscribeToStore } from '../services/apiClient';

export const useStoreVersion = () => (
  useSyncExternalStore(subscribeToStore, getStoreVersion, getStoreVersion)
);

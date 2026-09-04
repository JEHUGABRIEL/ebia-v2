import { createContext, useContext, useState, useCallback } from "react";
import type { ReactNode } from "react";
import type { Track } from "../lib/api";

export type QueueTrack = Track & {
  /** Optional album art override */
  coverUrl?: string;
};

type QueueContextType = {
  queue: QueueTrack[];
  currentIndex: number;
  addToQueue: (track: QueueTrack) => void;
  addMultipleToQueue: (tracks: QueueTrack[]) => void;
  removeFromQueue: (index: number) => void;
  clearQueue: () => void;
  reorderQueue: (fromIndex: number, toIndex: number) => void;
  playNext: (track: QueueTrack) => void;
  hasNext: boolean;
  hasPrevious: boolean;
  next: () => QueueTrack | null;
  previous: () => QueueTrack | null;
  getCurrentTrack: () => QueueTrack | null;
};

const QueueContext = createContext<QueueContextType | null>(null);

export function QueueProvider({ children }: { children: ReactNode }) {
  const [queue, setQueue] = useState<QueueTrack[]>([]);
  const [currentIndex, setCurrentIndex] = useState(-1);

  const addToQueue = useCallback((track: QueueTrack) => {
    setQueue((prev) => [...prev, track]);
  }, []);

  const addMultipleToQueue = useCallback((tracks: QueueTrack[]) => {
    setQueue((prev) => [...prev, ...tracks]);
  }, []);

  const removeFromQueue = useCallback((index: number) => {
    setQueue((prev) => {
      const newQueue = [...prev];
      newQueue.splice(index, 1);
      return newQueue;
    });
    setCurrentIndex((prev) => {
      if (index < prev) return prev - 1;
      if (index === prev) return prev; // Will be handled by next/previous
      return prev;
    });
  }, []);

  const clearQueue = useCallback(() => {
    setQueue([]);
    setCurrentIndex(-1);
  }, []);

  const reorderQueue = useCallback((fromIndex: number, toIndex: number) => {
    setQueue((prev) => {
      const newQueue = [...prev];
      const [removed] = newQueue.splice(fromIndex, 1);
      newQueue.splice(toIndex, 0, removed);
      return newQueue;
    });
    setCurrentIndex((prev) => {
      if (prev === fromIndex) return toIndex;
      if (fromIndex < prev && toIndex >= prev) return prev - 1;
      if (fromIndex > prev && toIndex <= prev) return prev + 1;
      return prev;
    });
  }, []);

  const playNext = useCallback((track: QueueTrack) => {
    setQueue((prev) => {
      const newQueue = [...prev];
      // Insert after current position
      const insertAt = currentIndex + 1;
      newQueue.splice(insertAt, 0, track);
      return newQueue;
    });
    setCurrentIndex((prev) => prev + 1);
  }, [currentIndex]);

  const hasNext = currentIndex < queue.length - 1;
  const hasPrevious = currentIndex > 0;

  const next = useCallback((): QueueTrack | null => {
    if (!hasNext) return null;
    const newIndex = currentIndex + 1;
    setCurrentIndex(newIndex);
    return queue[newIndex] || null;
  }, [currentIndex, hasNext, queue]);

  const previous = useCallback((): QueueTrack | null => {
    if (!hasPrevious) return null;
    const newIndex = currentIndex - 1;
    setCurrentIndex(newIndex);
    return queue[newIndex] || null;
  }, [currentIndex, hasPrevious, queue]);

  const getCurrentTrack = useCallback((): QueueTrack | null => {
    if (currentIndex < 0 || currentIndex >= queue.length) return null;
    return queue[currentIndex];
  }, [currentIndex, queue]);

  return (
    <QueueContext.Provider
      value={{
        queue,
        currentIndex,
        addToQueue,
        addMultipleToQueue,
        removeFromQueue,
        clearQueue,
        reorderQueue,
        playNext,
        hasNext,
        hasPrevious,
        next,
        previous,
        getCurrentTrack,
      }}
    >
      {children}
    </QueueContext.Provider>
  );
}

export function useQueue() {
  const context = useContext(QueueContext);
  if (!context) {
    throw new Error("useQueue must be used within a QueueProvider");
  }
  return context;
}

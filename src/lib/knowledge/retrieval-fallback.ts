import type { StoredKnowledgeChunk } from "@/lib/knowledge/retrieval-types";

export function mergeCurrentRetrievalChunks(input: {
  persistedChunks: StoredKnowledgeChunk[];
  transientChunks: StoredKnowledgeChunk[];
  currentItemIds?: string[];
}): StoredKnowledgeChunk[] {
  if (!input.currentItemIds) {
    return input.persistedChunks.length > 0
      ? input.persistedChunks
      : input.transientChunks;
  }

  const currentItemIds = new Set(input.currentItemIds);
  const currentByKey = new Map(
    input.transientChunks.map((chunk): [string, StoredKnowledgeChunk] => [
      chunkKey(chunk),
      chunk,
    ]),
  );
  const currentPersisted = input.persistedChunks.filter((chunk) => {
    if (!currentItemIds.has(chunk.itemId)) return false;
    const current = currentByKey.get(chunkKey(chunk));
    return current?.contentHash === chunk.contentHash;
  });
  const currentPersistedKeys = new Set(currentPersisted.map(chunkKey));
  const missingOrChangedTransient = input.transientChunks.filter(
    (chunk) => !currentPersistedKeys.has(chunkKey(chunk)),
  );

  return [...currentPersisted, ...missingOrChangedTransient];
}

function chunkKey(chunk: Pick<StoredKnowledgeChunk, "itemId" | "chunkIndex">) {
  return `${chunk.itemId}:${chunk.chunkIndex}`;
}

import {
  AI_CHARACTER_CONTRACT_FAMILY_COUNT,
  buildIntegrationBoundarySnapshot,
  extractAiCharacterContracts,
  extractDurationMs,
  extractInputText,
  extractLanguage,
  extractScriptDirection,
  extractTrace,
  normalizeAdapterKind,
  validateInputPayload,
} from "./contracts.js";
import { VoxWeaveError } from "./errors.js";
import {
  assertAiCharacterResponseSafeSummary,
  buildAiCharacterContractAdapterMetadata,
  buildAiCharacterContractPresence,
  buildAiCharacterContractSafeSummary,
} from "./aiCharacterMetadata.js";
import { repairPronunciationText } from "./pronunciationDictionary.js";
import { ReactionCache } from "./cache.js";
import { RenderGroupStore } from "./renderGroupStore.js";
import { createLive2dForwarder } from "./live2dForwarder.js";
import {
  buildReactionPlanCacheKey,
  validateReactionPlanCacheEntry,
} from "./reactionPlanCache.js";
import {
  buildReactionPlan,
  isCacheableReaction as isCacheableReactionPlan,
  isSupportedLocale as isSupportedReactionLocale,
} from "./reactionPlanBuilder.js";
import { materializeReactionPlanResponse } from "./orchestrationResponse.js";
import { buildVoxWeaveHealth } from "./serviceHealth.js";
import { throwIfOperationAborted } from "./operationContext.js";

export { assertAiCharacterResponseSafeSummary } from "./aiCharacterMetadata.js";

export function createVoxWeaveService({
  now = () => Date.now(),
  cache = new ReactionCache(),
  renderGroups = new RenderGroupStore({ now }),
  live2dForwarder = createLive2dForwarder(),
  requestIdFactory = null,
} = {}) {
  return {
    health() {
      return buildVoxWeaveHealth({ cache, live2dForwarder });
    },

    async orchestrate(payload, { routeKind = "", signal } = {}) {
      throwIfOperationAborted(signal);
      validateInputPayload(payload, { routeKind });
      throwIfOperationAborted(signal);
      const extractedAiCharacterContracts = extractAiCharacterContracts(payload);
      throwIfOperationAborted(signal);
      const aiCharacterContracts = buildAiCharacterContractPresence(
        extractedAiCharacterContracts
      );
      const aiCharacterContractSummary = buildAiCharacterContractSafeSummary(
        extractedAiCharacterContracts,
        aiCharacterContracts
      );

      const adapterKind =
        routeKind ||
        normalizeAdapterKind(payload.adapter_kind ?? payload.adapterKind ?? payload.mode);
      const integrationBoundary = buildIntegrationBoundarySnapshot({
        live2dForwarder,
        contractRegistryFamilyCount: AI_CHARACTER_CONTRACT_FAMILY_COUNT,
      });
      const aiCharacterAdapterMetadata = buildAiCharacterContractAdapterMetadata(
        aiCharacterContracts,
        aiCharacterContractSummary,
        adapterKind
      );
      const text = extractInputText(payload);
      const { correctedText, repairs, dictionary_version } =
        repairPronunciationText(text);
      const language = extractLanguage(payload, correctedText);
      const localeStatus = isSupportedReactionLocale(language) ? "supported" : "unsupported";
      const scriptDirection = extractScriptDirection(payload, language, correctedText);
      const durationMs = extractDurationMs(payload, correctedText);
      const trace = extractTrace(payload);
      const cacheKey = buildReactionPlanCacheKey({
        payload,
        adapterKind,
        correctedText,
        dictionaryVersion: dictionary_version,
      });
      const cacheable =
        isCacheableReactionPlan(correctedText) &&
        isCacheableReactionPlan(text);
      throwIfOperationAborted(signal);
      const cached = cacheable ? cache.get(cacheKey) : null;
      if (cached) {
        try {
          const reactionPlan = validateReactionPlanCacheEntry(cached);
          throwIfOperationAborted(signal);
          return await materializeReactionPlanResponse({
            reactionPlan,
            adapterKind,
            trace,
            cacheKey,
            cacheStatus: "hit",
            live2dForwarder,
            renderGroups,
            requestIdFactory,
            aiCharacterContracts,
            aiCharacterContractSummary,
            aiCharacterAdapterMetadata,
            integrationBoundary,
            signal,
          });
        } catch (error) {
          if (error instanceof VoxWeaveError && error.code === "invalid_cache_entry") {
            cache.delete(cacheKey);
            // Rebuild the plan below without exposing stale cached material.
          } else {
            throw error;
          }
        }
      }

      const reactionPlan = buildReactionPlan({
        payload,
        text,
        correctedText,
        repairs,
        dictionaryVersion: dictionary_version,
        language,
        localeStatus,
        scriptDirection,
        durationMs,
      });
      throwIfOperationAborted(signal);
      const response = await materializeReactionPlanResponse({
        reactionPlan,
        adapterKind,
        trace,
        cacheKey,
        cacheStatus: "miss",
        live2dForwarder,
        renderGroups,
        requestIdFactory,
        aiCharacterContracts,
        aiCharacterContractSummary,
        aiCharacterAdapterMetadata,
        integrationBoundary,
        signal,
      });
      throwIfOperationAborted(signal);
      if (cacheable) {
        cache.set(cacheKey, reactionPlan);
      }
      throwIfOperationAborted(signal);
      return response;
    },
  };
}

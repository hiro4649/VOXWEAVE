# VoxWeave V1.5 Refactor Plan

Current V0 keeps orchestration in `src/orchestrator.js` to stabilize the public
contract first. Before V1.5, split the implementation into these modules:

- `src/contracts.js`
- `src/server.js`
- `src/orchestrator.js`
- `src/renderGroupStore.js`
- `src/pronunciation/lexicon.js`
- `src/pronunciation/nameReadingResolver.js`
- `src/prosody/emotionProsodyMapper.js`
- `src/subtitle/subtitleTiming.js`
- `src/lipsync/lipSyncCueGenerator.js`
- `src/live2d/live2dCueBuilder.js`
- `src/tts/mockTtsAdapter.js`
- `src/cache/reactionCache.js`
- `src/quality/voiceQualityScorer.js`

The split must preserve the current adapter endpoints, response summary shape,
render group behavior, and safety tests.

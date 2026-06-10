import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { validateFixtureSet } from './codex-iris-adapter-fixture-e2e-mock.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '..');
const fixtureDir = path.join(repoRoot, 'docs/fixtures/iris-adapter-e2e-mock');

const result = validateFixtureSet({
  fixturePaths: ['tts-packet.json', 'subtitle-packet.json', 'live2d-packet.json'].map((name) =>
    path.join(fixtureDir, name),
  ),
});

console.log(
  JSON.stringify(
    {
      selfCheckStatus: result.status,
      checkedCases: result.checkedCases,
      fixtureOnlyStatus: true,
      runtimeExecutionAllowed: false,
      serverStartAllowed: false,
      apiCallAllowed: false,
      ttsEngineCallAllowed: false,
      asrEngineCallAllowed: false,
      live2dRendererCallAllowed: false,
      rawAudioAllowed: false,
      endpointConfigAllowed: false,
      mergeReadiness: false,
    },
    null,
    2,
  ),
);

import { Composition, Still, registerRoot } from 'remotion';
import { Hype, OgImage, HOLD, buildScenes } from './Hype.jsx';

const LONG = buildScenes(HOLD).duration; // ~2s pause before each transition (default)
const SHORT = buildScenes(0).duration; // original fast 20-second cut

const Root = () => (
  <>
    {/* Vertical for BAND (phones) */}
    <Composition id="HypeVertical" component={Hype} width={1080} height={1920} fps={30} durationInFrames={LONG} defaultProps={{ hold: HOLD }} />
    {/* 16:9 for email, YouTube, or a projector */}
    <Composition id="HypeWide" component={Hype} width={1920} height={1080} fps={30} durationInFrames={LONG} defaultProps={{ hold: HOLD }} />
    {/* Fast 20-second cuts: smaller files, in case BAND has a size limit */}
    <Composition id="HypeVerticalShort" component={Hype} width={1080} height={1920} fps={30} durationInFrames={SHORT} defaultProps={{ hold: 0 }} />
    <Composition id="HypeWideShort" component={Hype} width={1920} height={1080} fps={30} durationInFrames={SHORT} defaultProps={{ hold: 0 }} />
    {/* Link preview image for the voting site */}
    <Still id="OgImage" component={OgImage} width={1200} height={630} />
  </>
);

registerRoot(Root);

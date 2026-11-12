import { Composition, Still, registerRoot } from 'remotion';
import { Hype, OgImage, DURATION } from './Hype.jsx';

const Root = () => (
  <>
    {/* Vertical for BAND (phones) */}
    <Composition id="HypeVertical" component={Hype} width={1080} height={1920} fps={30} durationInFrames={DURATION} />
    {/* 16:9 for email, YouTube, or a projector */}
    <Composition id="HypeWide" component={Hype} width={1920} height={1080} fps={30} durationInFrames={DURATION} />
    {/* Link preview image for the voting site */}
    <Still id="OgImage" component={OgImage} width={1200} height={630} />
  </>
);

registerRoot(Root);

import "./index.css";
import { Composition } from "remotion";
import { HelloWorld } from "./HelloWorld";
import { Logo } from "./HelloWorld/Logo";
import { EDITED_TRAILER_DURATION, EditedTrailer } from "./EditedTrailer";
import {
  PEXELS_OCEAN_EDIT_DURATION,
  PexelsOceanEdit,
} from "./PexelsOceanEdit";
import { RISE_OF_ROME_DURATION, RiseOfRome } from "./RiseOfRome";
import { NZ_JACKFRUIT_DURATION, NZJackfruit } from "./NZJackfruit";
import { CONCEPT_MAP_DEMO_DURATION, ConceptMapDemo } from "./ConceptMapDemo";
import {
  DA_VINCI_SALVATOR_MUNDI_DURATION,
  DaVinciSalvatorMundi,
} from "./DaVinciSalvatorMundi";

// Each <Composition> is an entry in the sidebar!

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        // You can take the "id" to render a video:
        // npx remotion render HelloWorld
        id="HelloWorld"
        component={HelloWorld}
        durationInFrames={150}
        fps={30}
        width={1920}
        height={1080}
        // You can override these props for each render:
        // https://www.remotion.dev/docs/parametrized-rendering
        defaultProps={{
          titleText: "Welcome to Remotion",
          titleColor: "#000000",
          logoColor1: "#91EAE4",
          logoColor2: "#86A8E7",
        }}
      />

      {/* Mount any React component to make it show up in the sidebar and work on it individually! */}
      <Composition
        id="OnlyLogo"
        component={Logo}
        durationInFrames={150}
        fps={30}
        width={1920}
        height={1080}
        defaultProps={{
          logoColor1: "#91dAE2",
          logoColor2: "#86A8E7",
        }}
      />

      <Composition
        id="EditedTrailer"
        component={EditedTrailer}
        durationInFrames={EDITED_TRAILER_DURATION}
        fps={24}
        width={1280}
        height={720}
      />

      <Composition
        id="PexelsOceanEdit"
        component={PexelsOceanEdit}
        durationInFrames={PEXELS_OCEAN_EDIT_DURATION}
        fps={30}
        width={1280}
        height={720}
      />

      <Composition
        id="RiseOfRome"
        component={RiseOfRome}
        durationInFrames={RISE_OF_ROME_DURATION}
        fps={30}
        width={1920}
        height={1080}
      />

      <Composition
        id="NZJackfruit"
        component={NZJackfruit}
        durationInFrames={NZ_JACKFRUIT_DURATION}
        fps={30}
        width={1920}
        height={1080}
      />

      <Composition
        id="ConceptMapDemo"
        component={ConceptMapDemo}
        durationInFrames={CONCEPT_MAP_DEMO_DURATION}
        fps={30}
        width={1920}
        height={1080}
      />

      <Composition
        id="DaVinciSalvatorMundi"
        component={DaVinciSalvatorMundi}
        durationInFrames={DA_VINCI_SALVATOR_MUNDI_DURATION}
        fps={30}
        width={1920}
        height={1080}
      />
    </>
  );
};

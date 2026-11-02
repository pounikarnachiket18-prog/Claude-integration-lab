import { Composition } from "remotion";
import { MyComposition } from "./Composition";
import { LighthouseTitle } from "./LighthouseTitle";
import { LowerThird } from "./LowerThird";
import { FINAL_DURATION, LighthouseFinal } from "./LighthouseFinal";

// Every video in this project is listed here as a <Composition>.
export const RemotionRoot: React.FC = () => {
  return (
    <>
      {/* The empty starter video from the install */}
      <MyComposition />

      {/* Lesson 16: animated title, 5 seconds, Full HD */}
      <Composition
        id="LighthouseTitle"
        component={LighthouseTitle}
        durationInFrames={150}
        fps={30}
        width={1920}
        height={1080}
      />

      {/* Lesson 17: lower third over Shot 5 (needs public/shot05_window.mp4) */}
      <Composition
        id="LowerThird"
        component={LowerThird}
        durationInFrames={120}
        fps={30}
        width={1920}
        height={1080}
      />

      {/* FINAL: The Lighthouse, full film (run render_final.sh) */}
      <Composition
        id="LighthouseFinal"
        component={LighthouseFinal}
        durationInFrames={FINAL_DURATION}
        fps={30}
        width={1920}
        height={1080}
      />
    </>
  );
};

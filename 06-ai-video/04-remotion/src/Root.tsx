import { Composition } from "remotion";
import { MyComposition } from "./Composition";
import { LighthouseTitle } from "./LighthouseTitle";

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
    </>
  );
};

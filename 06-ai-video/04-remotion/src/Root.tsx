import { Composition } from "remotion";
import { MyComposition } from "./Composition";
import { LighthouseTitle } from "./LighthouseTitle";
import { LowerThird } from "./LowerThird";
import { FINAL_DURATION, LighthouseFinal } from "./LighthouseFinal";
import { SLEEP_REEL_DURATION, SleepReel } from "./SleepReel";
import { LOGO_DURATION, LogoReveal } from "./LogoReveal";
import { MINDSET_LOGO_DURATION, MindsetModeLogo } from "./MindsetModeLogo";

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

      {/* Instagram Reel: 5 sleep tips, 20 seconds, vertical (run render_sleep_reel.sh) */}
      <Composition
        id="SleepReel"
        component={SleepReel}
        durationInFrames={SLEEP_REEL_DURATION}
        fps={30}
        width={1080}
        height={1920}
      />

      {/* YouTube logo reveal, 5 seconds (run render_logo_reveal.sh) */}
      <Composition
        id="LogoReveal"
        component={LogoReveal}
        durationInFrames={LOGO_DURATION}
        fps={30}
        width={1920}
        height={1080}
      />

      {/* Mindset Mode India logo reveal, 5 seconds
          (run: bash render_logo_reveal.sh MindsetModeLogo mindset_mode_india_logo) */}
      <Composition
        id="MindsetModeLogo"
        component={MindsetModeLogo}
        durationInFrames={MINDSET_LOGO_DURATION}
        fps={30}
        width={1920}
        height={1080}
      />
    </>
  );
};

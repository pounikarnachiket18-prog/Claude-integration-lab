import { RBIDocumentary, RBI_DURATION } from "./rbi/RBIDocumentary";
import { Composition } from "remotion";
import { MyComposition } from "./Composition";
import { LighthouseTitle } from "./LighthouseTitle";
import { LowerThird } from "./LowerThird";
import { FINAL_DURATION, LighthouseFinal } from "./LighthouseFinal";
import { SLEEP_REEL_DURATION, SleepReel } from "./SleepReel";
import { LOGO_DURATION, LogoReveal } from "./LogoReveal";
import { MINDSET_LOGO_DURATION, MindsetModeLogo } from "./MindsetModeLogo";
import { INTRO20_DURATION, MindsetIntro20 } from "./MindsetIntro20";
import { NUCLEAR_DURATION, NuclearExplainer } from "./NuclearExplainer";
import { MOTIVATION_DURATION, MotivationTransitions } from "./MotivationTransitions";
import { TVBulletin } from "./news/TVBulletin";
import { Newspaper } from "./news/Newspaper";
import { BULLETINS, CLIP, NEWS_REEL_DURATION, NewsReel, PAPERS } from "./news/NewsGraphics";

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

      {/* Mindset Mode India 20-second channel intro (run render_mindset_intro20.sh) */}
      <Composition
        id="MindsetIntro20"
        component={MindsetIntro20}
        durationInFrames={INTRO20_DURATION}
        fps={30}
        width={1920}
        height={1080}
      />

      {/* Faceless explainer Short: how a nuclear bomb explodes (run render_nuclear_explainer.sh) */}
      <Composition
        id="NuclearExplainer"
        component={NuclearExplainer}
        durationInFrames={NUCLEAR_DURATION}
        fps={30}
        width={1080}
        height={1920}
      />

      {/* Mindset Mode India: motivational Reel with seamless transitions (run render_motivation.sh) */}
      <Composition
        id="MotivationTransitions"
        component={MotivationTransitions}
        durationInFrames={MOTIVATION_DURATION}
        fps={30}
        width={1080}
        height={1920}
      />

      {/* RBI documentary: "1991: The Year India Pawned Its Gold" (run render_rbi_documentary.sh) */}
      <Composition id="RBIDocumentary" component={RBIDocumentary} durationInFrames={RBI_DURATION} fps={30} width={1920} height={1080} />

      {/* RBI documentary: 1990s TV-news and newspaper graphics (recreations) */}
      <Composition id="NewsReel" component={NewsReel} durationInFrames={NEWS_REEL_DURATION} fps={30} width={1920} height={1080} />
      {BULLETINS.map((b) => (
        <Composition key={b.id} id={b.id} component={TVBulletin} defaultProps={b.props} durationInFrames={CLIP} fps={30} width={1920} height={1080} />
      ))}
      {PAPERS.map((p) => (
        <Composition key={p.id} id={p.id} component={Newspaper} defaultProps={p.props} durationInFrames={CLIP} fps={30} width={1920} height={1080} />
      ))}
    </>
  );
};

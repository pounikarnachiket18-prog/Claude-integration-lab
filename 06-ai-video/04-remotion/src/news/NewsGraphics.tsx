import React from "react";
import { AbsoluteFill, Sequence } from "remotion";
import { TVBulletin, TVBulletinProps } from "./TVBulletin";
import { Newspaper, NewspaperProps } from "./Newspaper";

// "News" graphics for the documentary "1991: The Year India Pawned Its Gold".
// Every fact here was checked against several sources before use.
// Channel and newspaper names are made up, and every graphic says "RECREATION".

export const CLIP = 240; // 8 seconds at 30 fps

export const BULLETINS: { id: string; props: TVBulletinProps }[] = [
  {
    id: "TV-Reserves",
    props: {
      date: "JAN. 1991",
      dateline: "NEW DELHI  ·  JANUARY 1991",
      headline: "Foreign reserves fall below $1 billion",
      subline: "Down from $3.1 billion in August 1990 to $896 million",
      bigNumber: "$896 MN",
      icon: "chart",
      ticker: ["Gulf War pushes up oil prices", "Reserves: $3.1 billion (Aug 1990) → $896 million (Jan 1991)", "India faces a balance of payments crisis"],
    },
  },
  {
    id: "TV-GoldMay",
    props: {
      date: "MAY 1991",
      dateline: "BOMBAY  ·  MAY 1991",
      headline: "20 tonnes of gold sent abroad",
      subline: "Moved through SBI to Union Bank of Switzerland, raising about $200 million",
      bigNumber: "20 TONNES",
      icon: "gold",
      ticker: ["About 20 tonnes of confiscated gold moved abroad", "Deal raises roughly $200 million", "Foreign exchange reserves critically low"],
    },
  },
  {
    id: "TV-GoldJuly",
    props: {
      date: "JUL. 1991",
      dateline: "BOMBAY  ·  JULY 1991",
      headline: "RBI pledges gold to raise $400 million",
      subline: "46.91 tonnes pledged with the Bank of England and the Bank of Japan",
      bigNumber: "46.91 TONNES",
      icon: "gold",
      ticker: ["Reserve Bank pledges 46.91 tonnes of gold", "Gold to be flown to London", "Loan of about $400 million"],
    },
  },
  {
    id: "TV-Rupee",
    props: {
      date: "JUL. 1991",
      dateline: "NEW DELHI  ·  JULY 1991",
      headline: "Rupee devalued in two steps",
      subline: "Cuts on 1 and 3 July add up to about 18–19%",
      bigNumber: "≈ 18–19%",
      icon: "rupee",
      ticker: ["Rupee devalued on 1 July", "Second devaluation on 3 July", "Total cut of about 18–19%"],
    },
  },
  {
    id: "TV-Budget",
    props: {
      date: "JUL. 24 1991",
      dateline: "NEW DELHI  ·  24 JULY 1991",
      headline: "Licensing scrapped for all but 18 industries",
      subline: "New industrial policy and Union Budget announced the same day",
      icon: "parliament",
      ticker: ["Finance Minister Manmohan Singh presents the Budget", "“No power on earth can stop an idea whose time has come”", "Industrial licensing ends for all but 18 industries"],
    },
  },
];

export const PAPERS: { id: string; props: NewspaperProps }[] = [
  {
    id: "Paper-Gold",
    props: {
      date: "BOMBAY  ·  JULY 1991",
      price: "Rs. 2.00",
      headline: "RBI Pledges Gold Abroad",
      deck: "The Reserve Bank pledges 46.91 tonnes of gold with the Bank of England and the Bank of Japan",
      highlight: "46.91 tonnes of gold",
      columns: [
        { title: "Loan of about $400 million", body: "The pledge raises about $400 million to help the country meet its foreign payments. The gold has to be physically flown to London." },
        { title: "Earlier, 20 tonnes in May", body: "In May, about 20 tonnes of confiscated gold were moved through the State Bank of India to Union Bank of Switzerland, raising roughly $200 million." },
        { title: "Reserves at a critical low", body: "Foreign exchange reserves fell from $3.1 billion in August 1990 to $896 million in January 1991, as the Gulf War pushed up oil prices." },
      ],
    },
  },
  {
    id: "Paper-Rupee",
    props: {
      date: "NEW DELHI  ·  JULY 1991",
      price: "Rs. 2.00",
      headline: "Rupee Devalued Twice in Three Days",
      deck: "Cuts on 1 and 3 July add up to about 18 to 19 per cent",
      highlight: "about 18 to 19 per cent",
      columns: [
        { title: "Two steps in one week", body: "The rupee was devalued on 1 July and again on 3 July 1991. Together, the two steps cut its value by about 18 to 19 per cent." },
        { title: "New government acts fast", body: "The government of P. V. Narasimha Rao took office in June 1991, with Manmohan Singh as Finance Minister." },
        { title: "Budget later this month", body: "The Union Budget is due later in July. The crisis has put economic reform at the top of the government's agenda." },
      ],
    },
  },
  {
    id: "Paper-Budget",
    props: {
      date: "NEW DELHI  ·  25 JULY 1991",
      price: "Rs. 2.00",
      headline: "Licensing Scrapped for All but 18 Industries",
      deck: "Manmohan Singh: “No power on earth can stop an idea whose time has come”",
      highlight: "“No power on earth can stop an idea whose time has come”",
      columns: [
        { title: "A new industrial policy", body: "Announced on 24 July 1991, the new policy ends industrial licensing for all but 18 industries." },
        { title: "The Budget", body: "Finance Minister Manmohan Singh presented the Union Budget on the same day, setting out a programme of economic reform." },
        { title: "Reserves still fragile", body: "Foreign exchange reserves remain low after months of crisis. Earlier this month, the Reserve Bank pledged gold abroad." },
      ],
    },
  },
];

// A preview reel: all 8 graphics back to back (each 8 seconds)
export const NEWS_REEL_DURATION = (BULLETINS.length + PAPERS.length) * CLIP;
export const NewsReel: React.FC = () => {
  const all: React.ReactNode[] = [];
  const order = [BULLETINS[0], PAPERS[0], BULLETINS[1], BULLETINS[2], BULLETINS[3], PAPERS[1], BULLETINS[4], PAPERS[2]];
  order.forEach((item, i) => {
    const isPaper = "deck" in item.props;
    all.push(
      <Sequence key={item.id} from={i * CLIP} durationInFrames={CLIP}>
        {isPaper ? <Newspaper {...(item.props as NewspaperProps)} /> : <TVBulletin {...(item.props as TVBulletinProps)} />}
      </Sequence>,
    );
  });
  return <AbsoluteFill style={{ backgroundColor: "#000" }}>{all}</AbsoluteFill>;
};
export const NEWS_REEL_ORDER = ["TV-Reserves", "Paper-Gold", "TV-GoldMay", "TV-GoldJuly", "TV-Rupee", "Paper-Rupee", "TV-Budget", "Paper-Budget"];

import React from "react";
import { RoughNotation } from "react-rough-notation";

const FEATURES_EN = [
  {
    title: "Intelligent Content Extraction",
    content: "Automatically identify and extract the core content of blog or forum posts—filtering out ads, pop-ups, and clutter—to ensure every comment stays on topic.",
    //icon: BsGithub,
    icon: "🔍"
  },
  {
    title: "Natural Comment Generation",
    content: "One-click creation of comments that look and feel natural, relevant, and engaging, with quick controls for persona, tone, style, and interaction level.",
    //icon: FaMobileScreenButton,
    icon: "🤖"
  },
  {
    title: "Seamless Link Embedding",
    content: "Embed promo links naturally within comments, making them unobtrusive and boosting your promotional impact.",
    //icon: FaToolbox,
    icon: "🔗"
  },
  {
    title: "Bulk Comment Generation",
    content: "Generate multiple personalized comments at once—each with its own embedded link—perfect for SEO link building and content marketing.",
    //icon: MagnetIcon,
    icon: "📦"
  },
  {
    title: "Auto-Detect & Fill Comment Forms",
    content: `Automatically detect page comment fields (name, email, website, comment content) and fill them in—no more manual copy-pasting.`,
    //icon: MdCloudUpload,
    icon: "⚡"
  },
  {
    title: "Local Privacy First",
    content: "All data (links, preferences, settings) stay in your browser—no personal information collected.",
    //icon: FaEarthAsia,
    icon: "🔐"
  },
];

const Feature = ({
  id
}: {
  id: string;
}) => {
  return (
    <section
      id={id}
      className="flex flex-col justify-center lg:max-w-7xl md:max-w-5xl w-[95%] mx-auto md:gap-14 pt-16"
    >
      <h2 className="text-center text-white text-4xl sm:text-6xl font-sans font-bold tracking-tight">
        <RoughNotation type="highlight" show={true} color="#2563EB">
          Features
        </RoughNotation>
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
        {FEATURES_EN?.map((feature, index) => (
          <div
            key={feature.title}
            className={`
              flex flex-col items-center text-center px-8 py-6 border-b dark:border-zinc-700
              ${index === 0 ? "md:border-r" : ""}
              ${index === 1 ? "lg:border-r" : ""}
              ${index === 2 ? "md:border-r lg:border-r-0" : ""}
              ${index === 3 ? "lg:border-b-0 lg:border-r" : ""}
              ${index === 4 ? "md:border-b-0 md:border-r" : ""}
              ${index === 5 ? "border-b-0 border-r-0" : ""}
            `}
          >
            <div className="p-4 w-16 h-16 dark:text-white rounded-full flex items-center justify-center">
              {feature.icon && typeof feature.icon === "string" ? (
                <span className="text-2xl">{feature.icon}</span>
              ) : (
                React.createElement(feature.icon, { className: "text-2xl" })
              )}
            </div>
            <h2 className={"text-xl font-semibold mb-2"}>{feature.title}</h2>
            <p className="text-slate-700 dark:text-slate-400"
              dangerouslySetInnerHTML={{ __html: feature.content }}>
            </p>
          </div>
        ))}
      </div>
    </section>
  );
};

export default Feature;

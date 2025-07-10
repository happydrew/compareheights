"use client";
import { Accordion, AccordionItem } from "@nextui-org/react";
import { PlusIcon } from "lucide-react";
import { RoughNotation } from "react-rough-notation";

// update rough notation highlight
function triggerResizeEvent() {
  const event = new Event("resize");
  window.dispatchEvent(event);
}

const FAQS_EN = [
  {
    "title": "Which websites does AutoCommentAI support?",
    "content": "💡 Works on most blogs, news sites, and forum platforms like WordPress, Disqus, Reddit, and more—as long as there’s a standard comment form."
  },
  {
    "title": "How do I customize comment style?",
    "content": "🎨 Open the sidebar's \"Style Settings\" to select presets like Formal, Casual, Humorous, or adjust tone, role, and length manually."
  },
  {
    "title": "Can I include different links in batch comments?",
    "content": "🔗 Absolutely! Assign different URLs to each comment or let the extension distribute them automatically."
  },
  {
    "title": "How is my privacy protected?",
    "content": "🛡️ All your data is stored locally in your browser. We never collect, upload, or analyze your personal information."
  },
  {
    "title": "How does billing work?",
    "content": "💰 We use a fair, pay-as-you-go model. You're only billed based on the actual AI usage to generate comments—no hidden fees or subscriptions."
  },
  {
    "title": "Can I set a desired comment length?",
    "content": "✍️ Yes! You can choose from short, medium, or long comments with a single click depending on your needs."
  },
  {
    "title": "What if a page’s layout isn’t recognized?",
    "content": "🧩 If the plugin doesn't automatically detect content, simply paste the text manually. You can also report the issue to us and we'll follow up promptly with support and updates."
  },
  {
    "title": "Can I set the anchor text for inserted links?",
    "content": "🔠 Absolutely. The extension offers four flexible options for setting anchor text: use the page title, manually input your own, pick from a random list, or let AI generate it for you—all accessible from the plugin interface."
  }
];

const FAQ = ({
  id
}: {
  id: string;
}) => {

  return (
    <section
      id={id}
      className="flex flex-col justify-center max-w-[88%] items-center py-16 gap-12"
    >
      <div className="flex flex-col text-center gap-4">
        <h2 className="text-center text-white text-4xl sm:text-6xl font-sans font-bold">
          <RoughNotation type="highlight" show={true} color="#2563EB">
            FAQs
          </RoughNotation>
        </h2>
        <p className="text-lg leading-7 text-[#71717a]">Here are some of the most frequently asked questions.</p>
      </div>
      <Accordion
        fullWidth
        keepContentMounted
        className="gap-3"
        itemClasses={{
          base: "px-6 !bg-[#f4f4f5] !shadow-none hover:!bg-[#ededed] rounded-2xl dark:!bg-[#252526] dark:!text-white dark:hover:!bg-[#1e1e1e]",
          title: "text-left font-medium mb-2",
          trigger: "py-6 focus:outline-none flex justify-between items-center",
          content: "pt-0 pb-6 text-base text-gray-500 dark:text-gray-400",
        }}
        items={FAQS_EN}
        selectionMode="multiple"
        variant="splitted"
        onSelectionChange={triggerResizeEvent}
      >
        {FAQS_EN?.map((item) => (
          <AccordionItem
            key={item.title}
            indicator={<PlusIcon className="text-gray-500" />}
            title={item.title}
            HeadingComponent="h3"
          >
            {item.content}
          </AccordionItem>
        ))}
      </Accordion>
    </section>
  );
};

export default FAQ;

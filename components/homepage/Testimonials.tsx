/* eslint-disable react/no-unescaped-entities */
import { TwitterIcon } from '@components/icons';
import Image from "next/image";
import Link from "next/link";
import { RoughNotation } from "react-rough-notation";

const TestimonialsData = [
  {
    "user": {
      "name": "Mingzhi Jin",
      "username": "SEO Specialist",
      "image": "/assets/users/6.webp"
    },
    "content": "The plugin is extremely useful. It automatically extracts content and generates comments with one click, and supports multiple tones and formats. Especially impressive is its ability to insert links—it covers almost all types of blog link formats. You can also send multiple comments with different links at once, significantly boosting commenting efficiency. The developer responds quickly to feedback and bug fixes. Highly recommended!"
  },
  {
    "user": {
      "name": "Xing Xiong",
      "username": "Niche Site Owner",
      "image": "/assets/users/1.webp"
    },
    "content": "Awesome—it's seriously powerful! The developer is very skilled, and this tool makes link-building incredibly convenient. Total no-brainer 😅. Thank you for the amazing work!"
  },
  {
    "user": {
      "name": "Jack L.",
      "username": "Indie Developer",
      "image": "/assets/users/2.webp"
    },
    "content": "This massively improved my link-building efficiency! I used to ask AI for replies and manually tweak and paste links—now with this tool, it’s just one click. So easy~ ^^ The developer responds quickly to feedback—what I suggested in the morning was already improved by the evening. With such dedication, I believe this tool will only keep getting better."
  },
  {
    "user": {
      "name": "Nova Lv",
      "username": "Content Marketer",
      "image": "/assets/users/5.webp"
    },
    "content": "I’ve been using it for just under ten days, and it’s already proven very convenient. Though there are a few minor bugs, it greatly improves link-building efficiency overall. You don’t need to constantly ask AI for help. The developer is super responsive to user feedback and keeps optimizing the tool. Basically, every request made in the user group gets addressed."
  },
  {
    "user": {
      "name": "Keyuantai",
      "username": "Freelancer",
      "image": "/assets/users/4.webp"
    },
    "content": "The auto comment generation feature is incredibly useful and significantly boosted my productivity. The developer also updates frequently—new features were rolled out within 24 hours based on feedback. Looking forward to more!"
  },
  {
    "user": {
      "name": "Ez f",
      "username": "SEO Analyst",
      "image": "/assets/users/3.webp"
    },
    "content": "I've used this tool for about a week. It's definitely helpful—writing comments used to be a headache, but now my efficiency has skyrocketed with this tool."
  }
];

const Testimonials = ({ id }: { id: string }) => {
  return (
    <section
      id={id}
      className="flex flex-col justify-center items-center pt-16 gap-12 max-w-[88%]"
    >
      <div className="flex flex-col text-center max-w-xl gap-4">
        <h2 className="text-center text-white text-4xl sm:text-6xl font-sans font-bold">
          <RoughNotation type="highlight" show={true} color="#2563EB">
            Testimonials
          </RoughNotation>
        </h2>
        <p className="text-lg leading-7 text-[#71717a]">
          {/* Don't take our word for it. Here's what they have to say. */}
          If you use AutoCommentAI and recommend it on your Twitter,{" "}
          <Link
            href="https://x.com/auto_comment_ai"
            target="_blank"
            rel="noopener noreferrer nofollow"
            className="text-primary underline"
          >
            please let me know
          </Link>
          . I will display your tweet and recommendation here.
        </p>
      </div>
      <div className="columns-1 sm:columns-2 lg:columns-3 gap-4 overflow-hidden relative transition-all">
        {TestimonialsData.map((testimonial, index) => (
          <div className="mb-4 z-0 break-inside-avoid-column" key={index}>
            <div className="border border-slate/10 dark:border-zinc-700 rounded-lg p-4 flex flex-col items-start gap-3 h-fit">
              <div className="flex items-start justify-between w-full">
                <div className="flex items-start gap-2">
                  <Image
                    src={testimonial.user.image}
                    alt="maker"
                    height={40}
                    width={40}
                    className="w-12 h-12 rounded-full object-cover object-top"
                  />
                  <div className="flex flex-col items-start">
                    <p className="font-bold">{testimonial.user.name}</p>
                    <p className="dark:text-zinc-400">
                      @{testimonial.user.username}
                    </p>
                  </div>
                </div>
                <Link
                  href={`https://twitter.com/${testimonial.user.username}`}
                  target="_blank"
                  rel="noopener noreferrer nofollow"
                >
                  {/* <TwitterIcon className="w-8 h-8" /> */}
                </Link>
              </div>
              <p className="dark:text-zinc-200 text-[14px]">
                {testimonial.content}
              </p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

export default Testimonials;
